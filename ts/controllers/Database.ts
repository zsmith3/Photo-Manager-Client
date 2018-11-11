import { apiRequest, httpMethodTypes } from "../utils";
import { LocationManager } from "../components/App";

export enum DBTables {
	File = "files",
	Face = "faces",
	Album = "albums",
	Person = "people",
	PersonGroup = "people-groups",
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
	abstract delete (table: DBTables, id: (number | string)): Promise<any>


	/** Authorisation-related functions */
	auth: {
		/**
		 * Determine whether the user is authorised to access the database
		 * @returns Promise object representing whether or not user is authorised
		 */
		checkAuth (): Promise<boolean>

		/** Log the user in (using localStorage) */
		logIn (username: string, password: string, remain_in: boolean): Promise<never>

		/** Log the user out */
		logOut (): void
	}
};


/** Database interface for web application */
class WebDatabase extends BaseDatabase {
	/**
	 * Generic API request method
	 * @param type HTTP Method type for request
	 * @param table Database table (URL) to request from
	 * @param id ID of object
	 * @param data HTTP request body data
	 */
	private request (type: httpMethodTypes, table: string, id?: (number | string), data?: any) {
		let path = table + "/" + (id ? (id + "/") : "");

		return apiRequest(path, type, data);
	}

	// Interfaces to specific request methods

	get (table: DBTables, id?: (number | string)): Promise<any> {
		return this.request("GET", table, id);
	}

	create (table: DBTables, data: any): Promise<any> {
		return this.request("POST", table, null, data);
	}

	update (table: DBTables, id: (number | string), data: any): Promise<any> {
		return this.request("PATCH", table, id, data);
	}

	delete (table: DBTables, id: (number | string)): Promise<any> {
		return this.request("DELETE", table, id);
	}

	auth = {
		checkAuth (): Promise<boolean> {
			return new Promise((resolve) => {
				apiRequest("membership/status/").then((data) => {
					if (data.authenticated) {
						// TODO use data.user.full_name;

						window.sessionStorage.setItem("csrf_token", data.csrf_token);

						resolve(true);
					} else {
						Database.auth.logOut();
						resolve(false);
					}
				}).catch(() => {
					Database.auth.logOut();
					resolve(false);
				});
			});
		},

		logIn (username: string, password: string, remain_in: boolean): Promise<never> {
			return new Promise((resolve, reject) => {
				apiRequest("membership/login/", "POST", { username: username, password: password }).then((data) => {
					if (remain_in) window.localStorage.setItem("jwtToken", data.token);
					else window.sessionStorage.setItem("jwtToken", data.token);

					resolve();
				}).catch(reject);
			});
		},

		logOut (): void {
			window.sessionStorage.removeItem("jwtToken");
			window.localStorage.removeItem("jwtToken");
			LocationManager.updateLocation("/login");
		}
	}
};

export const Database = new WebDatabase();
