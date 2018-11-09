type dbTableType = ("files" | "faces" | "albums" | "people" | "people-groups" | "geotag-areas");

/** Platform-specific Database interface */
abstract class BaseDatabase {
	/**
	 * Get model instance from table by ID
	 * @param table Model table name
	 * @param id ID of requested model instance
	 * @returns Promise object representing fetched model instance data
	 */
	abstract get (table: dbTableType, id?: (number | string)): Promise<any>
	// TODO separate versions with and without ID

	/**
	 * Create new model instance
	 * @param table Model table name
	 * @param data Data object from which to create new instance
	 * @returns Promise object representing new model instance data
	 */
	abstract create (table: dbTableType, data: any): Promise<any>

	/**
	 * Update existing model instance
	 * @param table Model table name
	 * @param id ID of model instance to update
	 * @param data Data object from which to update instance
	 * @returns Promise object representing updated model instance data
	 */
	abstract update (table: dbTableType, id: (number | string), data: any): Promise<any>

	/**
	 *
	 * @param table Model table name
	 * @param id ID of model instance to delete
	 * @returns Promise object representing completion
	 */
	abstract delete (table: dbTableType, id: (number | string)): Promise<never>
};

export var Database: BaseDatabase;
