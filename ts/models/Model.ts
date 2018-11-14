import { Database, DBTables } from "../controllers/Database";


/** Options for ModelMeta.loadState */
enum ModelLoadStates {
	notLoaded = 0,
	loading = 1,
	loaded = 2
}

/** Type for use in specialProps */
type SpecialPropMethod = { deserialize? (instance: Model, prop: any): void, serialize? (obj: {}, prop: any): void }

/** Class to store static metadata for Model classes */
export class ModelMeta<M extends Model> {
	/** List of instances of the model */
	objects: M[] = []

	/** Name of the database table associated with the model */
	modelName: DBTables

	/** List of standard properties (with one-to-one mappings to database properties) */
	props: string[]

	/** List of special properties (where mapping from database to local is more complex) */
	specialProps: { [key: string]: (SpecialPropMethod | string) } = null

	/** Handler functions to be called when the objects list is updated */
	listUpdateHandlers: ((models: M[]) => void)[] = []

	/** Current Promise object representing the loading of all instances from the database */
	loadingPromise: Promise<M[]> = null

	/** The current state of loading of all instances from the database */
	loadState: ModelLoadStates = ModelLoadStates.notLoaded

	/**
	 * ModelMeta constructor
	 * @param data Data object containing values for properties of ModelMeta instance
	 */
	constructor (data: { modelName: DBTables, props: string[], specialProps?: { [key: string]: (SpecialPropMethod | string) } }) {
		for (let prop in data) this[prop] = data[prop];
	}
}


/** Base Model class */
export class Model {
	/** Metadata for the Model type */
	static meta: ModelMeta<Model>

	// Hack to allow for usage in "this.constructor"
	"constructor": { meta: ModelMeta<Model> };


	/**
	 * Add a new model instance to the local list (from the API)
	 * @param this Subclass of Model
	 * @param obj Data representing new instance of model
	 * @returns Created instance of model
	 */
	static addObject<M extends Model> (this: { new (...args: any[]): M, handleListUpdate(): void }, obj: object, handleUpdate=false): M {
		let object = new this(obj);

		if (handleUpdate) this.handleListUpdate();

		return object;
	}

	/**
	 * Append new model instances to the local list (from the API)
	 * @param this Subclass of Model
	 * @param list List of objects representing new instances of model
	 */
	static addObjects<M extends Model> (this: { new (...args: any[]): M, addObject (obj: object, handleUpdate: boolean): void, handleListUpdate (): void }, list: object[]): void {
		list.forEach(item => this.addObject(item, false));

		this.handleListUpdate();
	}

	/**
	 * Set (overwrite) the local list of model instances
	 * @param this Subclass of Model
	 * @param list List of objects representing new instances of model
	 * @returns List of created model instances
	 */
	static setObjects<M extends Model> (this: { new (...args: any[]): M, meta: ModelMeta<M>, addObjects (list: object[]): void }, list: object[]): M[] {
		this.meta.objects = [];
		this.addObjects(list);
		return this.meta.objects;
	}

	/**
	 * Update a selection of the local model instances
	 * @param this Subclass of Model
	 * @param list List of objects representing updated instances of model
	 */
	static updateObjects<M extends Model> (this: { new (...args: any[]): M, getById (id: (number | string)): M }, list: { id: (number | string) }[]): void {
		list.forEach(item => this.getById(item.id).update(item));
	}

	/**
	 * Get a model instance from the local list from its ID
	 * @param this Subclass of Model
	 * @param id ID of requested model instance
	 * @returns Model instance with specified ID
	 */
	static getById<M extends Model> (this: { new (...args: any[]): M, meta: ModelMeta<M> }, id: (number | string)): M {
		let item = this.meta.objects.find(obj => obj.id == id);
		if (item === undefined) {
			console.error(`Model not found: ${this.meta.modelName} ${id}`);
		} else {
			return item;
		}
	}

	/**
	 * Delete a model instance from the local list from its ID
	 * @param this Subclass of Model
	 * @param id ID of model instance to delete
	 */
	static deleteById<M extends Model> (this: { new (...args: any[]): M, meta: ModelMeta<M>, handleListUpdate(): void }, id: (number | string)): void {
		for (let i in this.meta.objects) {
			if (this.meta.objects[i].id == id) delete this.meta.objects[i];
		}

		this.handleListUpdate();
	}

	/**
	 * Register handler function to be executed when model list is updated
	 * @param callback Handler function, taking the model list as an argument
	 */
	static registerUpdateHandler<M extends Model> (this: { new (...args: any[]): M, meta: ModelMeta<M>, loadAll (): Promise<M[]> }, callback: (models: M[]) => void): Promise<M[]> {
		this.meta.listUpdateHandlers.push(callback);

		if (this.meta.loadState === ModelLoadStates.loaded) {
			callback(this.meta.objects);
			return Promise.resolve(this.meta.objects);
		} else return this.loadAll();
	}

	/**
	 * Load all instances of this Model type
	 */
	static loadAll<M extends Model> (this: { new (...args: any[]): M, meta: ModelMeta<M>, setObjects (list: object[]): M[] }): Promise<M[]> {
		if (this.meta.loadState !== ModelLoadStates.loading) {
			this.meta.loadState = ModelLoadStates.loading;
			this.meta.loadingPromise = new Promise((resolve, reject) => {
				Database.get(this.meta.modelName).then((data) => {
					this.meta.loadState = ModelLoadStates.loaded;
					resolve(this.setObjects(data));

					delete this.meta.loadingPromise;
				}).catch(reject);
			});
		}

		return this.meta.loadingPromise;
	}

	/**
	 * Execute update handler functions on model list (to be run whenever model list updated)
	 */
	static handleListUpdate<M extends Model> (this: { new (...args: any[]): M, meta: ModelMeta<M> }) {
		this.meta.listUpdateHandlers.forEach((callback: (models: M[]) => void) => callback(this.meta.objects));
	}


	/** ID property for all models */
	id: (number | string)

	/** Handler functions for model instance update */
	private updateHandlers: ((model: Model) => void)[] = []


	/**
	 * Construct a new Model instance (overridden)
	 * @param obj Data object from which to construct the new model instance
	 */
	constructor (obj: object) {
		this.update(obj);

		this.constructor.meta.objects.push(this);
	}

	/**
	 * Update model instance properties from data object
	 * @param obj Data object from which to update model instance
	 */
	update (obj: object, noUpdateHandler=false): void {
		// Assign properties
		for (let property in obj) {
			if (this.constructor.meta.specialProps !== null && property in this.constructor.meta.specialProps) {
				let methodForm = <SpecialPropMethod>this.constructor.meta.specialProps[property];
				let stringForm = <string>this.constructor.meta.specialProps[property];
				if (methodForm.deserialize) {
					methodForm.deserialize(this, obj[property]);
				} else {
					this[stringForm] = obj[property];
				}
			} else if (this.constructor.meta.props.indexOf(property) !== -1) {
				this[property] = obj[property];
			}
		}

		// Check for problems in data object shape
		let missedProps = this.constructor.meta.props.filter((prop) => !(prop in obj));
		let extraProps = Object.keys(obj).filter((prop) => this.constructor.meta.props.indexOf(prop) === -1 && (this.constructor.meta.specialProps === null || !(prop in this.constructor.meta.specialProps)));
		if (missedProps.length > 0) console.warn(`Missed properties on data for ${this.constructor.meta.modelName} ${this.id}: ${missedProps.join(", ")}`);
		if (extraProps.length > 0) console.warn(`Extra properties on data for ${this.constructor.meta.modelName} ${this.id}: ${extraProps.join(", ")}`);

		// Trigger model update handlers
		if (!noUpdateHandler) this.updateHandlers.forEach((callback: (model: Model) => void) => callback(this));
	}

	/**
	 * Update model instance and save changes to database
	 * @param obj Data object from which to update model instance
	 * @returns Promise object representing completion
	 */
	async updateSave (obj: object): Promise<void> {
		this.update(obj, true);
		const data = await this.save();
		return this.update(data);
	}

	/**
	 * Save local model instance changes to the database
	 * @returns Promise object representing completion
	 */
	save (): Promise<any> {
		let obj = {};

		for (let prop in this.constructor.meta.props) {
			if (prop in this) obj[prop] = this[prop];
		}

		for (let prop in this.constructor.meta.specialProps) {
			let methodForm = <SpecialPropMethod>this.constructor.meta.specialProps[prop];
			let stringForm = <string>this.constructor.meta.specialProps[prop];
			if (methodForm.serialize && prop in this) {
				methodForm.serialize(obj, this[prop]);
			} else {
				obj[prop] = this[stringForm];
			}
		}

		return Database.update(this.constructor.meta.modelName, this.id, obj);
	}

	/**
	 * Register handler function to be executed when this model instance is updated
	 * @param callback Handler function, taking the model as an argument
	 */
	registerUpdateHandler<M extends Model> (this: M, callback: (model: M) => void) {
		this.updateHandlers.push(callback);
	}
}
