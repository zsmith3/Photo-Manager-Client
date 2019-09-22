import FileCard from "../components/MainPage/MainView/cards/FileCard";
import FolderCard from "../components/MainPage/MainView/cards/FolderCard";
import { LocationManager } from "../components/utils";
import { DBTables } from "../controllers/Database";
import { FileObject } from "./FileObject";
import { ModelMeta } from "./Model";
import RootModel from "./RootModel";

export class Folder extends RootModel {
	static meta = new ModelMeta<Folder>({
		modelName: DBTables.Folder,
		props: ["id", "name", "path", "file_count", "length"],
		specialProps: { parent: "parentID" }
	});

	static rootModelMeta = {
		hasRoots: true,
		rootsName: "Folders",
		rootsCard: FolderCard,
		rootsFilterParam: "parent",
		contentsName: "Files",
		contentsCard: FileCard,
		contentsFilterParam: "folder",
		contentsClass: FileObject
	};

	/** Name of the folder */
	name: string;

	/** Full path to the folder */
	path: string;

	/** ID of parent folder */
	parentID: number;

	/** Number of files in the folder (including subfolders) */
	file_count: number;

	/** Folder size (bytes) */
	length: number;

	/** Open folder in Application */
	open() {
		LocationManager.updateLocation("/folders/" + this.id + "/", ["page"]);
	}
}
