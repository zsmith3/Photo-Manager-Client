export enum DBTables {
	File = "files",
	Face = "faces",
	Album = "albums",
	Person = "people",
	PersonGroup = "person-groups",
	GeoTagArea = "geotag-areas",
	GeoTag = "geotags"
}

/** Platform-specific Database interface */
abstract class BaseDatabase {
	/**
	 * Get model instance from table by ID
	 * @param table Model table name
	 * @param id ID of requested model instance
	 * @returns Promise object representing fetched model instance data
	 */
	abstract get (table: DBTables, id?: (number | string)): Promise<any>
	// TODO separate versions with and without ID

	/**
	 * Create new model instance
	 * @param table Model table name
	 * @param data Data object from which to create new instance
	 * @returns Promise object representing new model instance data
	 */
	abstract create (table: DBTables, data: any): Promise<any>

	/**
	 * Update existing model instance
	 * @param table Model table name
	 * @param id ID of model instance to update
	 * @param data Data object from which to update instance
	 * @returns Promise object representing updated model instance data
	 */
	abstract update (table: DBTables, id: (number | string), data: any): Promise<any>

	/**
	 *
	 * @param table Model table name
	 * @param id ID of model instance to delete
	 * @returns Promise object representing completion
	 */
	abstract delete (table: DBTables, id: (number | string)): Promise<never>
};

export var Database: BaseDatabase;

// TODO make actual temporary database class for testing now
// (can later move to web-only)
// then look at loading stuff from API properly (and ofc reform api as needed)
// then add filescontainer type thing, etc.
