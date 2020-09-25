import FileCard from "../components/MainPage/MainView/cards/FileCard";
import FolderCard from "../components/MainPage/MainView/cards/FolderCard";
import { LocationManager } from "../components/utils";
import { DBTables } from "../controllers/Database";
import { BaseFolder } from "./BaseFolder";
import { FileObject } from "./FileObject";
import { ModelMeta } from "./Model";

/** Standard file folder model */
export class Folder extends BaseFolder {
	static meta = new ModelMeta<Folder>({
		modelName: DBTables.Folder,
		props: ["id", "name", "path", "file_count", "length"],
		specialProps: { parent: "parentID" }
	});

	static rootModelMeta = {
		...BaseFolder.rootModelMeta,
		rootsCard: FolderCard,
		contentsCard: FileCard,
		contentsClass: FileObject
	};

	/** Folder size (bytes) */
	length: number;

	/** Parent folder */
	get parent(): Folder {
		if (this.parentID === null) return null;
		else return this.class.getById(this.parentID) as Folder;
	}

	/** Child folders */
	get children(): Folder[] {
		return Folder.meta.objects.filter(folder => folder.parentID === this.id);
	}

	/** Open folder in Application */
	open() {
		LocationManager.updateLocation("/folders/" + this.id + "/", ["page"]);
	}
}
