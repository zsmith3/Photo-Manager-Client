import { LocationManager } from "../components/utils";
import { FilterType } from "../models/Model";
import { apiRequest, httpMethodTypes, httpFileUpload } from "../utils";

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
	AlbumFile = "album-files",
	Scan = "scans",
	ScanFolder = "scan-folders",
	AuthGroup = "auth-groups"
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
	 * @param noTimeout Whether to extend timeout on request to 5s
	 * @returns Promise representing updated model instance data
	 */
	abstract update(table: DBTables, id: number, data: any, noTimeout: boolean): Promise<any>;

	/**
	 * Delete model instance from table by ID
	 * @param table Model table name
	 * @param id ID of model instance to delete
	 * @returns Promise representing completion
	 */
	abstract delete(table: DBTables, id: number): Promise<any>;

	/**
	 * Create new model instance with file upload
	 * @param table Model table name
	 * @param data Data object, including uploaded file
	 */
	abstract uploadFile(table: DBTables, data: any, onProgress: (event: ProgressEvent) => void): [Promise<any>, () => Promise<void>];

	/** Authorisation-related functions */
	auth: {
		/** Local storage of user config settings */
		config: { desktop_thumb_scale; mobile_thumb_scale; desktop_page_size; mobile_page_size };

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
	 * @param noTimeout Whether to remove timeout from API request
	 * @returns Promise representing response data
	 */
	private request(type: httpMethodTypes, table: string, id?: number, data?: any, noTimeout: boolean = false): Promise<any> {
		let path = table + "/" + (id || id === 0 ? id + "/" : "");

		return apiRequest(path, type, data, noTimeout);
	}

	// Interfaces to specific request methods

	get(table: DBTables, query?: number | FilterType[], page?: number, page_size?: number): Promise<any> {
		if (query instanceof Array) {
			let queryStrings = query.map((filter: FilterType) => filter.field + (filter.type === "exact" ? "" : `__${filter.type}`) + `=${encodeURI(filter.value)}`);
			if (page || page === 0) queryStrings.push(`page=${page}`);
			if (page_size) queryStrings.push(`page_size=${page_size}`);
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

	update(table: DBTables, id: number, data: any, noTimeout: boolean = false): Promise<any> {
		return this.request("PATCH", table, id, data, noTimeout);
	}

	delete(table: DBTables, id: number): Promise<any> {
		return this.request("DELETE", table, id);
	}

	uploadFile(table: DBTables, data: any, onProgress: (event: ProgressEvent) => void) {
		return httpFileUpload(table + "/", data, onProgress);
	}

	auth = {
		config: null as { desktop_thumb_scale: number; mobile_thumb_scale: number; desktop_page_size: string; mobile_page_size: string },

		checkAuth(): Promise<any> {
			return new Promise((resolve, reject) => {
				apiRequest("membership/status/")
					.then(data => {
						if (data.authenticated) {
							window.sessionStorage.setItem("csrf_token", data.csrf_token);
							this.config = data.config;

							resolve(data);
						} else {
							this.logOut();
							resolve(false);
						}
					})
					.catch(err => {
						if (!(typeof err === "string") && "detail" in err) {
							// TODO can't use in operator if err is a string
							this.logOut();
						} else {
							reject();
						}

						resolve(false);
					});
			});
		},

		/**
		 * Get a config variable for current platform
		 * @param name Variable name
		 * @param isDesktop Whether current screen width is large
		 */
		getConfig(name: string, isDesktop: boolean) {
			return this.config[(isDesktop ? "desktop" : "mobile") + "_" + name];
		},

		/**
		 * Update (on remote database) a config variable (for current platform)
		 * @param name Variable name
		 * @param isDesktop Whether current screen width is large
		 * @param value New value for variable
		 */
		updateConfig(name: string, isDesktop: boolean, value: any) {
			let key = (isDesktop ? "desktop" : "mobile") + "_" + name;
			this.config[key] = value;
			return apiRequest("membership/status/", "PATCH", { config: { [key]: value } });
		},

		logIn(username: string, password: string, remain_in: boolean): Promise<any> {
			return new Promise((resolve, reject) => {
				apiRequest("membership/login/", "POST", {
					username: username,
					password: password
				})
					.then(data => {
						if (remain_in) window.localStorage.setItem("jwtToken", data.token);
						else window.sessionStorage.setItem("jwtToken", data.token);

						this.checkAuth()
							.then(data => {
								if (data) resolve(data);
								else reject({ non_field_errors: "An unknown error occurred." });
							})
							.catch(reject);
					})
					.catch(reject);
			});
		},

		logOut(): void {
			window.sessionStorage.removeItem("jwtToken");
			window.localStorage.removeItem("jwtToken");
			if (LocationManager.currentLocation != "/register") LocationManager.updateLocation("/login", true, true);
		},

		register(data: { first_name: string; last_name: string; username: string; email: string; password: string; confirm_password: string; token: string }): Promise<any> {
			return apiRequest("membership/register/", "POST", data);
		}
	};
}

export const Database = new WebDatabase();
