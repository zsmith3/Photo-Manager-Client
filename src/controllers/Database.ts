import { apiRequest, httpMethodTypes } from "../utils";
import { LocationManager } from "../components/utils";
import { FilterType } from "../models/Model";

/** Database table names for different models (used in API urls) */
export enum DBTables {
	Folder = "folders",
	File = "files",
	Face = "faces",
	Album = "albums",
	Person = "people",
	PersonGroup = "people-groups",
	GeoTagArea = "geotag-areas",
	GeoTag = "geotags",
	AlbumFile = "album-files"
}

/** Platform-specific Database interface */
abstract class BaseDatabase {
	/**
	 * Get model instance from table by ID
	 * @param table Model table name
	 * @param query ID of requested model instance, or array of filter queries
	 * @returns Promise representing fetched model instance data
	 */
	abstract get(table: DBTables, query?: number | FilterType[]): Promise<any>;

	/**
	 * Create new model instance
	 * @param table Model table name
	 * @param data Data object from which to create new instance
	 * @returns Promise representing new model instance data
	 */
	abstract create(table: DBTables, data: any): Promise<any>;

	/**
	 * Update existing model instance
	 * @param table Model table name
	 * @param id ID of model instance to update
	 * @param data Data object from which to update instance
	 * @returns Promise representing updated model instance data
	 */
	abstract update(table: DBTables, id: number, data: any): Promise<any>;

	/**
	 * Delete model instance from table by ID
	 * @param table Model table name
	 * @param id ID of model instance to delete
	 * @returns Promise representing completion
	 */
	abstract delete(table: DBTables, id: number): Promise<any>;

	/** Authorisation-related functions */
	auth: {
		/**
		 * Determine whether the user is authorised to access the database
		 * @returns Promise representing whether or not user is authorised
		 */
		checkAuth(): Promise<boolean>;

		/**
		 * Log the user in (using localStorage)
		 * @param username Username for authorisation
		 * @param password Password for authorisation
		 * @param remain_in Whether to remain logged in
		 * @returns Promise representing completion
		 */
		logIn(username: string, password: string, remain_in: boolean): Promise<void>;

		/** Log the user out (from localStorage) */
		logOut(): void;

		/**
		 * Create a new user account
		 * @param data New user data to pass to the API
		 * @returns Promise representing completion
		 */
		register(data: { first_name: string; last_name: string; username: string; email: string; password: string; confirm_password: string; token: string }): Promise<any>;
	};
}

/** Database interface for web application */
class WebDatabase extends BaseDatabase {
	/**
	 * Generic API request method
	 * @param type HTTP Method type for request
	 * @param table Database table (URL) to request from
	 * @param id ID of object
	 * @param data HTTP request body data
	 * @returns Promise representing response data
	 */
	private request(type: httpMethodTypes, table: string, id?: number, data?: any): Promise<any> {
		let path = table + "/" + (id || id === 0 ? id + "/" : "");

		return apiRequest(path, type, data);
	}

	// Interfaces to specific request methods

	get(table: DBTables, query?: number | FilterType[]): Promise<any> {
		if (query instanceof Array) {
			let filterToQuery = (filter: FilterType) => filter.field + (filter.type === "exact" ? "" : `__${filter.type}`) + `=${encodeURI(filter.value)}`;
			let queryStrings = query.map(filterToQuery);
			let queryString = (queryStrings.length ? "?" : "") + queryStrings.join("&");
			return apiRequest(`${table}/${queryString}`, "GET");
		} else if (typeof query === "number") {
			return this.request("GET", table, query);
		} else {
			return this.request("GET", table);
		}
	}

	create(table: DBTables, data: any): Promise<any> {
		return this.request("POST", table, null, data);
	}

	update(table: DBTables, id: number, data: any): Promise<any> {
		return this.request("PATCH", table, id, data);
	}

	delete(table: DBTables, id: number): Promise<any> {
		return this.request("DELETE", table, id);
	}

	auth = {
		checkAuth(): Promise<boolean> {
			return new Promise(resolve => {
				apiRequest("membership/status/")
					.then(data => {
						if (data.authenticated) {
							window.sessionStorage.setItem("csrf_token", data.csrf_token);

							resolve(true);
						} else {
							Database.auth.logOut();
							resolve(false);
						}
					})
					.catch(() => {
						Database.auth.logOut();
						resolve(false);
					});
			});
		},

		logIn(username: string, password: string, remain_in: boolean): Promise<void> {
			return new Promise((resolve, reject) => {
				apiRequest("membership/login/", "POST", {
					username: username,
					password: password
				})
					.then(data => {
						if (remain_in) window.localStorage.setItem("jwtToken", data.token);
						else window.sessionStorage.setItem("jwtToken", data.token);

						resolve();
					})
					.catch(reject);
			});
		},

		logOut(): void {
			window.sessionStorage.removeItem("jwtToken");
			window.localStorage.removeItem("jwtToken");
			if (LocationManager.currentLocation != "/register") LocationManager.updateLocation("/login");
		},

		register(data: { first_name: string; last_name: string; username: string; email: string; password: string; confirm_password: string; token: string }): Promise<any> {
			return apiRequest("membership/register/", "POST", data);
		}
	};
}

export const Database = new WebDatabase();
