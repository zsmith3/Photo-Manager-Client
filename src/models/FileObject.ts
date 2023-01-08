import { Folder, GeoTag } from ".";
import { LocationManager } from "../components/utils";
import { DBTables, Database } from "../controllers/Database";
import { FileImgSizes } from "../controllers/Platform";
import { AuthGroup } from "./AuthGroup";
import { BaseImageFile } from "./BaseImageFile";
import { ModelMeta } from "./Model";
import { Platform } from "../controllers/Platform";

/** Possible values for File.type field */
export type FileTypes = "image" | "video" | "file";

/** Possible directions to rotate image in */
export enum RotateDirection {
	Clockwise = "clockwise",
	Anticlockwise = "anticlockwise"
}

/** File model */
export class FileObject extends BaseImageFile {
	modelName = "file" as "file";

	/** File model metadata */
	static meta = new ModelMeta<FileObject>({
		modelName: DBTables.File,
		props: ["id", "name", "path", "type", "format", "length", "timestamp", "width", "height", "orientation", "duration", "is_starred", "is_deleted", "notes"],
		specialProps: {
			access_groups: "accessGroupIds",
			geotag: {
				deserialize: (file: FileObject, prop) => {
					if (prop === null) file.geotagID = null;
					else {
						file.geotagID = GeoTag.addObject(prop, false).id;

						if (prop.locationModified) file.geotag.locationModified = true;
						if (prop.areaModified) file.geotag.areaModified = true;
					}
				},
				serialize: (obj: { geotag: any }, prop: GeoTag) => {
					if (prop === null) obj.geotag = null;
					else {
						obj.geotag = { id: prop.id };
						if (prop.locationModified) {
							obj.geotag.latitude = prop.latitude;
							obj.geotag.longitude = prop.longitude;
						}
						if (prop.areaModified) obj.geotag.area = prop.area === null ? null : prop.area.id;
					}
				}
			}
		}
	});

	/** File type (broad) */
	type: FileTypes;

	/** File size (bytes) */
	length: number;

	/** File timestamp (date taken if available, otherwise date modified) */
	timestamp: Date;

	/** File duration (if video) */
	duration: number;

	/** Whether file is starred */
	is_starred: boolean;

	/** Whether file is marked for deletion */
	is_deleted: boolean;

	/** Comments/notes added to the file */
	notes: string;

	/** File access user group ID */
	accessGroupIds: number[];

	/** File access user group */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

	/** File geotag ID */
	private geotagID: number;

	/** File geotag (if image) */
	get geotag(): GeoTag {
		return GeoTag.getById(this.geotagID);
	}

	/** Display name for geotag */
	get geotagAreaName(): string {
		if (this.geotag === null) return "None";
		else if (this.geotag.area === null) return "None";
		else return this.geotag.area.name;
	}

	/**
	 * Upload a file to the remote database
	 * @param file User-uploaded File object
	 * @param folderId ID of folder in which to place file
	 * @returns Promise representing new FileObject created
	 */
	static upload(file: File, folderId: number, onProgress: (event: ProgressEvent) => void): [Promise<any>, () => Promise<void>] {
		if (!Folder.getById(folderId).allow_upload) throw "Tried to upload a file to a folder which doesn't allow uploads.";
		const [uploadPromise, abort] = Database.uploadFile(DBTables.File, { file_uploaded: file, folder: folderId }, onProgress);
		return [
			new Promise((resolve, reject) => {
				uploadPromise
					.then(newFileData => {
						const newFile = this.addObject(newFileData);
						Folder.getById(folderId).addFileUpdateProps(newFile.length);
						resolve(newFile);
					})
					.catch(reject);
			}),
			abort
		];
	}

	/**
	 * Download file(s) as a .zip
	 * @param fileIds List of IDs of files to be downloaded
	 */
	static async download(fileIds: number[]) {
		const data = await Database.createDownload(fileIds);
		window.open(data.url);
	}

	/**
	 * Get (and load if needed) image data for this file
	 * @param size The size at which to load the image
	 * @param queue Whether to queue image loading
	 * @returns Base64 data url for image
	 */
	async loadImgData(size: FileImgSizes, queue: boolean): Promise<string> {
		if (this.type !== "image") return null;

		return super.loadImgData(size, queue);
	}

	/**
	 * Open the file.
	 *
	 * If the file is an image, it is opened in the image modal.
	 * For other types no action is taken.
	 */
	open() {
		if (this.type == "image") {
			LocationManager.updateQuery({ file: this.id.toString() });
		}
	}

	/**
	 * Rotate the (image) file 90 degrees
	 * @param direction Direction to rotate (clockwise or anti-clockwise)
	 */
	async rotate(direction: RotateDirection) {
		const orientations = [1, 6, 3, 8];
		const directions = { [RotateDirection.Clockwise]: 1, [RotateDirection.Anticlockwise]: -1 };
		let newOrientation = orientations[(orientations.indexOf(this.orientation) + directions[direction] + 4) % 4];
		this.imageData.clear();
		await this.updateSave({ orientation: newOrientation });
		if (this.orientation == 6 || this.orientation == 8) {
			let oldWidth = this.width;
			this.width = this.height;
			this.height = oldWidth;
		}
		return this;
	}

	// Function to set a boolean field (for private use)
	/**
	 * Change the remote value of a boolean field
	 * @param type Boolean field to change
	 * @param value The boolean value to set it to
	 */
	/* private setBool (type: ("is_starred" | "is_deleted"), value: boolean) {
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

	unmarkDelete () { return this.setBool("is_deleted", false); } */
}
