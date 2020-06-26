import { FileImgSizes, Platform } from "../controllers/Platform";
import { Model } from "./Model";

export { ImageModelType } from "../controllers/Platform";

/** Base class for File and Scan models */
export class BaseImageFile extends Model {
	/** Model type (for extending class) */
	modelName: "scan" | "file";

	/** File name */
	name: string;

	/** File path */
	path: string;

	/** File format (extension) */
	format: string;

	/** File width (if image or video) */
	width: number;

	/** File height (if image or video) */
	height: number;

	/** File orientation (if image) */
	orientation: number;

	/** Local storage of image data for file */
	private imageData: Map<FileImgSizes, string> = new Map<FileImgSizes, string>();

	/** Material icon to use in place of image data */
	imageMaterialIcon = "photo";

	/**
	 * Construct a new FileObject instance
	 * @param obj Data object from which to construct the new file instance
	 */
	constructor(obj: object) {
		super(obj);

		if (this.orientation == 6 || this.orientation == 8) {
			this.width = obj["height"];
			this.height = obj["width"];
		}
	}

	/**
	 * Get (and load if needed) image data for this file
	 * @param size The size at which to load the image
	 * @param queue Whether to queue image loading
	 * @returns Base64 data url for image
	 */
	async loadImgData(size: FileImgSizes, queue: boolean): Promise<string> {
		let data = this.imageData.get(size);
		if (data) return data;
		else {
			const data = await Platform.getImgSrc(this, this.modelName, size, queue);
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
	getBestImgSize(size: FileImgSizes): FileImgSizes {
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
	 * Get the maximum dimensions of the file (for images)
	 * when it is fit within the given width and height
	 * but the aspect ratio is maintained.
	 * @param maxW Width of the bounding box
	 * @param maxH Height of the bounding box
	 * @returns [Width of the image at that size, Height of the image at that size]
	 */
	getSize(maxW: number, maxH: number): [number, number] {
		if (this.width / this.height < maxW / maxH) {
			return [(this.width * maxH) / this.height, maxH];
		} else {
			return [maxW, (this.height * maxW) / this.width];
		}
	}
}
