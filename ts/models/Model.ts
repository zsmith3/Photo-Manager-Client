import { Database, DBTables } from "../controllers/Database";

/** Base Model class */
export class Model {
	/** Base Model objects array, to store local instances of Model */
	static objects: Model[]
	static modelName : DBTables
	static props: string[]
	static specialProps: {
		[key: string]: (instance: Model, prop: any) => any
	}
	"constructor": { objects: Model[], specialProps: { [key: string]: (instance: Model, prop: any) => any }, modelName: DBTables, props: string[] };

	/** Update handlers for the list of models */
	static listUpdateHandlers: ((models: Model[]) => void)[]


	/**
	 * Add a new model instance to the local list (from the API)
	 * @param this Subclass of Model
	 * @param obj Data representing new instance of model
	 * @returns Created instance of model
	 */
	static addObject<M extends Model> (this: { new (...args: any[]): M, objects: M[], handleListUpdate(): void }, obj: object, handleUpdate=false): M {
		let object = new this(obj);

		if (handleUpdate) this.handleListUpdate();

		return object;
	}

	/**
	 * Append new model instances to the local list (from the API)
	 * @param this Subclass of Model
	 * @param list List of objects representing new instances of model
	 */
	static addObjects<M extends Model> (this: { new (...args: any[]): M, objects: M[], addObject (obj: object, handleUpdate: boolean): void, handleListUpdate (): void }, list: object[]): void {
		for (let i in list) {
			this.addObject(list[i], false);
		}

		this.handleListUpdate();
	}

	/**
	 * Set (overwrite) the local list of model instances
	 * @param this Subclass of Model
	 * @param list List of objects representing new instances of model
	 * @returns List of created model instances
	 */
	static setObjects<M extends Model> (this: { new (...args: any[]): M, objects: M[], addObjects (list: object[]): void }, list: object[]): M[] {
		this.objects = [];
		this.addObjects(list);
		return this.objects;
	}

	/**
	 * Update a selection of the local model instances
	 * @param this Subclass of Model
	 * @param list List of objects representing updated instances of model
	 */
	static updateObjects<M extends Model> (this: { new (...args: any[]): M, objects: M[], getById (id: (number | string)): M }, list: { id: (number | string)}[]): void {
		for (let i in list) {
			this.getById(list[i].id).update(list[i]);
		}
	}

	/**
	 * Get a model instance from the local list from its ID
	 * @param this Subclass of Model
	 * @param id ID of requested model instance
	 * @returns Model instance with specified ID
	 */
	static getById<M extends Model> (this: { new (...args: any[]): M, objects: M[] }, id: (number | string)): M {
		let item = this.objects.find(obj => obj.id == id);
		if (item === undefined) {
			console.log("error");
		} else {
			return item;
		}
	}

	/**
	 * Delete a model instance from the local list from its ID
	 * @param this Subclass of Model
	 * @param id ID of model instance to delete
	 */
	static deleteById<M extends Model> (this: { new (...args: any[]): M, objects: M[], handleListUpdate(): void }, id: (number | string)): void {
		for (let i in this.objects) {
			if (this.objects[i].id == id) delete this.objects[i];
		}

		this.handleListUpdate();
	}

	/**
	 * Register handler function to be executed when model list is updated
	 * @param callback Handler function, taking the model list as an argument
	 */
	static registerUpdateHandler<M extends Model> (this: { new (...args: any[]): M, objects: M[], loadAll (): void, listUpdateHandlers: ((models: M[]) => void)[] }, callback: (models: M[]) => void): void {
		this.listUpdateHandlers.push(callback);

		this.loadAll();
	}

	/**
	 * Load all instances of this Model type
	 */
	static loadAll<M extends Model> (this: { new (...args: any[]): M, objects: M[], modelName: DBTables, setObjects (list: object[]): M[] }) {
		return new Promise((resolve, reject) => {
			Database.get(this.modelName).then((data) => {
				resolve(this.setObjects(data));
			}).catch(reject);
		});
	}

	/**
	 * Execute update handler functions on model list (to be run whenever model list updated)
	 */
	static handleListUpdate<M extends Model> (this: { new (...args: any[]): M, objects: M[], listUpdateHandlers: ((models: M[]) => void)[] }) {
		this.listUpdateHandlers.forEach((callback: (models: M[]) => void) => callback(this.objects));
	}


	/** ID property for all models */
	id: (number | string)

	/** Handler functions for model update */
	private updateHandlers: ((model: Model) => void)[] = []


	/**
	 * Construct a new Model instance (overridden)
	 * @param obj Data object from which to construct the new model instance
	 */
	constructor (obj: object) {
		this.update(obj);

		this.constructor.objects.push(this);
	}

	/**
	 * Update model instance properties from data object
	 * @param obj Data object from which to update model instance
	 */
	update (obj: object): void {
		for (let property in obj) {
			if (this.constructor.specialProps !== undefined && property in this.constructor.specialProps) {
				this.constructor.specialProps[property](this, obj[property]);
			} else if (this.constructor.props.indexOf(property) !== -1) {
				this[property] = obj[property];
			}
		}

		this.updateHandlers.forEach((callback: (model: Model) => void) => callback(this));
	}

	/**
	 * Register handler function to be executed when this model instance is updated
	 * @param callback Handler function, taking the model as an argument
	 */
	registerUpdateHandler<M extends Model> (this: M, callback: (model: M) => void) {
		this.updateHandlers.push(callback);
	}
}
