import { Model } from "./Model"
import { Database } from "../controllers/Database"
import { GeoTag } from "./all_models"
import App from "../controllers/App"
import { Platform } from "../controllers/Platform"
import { ImageLoader } from "../controllers/ImageLoader"


/** File model */
export class FileObject extends Model {
	/** Local instances of File */
	static objects: FileObject[] = []

	static props = ["id", "name", "path", "type", "format", "length", "timestamp", "width", "height", "orientation", "duration", "is_starred", "is_deleted"]

	static specialProps = {
		"geotag": (file: FileObject, prop: object) => { file.geotagID = GeoTag.addObject(prop).id; }
	}


	id: string

	/** File name */
	name: string

	/** File path */
	path: string

	/** File type (broad) */
	type: ("folder" | "image" | "video" | "file")

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
	data: object

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
	 * Open the file.
	 *
	 * If the file is an image, it is opened in the image modal.
	 * If the file is a folder, the page navigates to its contents.
	 * For other types no action is taken.
	 */
	open () {
		if (this.type == "image") {
			App.app.els.imageModal.openFile(this);
		} else if (this.type == "folder") {
			//App.app.refreshFilesData("folders/" + this.path.replace("&", "%26"), "folders/" + this.id);
			App.app.refreshFilesData("folders/" + this.path.replace("&", "%26") + Platform.urls.getCurrentQuery(), "folders/" + this.id + "/" + Platform.urls.getCurrentQuery());
			// TODO more general approach to URL encoding
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
