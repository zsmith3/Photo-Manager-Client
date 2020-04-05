import { Database, DBTables } from "../controllers/Database";
import { Model, ModelMeta } from "./Model";

/** Geotag area model */
export class GeoTagArea extends Model {
	/** Geotag area model metadata */
	static meta = new ModelMeta<GeoTagArea>({
		modelName: DBTables.GeoTagArea,
		props: ["id", "name", "address", "latitude", "longitude", "radius"]
	});

	/**
	 * Create new GeoTagArea model instance and add to remote database
	 * @param dataObj Data object from which to create GeoTagArea
	 * @returns Promise object representing new GeoTagArea
	 */
	static create(dataObj: { name: string }): Promise<GeoTagArea> {
		return new Promise((resolve, reject) =>
			Database.create(GeoTagArea.meta.modelName, dataObj)
				.then(data => resolve(GeoTagArea.addObject(data)))
				.catch(reject)
		);
	}

	id: number;

	/** Name of the GeoTagArea */
	name: string;

	/** Address of the GeoTagArea */
	address: string;

	/** Latitude co-ordinate of area centre */
	latitude: number;

	/** Longitude co-ordinate of area centre */
	longitude: number;

	/** Radius of area from centre */
	radius: number;
	// TODO find out unit and add to doc comment

	/**
	 * Get a display-formatted version of area
	 * @returns Formatted name and address of the area
	 */
	getString() {
		return "<span>" + this.name + "</span>\n\n<i style='font-size: 12px;'>" + this.address + "</i>";
	}
}

/** Geotag model */
export class GeoTag extends Model {
	/** Geotag model metadata */
	static meta = new ModelMeta<GeoTag>({
		modelName: DBTables.GeoTag,
		props: ["id", "latitude", "longitude"],
		specialProps: { area: "areaID" }
	});

	id: number;

	/** Latitude co-ordinate */
	latitude: number;

	/** Longitude co-ordinate */
	longitude: number;

	/** ID of GeoTagArea to which geotag belongs (may be null) */
	private areaID: number;

	/** GeoTagArea to which geotag belongs (may be null) */
	get area() {
		if (this.areaID === null) return null;
		else return GeoTagArea.getById(this.areaID);
	}

	/** Whether local changes to latitude/longitude should be saved to database */
	locationModified: boolean;

	/** Whether local changes to area should be saved to database */
	areaModified: boolean;

	/**
	 * Get a display-formatted version of the geotag
	 * @param noArea If true, the GeoTagArea will not be included
	 * @returns Formatted latitude and longitude (+ optionally GeoTagArea name and address) of geotag
	 */
	getString(noArea) {
		if (this.area && !noArea) {
			return this.area.getString() + "\n\n" + this.getString(true);
		} else {
			return "<i style='font-size: 13px;'>(" + Math.round(this.latitude * 100) / 100 + ", " + Math.round(this.longitude * 100) / 100 + ")</i>";
		}
	}
}
