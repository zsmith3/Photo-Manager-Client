import { ScanFolder } from ".";
import { LocationManager } from "../components/utils";
import { Database, DBTables } from "../controllers/Database";
import { BaseImageFile } from "./BaseImageFile";
import { ModelMeta } from "./Model";

/** Horizontal/vertical axis identifier */
export enum Axis {
	Horizontal = 0,
	Vertical = 1
}

/** Line (on image) with axis and position */
export interface Line {
	axis: Axis;
	pos: number;
}

/** Scanned image file model */
export class Scan extends BaseImageFile {
	modelName = "scan" as "scan";

	/** File model metadata */
	static meta = new ModelMeta<Scan>({
		modelName: DBTables.Scan,
		props: ["id", "name", "format", "width", "height", "orientation"],
		specialProps: { folder: "folderID" }
	});

	/** ID of parent folder */
	folderID: number;

	/** Parent folder */
	get folder() {
		return ScanFolder.getById(this.folderID);
	}

	/** Open the scan image */
	open() {
		LocationManager.updateQuery({ scan: this.id.toString() });
	}

	/** Get resulting image rectangles given a set of crop lines */
	async getCropPreview(lines: Line[]): Promise<number[][][]> {
		let result = await Database.update(this.class.meta.modelName, this.id, { lines: lines });
		return result.rects;
	}

	/** Apply given crop lines and save output files */
	async confirmCrop(lines: Line[]): Promise<void> {
		await Database.update(this.class.meta.modelName, this.id, { lines: lines, confirm: true }, true);
		this.folder.removeContentsItems([this.id]);
	}
}
