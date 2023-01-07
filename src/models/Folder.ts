import { AuthGroup } from "./AuthGroup";
import FileCard from "../components/MainPage/MainView/cards/FileCard";
import FolderCard from "../components/MainPage/MainView/cards/FolderCard";
import { LocationManager } from "../components/utils";
import { Database, DBTables } from "../controllers/Database";
import { BaseFolder } from "./BaseFolder";
import { FileObject } from "./FileObject";
import { ModelMeta } from "./Model";

/** Standard file folder model */
export class Folder extends BaseFolder {
	static meta = new ModelMeta<Folder>({
		modelName: DBTables.Folder,
		props: ["id", "name", "path", "file_count", "length", "allow_upload"],
		specialProps: { parent: "parentID", access_groups: "accessGroupIds" }
	});

	static rootModelMeta = {
		...BaseFolder.rootModelMeta,
		rootsCard: FolderCard,
		contentsCard: FileCard,
		contentsClass: FileObject
	};

	/** Folder size (bytes) */
	length: number;

	/** Whether users can upload files to this folder */
	allow_upload: boolean;

	/** Parent folder */
	get parent() {
		return this.getParent() as Folder;
	}

	/** Child folders */
	get children(): Folder[] {
		return Folder.meta.objects.filter(folder => folder.parentID === this.id);
	}

	/** Open folder in Application */
	open() {
		LocationManager.updateLocation("/folders/" + this.id + "/", ["page"]);
	}

	/** Download this folder as a .zip */
	async download() {
		const data = await Database.createDownload([], [this.id]);
		window.open(data.url);
	}
}
