import ScanCard from "../components/MainPage/MainView/cards/ScanCard";
import ScanFolderCard from "../components/MainPage/MainView/cards/ScanFolderCard";
import { LocationManager } from "../components/utils";
import { DBTables } from "../controllers/Database";
import { AuthGroup } from "./AuthGroup";
import { BaseFolder } from "./BaseFolder";
import { ModelMeta } from "./Model";
import { Scan } from "./Scan";

/** Scan Folder model */
export class ScanFolder extends BaseFolder {
	static meta = new ModelMeta<ScanFolder>({
		modelName: DBTables.ScanFolder,
		props: ["id", "name", "path", "file_count"],
		specialProps: { parent: "parentID", access_groups: "accessGroupIds" }
	});

	static rootModelMeta = {
		...BaseFolder.rootModelMeta,
		rootsCard: ScanFolderCard,
		contentsCard: ScanCard,
		contentsClass: Scan
	};

	/** Access user group IDs */
	accessGroupIds: number[];

	/** Access user groups */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

	/** Open folder in Application */
	open() {
		LocationManager.updateLocation("/scans/" + this.id + "/", ["page"]);
	}
}
