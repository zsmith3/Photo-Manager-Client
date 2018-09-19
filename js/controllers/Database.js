// Platform-specific Database interface
var Database = {
	// Generic (private) request method
	_request: function (type, table, id, data) {
		if (id) path = table + "/" + id + "/";
		else path = table + "/";

		return apiRequest(path, type, data);
	},

	// Interfaces to specific request methods

	get: function (table, id) {
		return this._request("GET", table, id);
	},

	create: function (table, id, data) {
		return this._request("POST", table, id, data);
	},

	update: function (table, id, data) {
		return this._request("PATCH", table, id, data);
	},

	delete: function (table, id, data) {
		return this._request("DELETE", table, id, data);
	}
};
