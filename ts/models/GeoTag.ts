import { Model } from "./Model"
import { Database, DBTables } from "../controllers/Database"
import $ from "jquery";
import App from "../components/App"


/** Geotag area model */
export class GeoTagArea extends Model {
	static objects: GeoTagArea[] = []

	static modelName = DBTables.GeoTagArea

	static props = ["id", "name", "address", "latitude", "longitude", "radius"]


	/**
	 * Create new GeoTagArea model instance and add to remote database
	 * @param dataObj Data object from which to create GeoTagArea
	 * @returns Promise object representing new GeoTagArea
	 */
	static create (dataObj: { name: string }): Promise<GeoTagArea> {
		return new Promise((resolve, reject) => {
			Database.create("geotag-areas", dataObj).then((data) => {
				let newArea = GeoTagArea.addObject(data);
				$("<option></option>").val(newArea.id).text(newArea.name).appendTo("#modal-geotag-form-area-title");
				resolve(newArea);
			}).catch(reject);
		});
	};


	id: number

	/** Name of the GeoTagArea */
	name: string

	/** Address of the GeoTagArea */
	address: string

	/** Latitude co-ordinate of area centre */
	latitude: number

	/** Longitude co-ordinate of area centre */
	longitude: number

	/** Radius of area from centre */
	radius: number
	// TODO find out unit and add to doc comment


	/**
	 * Get a display-formatted version of area
	 * @returns Formatted name and address of the area
	 */
	getString () {
		return "<span>" + this.name + "</span>\n\n<i style='font-size: 12px;'>" + this.address + "</i>";
	}

	/**
	 * Save edits to area
	 * @returns Promise object representing updated area
	 */
	save () {
		return new Promise((resolve, reject) => {
			Database.update("geotag-areas", this.id, { name: this.name, address: this.address }).then((data) => {
				this.update(data);
				resolve(this);
			});
		});
	}
}


/** Geotag model */
export class GeoTag extends Model {
	static objects: GeoTag[] = []

	static modelName = DBTables.GeoTag

	static props = ["id", "latitude", "longitude", "areaID"]

	static specialProps = {
		"area": (geotag: GeoTag, prop: number) => { geotag.areaID = prop; }
	}


	/**
	 * Create a new geotag and add to remote database
	 * @param newGeotag Data object representing new geotag
	 * @param fileID ID of file to which to assign the geotag
	 * @returns Promise object representing new geotag
	 */
	static create (newGeotag: object, fileID: string): Promise<GeoTag> {
		return new Promise((resolve, reject) => {
			// TODO should create geotag then assign to file
			Database.update("files", fileID, { "geotag": newGeotag }).then((data) => {
				let newGeotag = GeoTag.addObject(data.geotag);
				// TODO ^^ not sure about data format
				App.app.els.filesCont.getFile(fileID).geotagID = data.geotag.id;
				resolve(newGeotag);
			}).catch(reject);
		});
	}


	// TODO document these methods

	static modalOnAccept () {
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
	}

	static modalUpdateLocation (data) {
		if (App.app.els.filesCont.selection.length == 1) {
			let newGT = {
				area: data.id,
				latitude: $("#modal-geotag-form-location-lat").val(),
				longitude: $("#modal-geotag-form-location-lng").val()
			};
			GeoTag.create(newGT, App.app.els.filesCont.selection[0]);
		}
	}


	id: number

	/** Latitude co-ordinate */
	latitude: number

	/** Longitude co-ordinate */
	longitude: number

	/** ID of GeoTagArea to which geotag belongs (may be null) */
	private areaID: number

	/** GeoTagArea to which geotag belongs (may be null) */
	get area () {
		if (this.areaID === null) return null;
		else return GeoTagArea.getById(this.areaID);
	}


	/**
	 * Get a display-formatted version of the geotag
	 * @param noArea If true, the GeoTagArea will not be included
	 * @returns Formatted latitude and longitude (+ optionally GeoTagArea name and address) of geotag
	 */
	getString (noArea) {
		if (this.area && !noArea) {
			return this.area.getString() + "\n\n" + this.getString(true);
		} else {
			return "<i style='font-size: 13px;'>(" + (Math.round(this.latitude * 100) / 100) + ", " + (Math.round(this.longitude * 100) / 100) + ")</i>";
		}
	}
}
