import { ScanFolder } from ".";
import { AuthGroup } from "./AuthGroup";
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
		specialProps: { folder: "folderID", access_groups: "accessGroupIds" }
	});

	/** ID of parent folder */
	folderID: number;

	/** Parent folder */
	get folder() {
		return ScanFolder.getById(this.folderID);
	}

	/** Access user group IDs */
	accessGroupIds: number[];

	/** Access user groups */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

	/** Open the scan image */
	open() {
		LocationManager.updateQuery({ scan: this.id.toString() });
	}

	/** Get resulting image rectangles given a set of crop lines */
	async getCropPreview(lines: Line[], options: any): Promise<number[][][]> {
		let result = await Database.update(this.class.meta.modelName, this.id, { lines: lines, crop_options: options });
		return result.rects;
	}

	/** Apply given crop lines and save output files */
	async confirmCrop(lines: Line[], options: any): Promise<void> {
		await Database.update(this.class.meta.modelName, this.id, { lines: lines, confirm: true, crop_options: options }, true);
		this.folder.removeContentsItems([this.id]);
	}
}
