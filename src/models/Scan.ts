import { LocationManager } from "../components/utils";
import { DBTables } from "../controllers/Database";
import { BaseImageFile } from "./BaseImageFile";
import { ModelMeta } from "./Model";

/** Scanned image file model */
export class Scan extends BaseImageFile {
	modelName = "scan" as "scan";

	/** File model metadata */
	static meta = new ModelMeta<Scan>({
		modelName: DBTables.Scan,
		props: ["id", "name", "path", "format", "width", "height", "orientation"]
	});

	/** Open the scan image */
	open() {
		LocationManager.updateQuery({ scan: this.id.toString() });
	}
}
