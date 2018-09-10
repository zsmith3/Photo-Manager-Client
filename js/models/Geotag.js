// GeoTag area class
class GeoTagArea {
	// Construct GeoTagArea from object
	constructor (object) {
		for (var property in object) this[property] = object[property];
	}

	getString () {
		return "<span>" + this.name + "</span>\n\n<i style='font-size: 12px;'>" + this.address + "</i>";
	}

	save () {
		let parent = this;
		return new Promise(function (resolve, reject) {
			apiRequest("geotag-areas/" + parent.id + "/", "PUT", parent).then(function (data) {
				resolve(data);
			});
		});
	}
}

GeoTagArea.createFromList = function (list) {
	let areas = [];
	for (var i in list) {
		areas.push(new GeoTagArea(list[i]));
	}
	return areas;
};

GeoTagArea.getById = function (id) {
	for (var i in GeoTagArea.areas) {
		if (GeoTagArea.areas[i].id == id) {
			return GeoTagArea.areas[i];
		}
	}
};

GeoTagArea.create = function (newGta) {
	return new Promise(function (resolve, reject) {
		apiRequest("geotag-areas/", "POST", newGta).then(function (data) {
			GeoTagArea.areas.push(new GeoTagArea(data));
			$("<option></option>").val(data.id).text(GeoTagArea.getById(data.id).name).appendTo("#modal-geotag-form-area-title");
			resolve(data);
		});
	});
};


// GeoTag class
class GeoTag {
	// Construct GeoTag from object
	constructor (object) {
		for (var property in object) if (property != "area") this[property] = object[property];
		this._area = object.area;
	}

	getString (noArea) {
		if (this.area && !noArea) {
			return this.area.getString() + "\n\n" + this.getString(true);
		} else {
			return "<i style='font-size: 13px;'>(" + (Math.round(this.latitude * 100) / 100) + ", " + (Math.round(this.longitude * 100) / 100) + ")</i>";
		}
	}

	get area () {
		if (this._area === null) return null;
		else return GeoTagArea.getById(this._area);
	}
}

GeoTag.create = function (newGT, file) {
	apiRequest("files/" + file + "/", "PATCH", {"geotag": newGT}).then(function (data) {
		newGT.id = data.id;
		pageLoader.filesContainer.getFile(file).geotag = newGT;
	});
};

GeoTag.modalOnAccept = function (modal) {
	if ($("#modal-geotag-form-area-title").val() == "new") {
		let newGta = {
			name: $("#modal-geotag-form-area-title > mdc-text").val(),
			address: $("#modal-geotag-form-area-address").val(),
			latitude: $("#modal-geotag-form-area-lat").val(),
			longitude: $("#modal-geotag-form-area-lng").val(),
			radius: Math.pow($("#modal-geotag-form-area-radius").val(), 3)
		};
		GeoTagArea.create(newGta).then(GeoTag.modalUpdateLocation);
	} else {
		let area = GeoTagArea.getById($("#modal-geotag-form-area-title").val());
		area.address = $("#modal-geotag-form-area-address").val();
		area.latitude = $("#modal-geotag-form-area-lat").val();
		area.longitude = $("#modal-geotag-form-area-lng").val();
		area.radius = Math.pow($("#modal-geotag-form-area-radius").val(), 3);
		area.save().then(GeoTag.modalUpdateLocation);
	}
};

GeoTag.modalUpdateLocation = function (data) {
	if (pageLoader.filesContainer.selection.length == 1) {
		let newGT = {
			area: data.id,
			latitude: $("#modal-geotag-form-location-lat").val(),
			longitude: $("#modal-geotag-form-location-lng").val()
		};
		GeoTag.create(newGT, pageLoader.filesContainer.selection[0]);
	}
};
