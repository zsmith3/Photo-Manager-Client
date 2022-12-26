import { Database, DBTables } from "../controllers/Database";
import { UpdateHandlerList } from "../utils";

/** Options for ModelMeta.loadState */
enum ModelLoadStates {
	notLoaded = 0,
	loading = 1,
	loaded = 2
}

/** Type for use in filtering Model queries */
export type FilterType = {
	field: string;
	type: "exact" | "in" | "isnull";
	value: any;
};

/** Type for use in specialProps */
type SpecialPropMethod = {
	deserialize?(instance: Model, prop: any): void;
	serialize?(obj: {}, prop: any): void;
};

/** Class to store static metadata for Model classes */
export class ModelMeta<M extends Model> {
	/** List of instances of the model */
	objects: M[] = [];

	/** Mapping between model id and local array index */
	objectsIdIndexMap = new Map<number, number>();

	/** Name of the database table associated with the model */
	modelName: DBTables;

	/** List of standard properties (with one-to-one mappings to database properties) */
	props: string[];

	/** List of special properties (where mapping from database to local is more complex) */
	specialProps: { [key: string]: SpecialPropMethod | string } = null;

	/** Handler functions to be called when the objects list is updated */
	listUpdateHandlers: UpdateHandlerList = new UpdateHandlerList([]);

	/** Current Promise object representing the loading of all instances from the database */
	loadingPromise: Promise<M[]> = null;

	/** The current state of loading of all instances from the database */
	loadAllState: ModelLoadStates = ModelLoadStates.notLoaded;

	/** The current state of loading of specific instances from the database */
	loadStates: Map<number, ModelLoadStates> = new Map();

	/** Handler functions to run when specific instances are loaded */
	loadHandlers: Map<number, ((model: M) => void)[]> = new Map();

	/** Handler functions to run when loading an instance fails */
	errorHandlers: Map<number, (() => void)[]> = new Map();

	/**
	 * ModelMeta constructor
	 * @param data Data object containing values for properties of ModelMeta instance
	 */
	constructor(data: { modelName: DBTables; props: string[]; specialProps?: { [key: string]: SpecialPropMethod | string } }) {
		for (let prop in data) this[prop] = data[prop];
	}

	/**
	 * Add a callback to loadHandlers
	 * @param id ID to insert at
	 * @param callback Callback to add
	 */
	addIdLoadHandler(id: number, callback: (model: M) => void, onerror: () => void) {
		let list = this.loadHandlers.get(id);
		if (list) list.push(callback);
		else this.loadHandlers.set(id, [callback]);

		let errorList = this.errorHandlers.get(id);
		if (errorList) errorList.push(onerror);
		else this.errorHandlers.set(id, [onerror]);
	}
}

/** Base Model class */
export class Model {
	/** Metadata for the Model type */
	static meta: ModelMeta<Model>;

	// Hack to access "this.constructor"
	class: typeof Model;

	/** Whether this model has been deleted locally */
	deleted: boolean = false;

	/**
	 * Add a new model instance to the local list (from the API)
	 * @param obj Data representing new instance of model
	 * @returns Created instance of model
	 */
	static addObject<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			getById<M extends Model>(this: { meta: ModelMeta<M> }, id: number): M;
		},
		obj: { id: number },
		handleUpdate = true
	): M {
		let object = this.getById(obj.id);
		if (object !== null) object.update(obj);
		else object = new this(obj);

		this.meta.loadStates.set(obj.id, ModelLoadStates.loaded);

		if (handleUpdate) this.meta.listUpdateHandlers.handle(this.meta.objects);

		return object;
	}

	/**
	 * Append new model instances to the local list (from the API)
	 * @param list List of objects representing new instances of model
	 */
	static addObjects<M extends Model>(
		this: {
			new (...args: any[]): M;
			addObject(obj: object, handleUpdate: boolean): void;
			meta: ModelMeta<M>;
		},
		list: object[]
	): void {
		list.forEach(item => this.addObject(item, false));

		this.meta.listUpdateHandlers.handle(this.meta.objects);
	}

	/**
	 * Set (without overwriting) the local list of model instances
	 * @param list List of objects representing new instances of model
	 * @returns List of created model instances
	 */
	static setObjects<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			addObject(obj: { id: number }, handleUpdate?: boolean): M;
			getById(id: number): M;
		},
		list: { id: number }[]
	): M[] {
		for (let object of list) {
			let currentObj = this.getById(object.id);
			if (currentObj !== null) {
				currentObj.update(object);
			} else this.addObject(object, false);
		}

		this.meta.listUpdateHandlers.handle(this.meta.objects);

		return this.meta.objects;
	}

	/**
	 * Update a selection of the local model instances
	 * @param list List of objects representing updated instances of model
	 */
	static updateObjects<M extends Model>(this: { new (...args: any[]): M; getById(id: number): M }, list: { id: number }[]): void {
		list.forEach(item => this.getById(item.id).update(item));
	}

	/**
	 * Get a model instance from the local list from its ID
	 * @param id ID of requested model instance
	 * @returns Model instance with specified ID
	 */
	static getById<M extends Model>(this: { new (...args: any[]): M; meta: ModelMeta<M> }, id: number): M {
		let index = this.meta.objectsIdIndexMap.get(id);
		if (index === undefined) return null;
		else return this.meta.objects[index];
	}

	/**
	 * Delete a model instance from the local list from its ID
	 * @param id ID of model instance to delete
	 */
	static deleteById<M extends Model>(this: { new (...args: any[]): M; meta: ModelMeta<M> }, id: number): void {
		let ind = this.meta.objectsIdIndexMap.get(id);
		if (ind === undefined) return;
		else {
			this.meta.objects.splice(ind, 1);
			for (let i = ind; i < this.meta.objects.length; i++) {
				this.meta.objectsIdIndexMap.set(this.meta.objects[i].id, i);
			}
		}

		this.meta.listUpdateHandlers.handle(this.meta.objects);
	}

	/**
	 * Register handler function to be executed when model list is updated
	 * @param callback Handler function, taking the model list as an argument
	 */
	static registerListUpdateHandler<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			loadAll(): Promise<M[]>;
		},
		callback: (models: M[]) => void
	): Promise<M[]> {
		this.meta.listUpdateHandlers.register(callback);

		if (this.meta.loadAllState === ModelLoadStates.loaded) {
			callback(this.meta.objects);
			return Promise.resolve(this.meta.objects);
		} else return this.loadAll();
	}

	/**
	 * Register handler function to be executed when a specific model is loaded
	 * @param id ID of model instance
	 * @param callback Handler function, taking the model instance as an argument
	 */
	static registerIdLoadHandler<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			getById(id: number): M;
			loadObject(id: number, refresh?: boolean): Promise<M>;
		},
		id: number,
		callback: (model: M) => void,
		onerror: () => void
	): void {
		switch (this.meta.loadStates.get(id)) {
			case ModelLoadStates.loaded:
				callback(this.getById(id));
				break;
			case ModelLoadStates.loading:
			case ModelLoadStates.notLoaded:
				this.meta.addIdLoadHandler(id, callback, onerror);
			case ModelLoadStates.notLoaded:
				this.loadObject(id);
				break;
		}
	}

	/**
	 * Load all instances of this Model type
	 * @returns Promise representing loaded model instances
	 * */
	static loadAll<M extends Model>(this: { new (...args: any[]): M; meta: ModelMeta<M>; setObjects(list: object[]): M[] }): Promise<M[]> {
		if (this.meta.loadAllState !== ModelLoadStates.loading) {
			this.meta.loadAllState = ModelLoadStates.loading;
			this.meta.loadingPromise = new Promise((resolve, reject) => {
				Database.get(this.meta.modelName)
					.then(data => {
						this.meta.loadAllState = ModelLoadStates.loaded;
						const loadedIds = data.map((obj: M) => obj.id);
						this.meta.errorHandlers.forEach((handlers, objId) => loadedIds.includes(objId) || handlers.forEach(fn => fn && fn()))
						resolve(this.setObjects(data));
						delete this.meta.loadingPromise;
					})
					.catch(reject);
			});
		}

		return this.meta.loadingPromise;
	}

	/**
	 * Load all instances of this Model type
	 * @param filters A set of filters to apply to the model query
	 * @returns Promise representing loaded model instances
	 */
	static loadFiltered<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			addObjects(list: object[]): void;
		},
		filters: FilterType[] | { [field: string]: any },
		page?: number,
		page_size?: number
	): Promise<{ count: number; objects: M[] }> {
		let filtersArray: FilterType[];
		if (filters instanceof Array) filtersArray = filters;
		else
			filtersArray = Object.keys(filters).map(field =>
				filters[field] === null ? { field: field, type: "isnull" as "isnull", value: true } : { field: field, type: "exact" as "exact", value: filters[field] }
			);

		// TODO document all modified functions (parameters)

		return new Promise((resolve, reject) => {
			Database.get(this.meta.modelName, filtersArray, page, page_size)
				.then(data => {
					let objects: any[], count: number;
					if (data instanceof Array) {
						objects = data;
						count = data.length;
					} else {
						objects = data.results;
						count = data.count;
					}

					this.addObjects(objects);
					let dataIds = objects.map(obj => obj.id);
					resolve({ count: count, objects: this.meta.objects.filter(model => dataIds.includes(model.id)) });
				})
				.catch(reject);
		});
	}

	/**
	 * Load multiple specified instances of this Model type
	 * @param ids List of model instance IDs to load
	 * @param refresh If true, all models will be reloaded, even those already present locally (default = false)
	 * @returns Promise representing loaded model instances
	 */
	static loadIds<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			addObjects(list: object[]): void;
			getById(id: number): M;
		},
		ids: number[],
		refresh = false
	): Promise<M[]> {
		return new Promise((resolve, reject) => {
			let remainingIds: number[];
			if (refresh) remainingIds = ids;
			else remainingIds = ids.filter(id => (this.meta.loadStates.get(id) || ModelLoadStates.notLoaded) === ModelLoadStates.notLoaded);

			remainingIds.forEach(id => this.meta.loadStates.set(id, ModelLoadStates.loading));
			(remainingIds.length ? Database.get(this.meta.modelName, [{ field: "id", type: "in", value: remainingIds }]) : Promise.resolve([]))
				.then(data => {
					this.addObjects(data);

					// Listen for all requested objects to be loaded

					let fn = () => {
						if (ids.filter(id => this.meta.loadStates.get(id) === ModelLoadStates.loading).length === 0) {
							resolve(this.meta.objects.filter(file => ids.includes(file.id)));
							return true;
						} else return false;
					};

					if (!fn()) {
						ids.forEach(id => {
							if (this.meta.loadStates.get(id) === ModelLoadStates.loading) {
								this.meta.addIdLoadHandler(id, fn, reject);
							}
						});
					}
				})
				.catch(reject);
			// TODO add some mechanism to register when objects have already been requested
		});
	}

	/**
	 * Load specific instance of this Model type
	 * @param id ID of the model instance to load
	 * @param refresh If true, the model data will be reloaded, even if it is already present locally (default = false)
	 * @returns Promise representing loaded model instance
	 */
	static loadObject<M extends Model>(
		this: {
			new (...args: any[]): M;
			meta: ModelMeta<M>;
			addObject(obj: object): M;
			getById(id: number): M;
		},
		id: number,
		refresh = false
	): Promise<M> {
		return new Promise((resolve, reject) => {
			if (!id && id !== 0) reject("No ID given");

			if ((this.meta.loadStates.get(id) === ModelLoadStates.loaded || this.meta.loadAllState === ModelLoadStates.loaded) && !refresh) resolve(this.getById(id));
			else if (this.meta.loadStates.get(id) === ModelLoadStates.loading || this.meta.loadAllState === ModelLoadStates.loading) this.meta.addIdLoadHandler(id, model => resolve(model), reject);
			else {
				Database.get(this.meta.modelName, id)
					.then(data => {
						let object = this.addObject(data);
						resolve(object);
					})
					.catch(reject);
			}
		});
	}

	/** ID property for all models */
	id: number;

	/** Handler functions for model instance update */
	updateHandlers: UpdateHandlerList;

	/**
	 * Construct a new Model instance (overridden)
	 * @param obj Data object from which to construct the new model instance
	 */
	constructor(obj: object) {
		// Typescript hack
		this.class = this.constructor as typeof Model;

		this.updateHandlers = new UpdateHandlerList(this);

		this.update(obj);

		let len = this.class.meta.objects.push(this);
		this.class.meta.objectsIdIndexMap.set(this.id, len - 1);

		// Execute on-load handler functions
		let loadHandlers = this.class.meta.loadHandlers.get(this.id);
		if (loadHandlers) {
			loadHandlers.forEach(callback => callback(this));
			this.class.meta.loadHandlers.set(this.id, []);
		}
	}

	/**
	 * Update model instance properties from data object
	 * (accepts specialProps by remote name rather than local name)
	 * @param obj Data object from which to update model instance
	 * @param handleUpdate Whether to run update handler functions (default = true)
	 */
	update(obj: object, handleUpdate = true): void {
		// Assign properties
		for (let property in obj) {
			if (this.class.meta.specialProps !== null && property in this.class.meta.specialProps) {
				let methodForm = <SpecialPropMethod>this.class.meta.specialProps[property];
				let stringForm = <string>this.class.meta.specialProps[property];
				if (methodForm.deserialize) {
					methodForm.deserialize(this, obj[property]);
				} else {
					this[stringForm] = obj[property];
				}
			} else if (this.class.meta.props.includes(property)) {
				this[property] = obj[property];
			}
		}

		// Check for problems in data object shape
		let missedProps = this.class.meta.props.filter(prop => !(prop in obj));
		let extraProps = Object.keys(obj).filter(prop => !this.class.meta.props.includes(prop) && (this.class.meta.specialProps === null || !(prop in this.class.meta.specialProps)));
		if (missedProps.length > 0) console.warn(`Missed properties on data for ${this.class.meta.modelName} ${this.id}: ${missedProps.join(", ")}`);
		if (extraProps.length > 0) console.warn(`Extra properties on data for ${this.class.meta.modelName} ${this.id}: ${extraProps.join(", ")}`);

		// Trigger model update handlers
		if (handleUpdate) this.updateHandlers.handle(this);
	}

	/**
	 * Update model instance and save changes to database
	 * @param obj Data object from which to update model instance
	 * @returns Promise object representing completion
	 */
	async updateSave(obj: object): Promise<void> {
		this.update(obj, true);
		const data = await this.save();
		return this.update(data);
	}

	/**
	 * Serialize model for database storage
	 * @returns Serialized model object
	 */
	serialize() {
		let obj = {};

		this.class.meta.props.forEach(prop => {
			if (prop in this) obj[prop] = this[prop];
		});

		for (let prop in this.class.meta.specialProps) {
			let methodForm = <SpecialPropMethod>this.class.meta.specialProps[prop];
			let stringForm = <string>this.class.meta.specialProps[prop];
			if (methodForm.serialize && prop in this) {
				methodForm.serialize(obj, this[prop]);
			} else if (typeof stringForm === "string") {
				obj[prop] = this[stringForm];
			}
		}

		return obj;
	}

	/**
	 * Save local model instance changes to the database
	 * @returns Promise object representing completion
	 */
	save(): Promise<any> {
		return Database.update(this.class.meta.modelName, this.id, this.serialize());
	}
}
