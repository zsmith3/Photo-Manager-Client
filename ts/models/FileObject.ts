import { Model, ModelMeta } from "./Model"
import { Database, DBTables } from "../controllers/Database"
import { GeoTag } from "."
import App from "../components/App"
import { Platform, FileImgSizes } from "../controllers/Platform"
import { ImageLoader } from "../controllers/ImageLoader"
import { LocationManager } from "../components/utils";


/** Possible values for File.type field */
export type FileTypes = ("image" | "video" | "file")


/** File model */
export class FileObject extends Model {
	/** File model metadata */
	static meta = new ModelMeta<FileObject>({
		modelName: DBTables.File,
		props: ["id", "name", "path", "type", "format", "length", "timestamp", "width", "height", "orientation", "duration", "is_starred", "is_deleted"],
		specialProps: {
			"geotag": {
				deserialize: (file: FileObject, prop: object) => {
					if (prop === null) file.geotagID = null;
					else file.geotagID = GeoTag.addObject(prop).id
				}
			}
		}
		// TODO serialize for this
	})


	/** File name */
	name: string

	/** File path */
	path: string

	/** File type (broad) */
	type: FileTypes

	/** File format (extension) */
	format: string

	/** File size (bytes) */
	length: number

	/** File timestamp (date taken if available, otherwise date modified) */
	timestamp: Date

	/** File width (if image or video) */
	width: number

	/** File height (if image or video) */
	height: number

	/** File orientation (if image) */
	orientation: number

	/** File duration (if video) */
	duration: number

	/** Whether file is starred */
	is_starred: boolean

	/** Whether file is marked for deletion */
	is_deleted: boolean

	/** Local storage of image data for file */
	private imageData: Map<FileImgSizes, string> = new Map<FileImgSizes, string>()

	/** Information about state of file zoom/positioning in ImageModal (current session) */
	zoom: object

	/** Parent ID (for File instances belonging to a Face) */
	// parent?: number
	// TODO remove this and remove it from ImageModal
	// 	I think maybe use selection instead

	/** File geotag ID */
	private geotagID: number

	/** File geotag (if image) */
	get geotag (): GeoTag { return GeoTag.getById(this.geotagID); }

	/** Material icon to use in place of image data */
	imageMaterialIcon = "photo"

	/**
	 * Construct a new FileObject instance
	 * @param obj Data object from which to construct the new file instance
	 */
	constructor (obj: object) {
		super(obj);

		if (this.orientation == 6 || this.orientation == 8) {
			this.width = obj["height"];
			this.height = obj["width"];
		}
	}

	/**
	 * Get (and load if needed) image data for this file
	 * @param size The size at which to load the image
	 * @returns Base64 data url for image
	 */
	async loadImgData (size: FileImgSizes): Promise<string> {
		if (this.type !== "image") return null;

		let data = this.imageData.get(size);
		if (data) return data;
		else {
			const data = await Platform.getImgSrc(this, "file", size);
			this.imageData.set(size, data);
			return data;
		}
	}

	/**
	 * Get the largest already-loaded size for this image file,
	 * up to a given maximum size
	 * @param size The maximum size to look for
	 * @returns The best size found
	 */
	getBestImgSize (size: FileImgSizes): FileImgSizes {
		let bestInd = null as FileImgSizes;
		let entries = this.imageData.entries();
		while (true) {
			let next = entries.next();
			if (next.done) break;

			let pair = next.value;
			if ((bestInd === null || pair[0] > bestInd) && pair[0] <= size) bestInd = pair[0];
		}
		return bestInd;
	}

	/**
	 * Open the file.
	 *
	 * If the file is an image, it is opened in the image modal.
	 * For other types no action is taken.
	 */
	open () {
		if (this.type == "image") {
			LocationManager.updateQuery({ "file": this.id.toString() });
		}
	}

	/** FUNCTION DEPRECATED - TODO remove */
	getSrc (index) {
		// TODO remove this (and all uses)
		if (index in this.data) {
			return this.data[index];
		} else {
			return Platform.urls.serverUrl + "api/images/" + this.id + ImageLoader.imgSizes[index];
		}
	}

	/**
	 * Get the maximum dimensions of the file (for images)
	 * when it is fit within the given width and height
	 * but the aspect ratio is maintained.
	 * @param maxW Width of the bounding box
	 * @param maxH Height of the bounding box
	 * @returns [Width of the image at that size, Height of the image at that size]
	 */
	getSize (maxW: number, maxH: number): [number, number] {
		if (this.width / this.height < maxW / maxH) {
			return [this.width * maxH / this.height, maxH];
		} else {
			return [maxW, this.height * maxW / this.width];
		}
	}

	// Function to set a boolean field (for private use)
	/**
	 * Change the remote value of a boolean field
	 * @param type Boolean field to change
	 * @param value The boolean value to set it to
	 */
	private setBool (type: ("is_starred" | "is_deleted"), value: boolean) {
		return new Promise((resolve, reject) => {
			Database.update("files", this.id, { [type]: value }).then(() => {
				this[type] = value;
				App.app.els.filesCont.getFilebox(this.id).showIcons();
				resolve();
			}).catch(reject);
		});
	}

	// Wrappers for setBool

	star () { return this.setBool("is_starred", true); }

	unstar () { return this.setBool("is_starred", false); }

	markDelete () { return this.setBool("is_deleted", true); }

	unmarkDelete () { return this.setBool("is_deleted", false); }
}
