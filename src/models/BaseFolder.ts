import FileCard from "../components/MainPage/MainView/cards/FileCard";
import FolderCard from "../components/MainPage/MainView/cards/FolderCard";
import { FileObject } from "./FileObject";
import { Model } from "./Model";
import RootModel from "./RootModel";

/** Base class for Folder and ScanFolder models */
export class BaseFolder extends RootModel {
	static rootModelMeta = {
		hasRoots: true,
		rootsName: "Folders",
		rootsCard: FolderCard,
		rootsFilterParam: "parent",
		contentsName: "Files",
		contentsCard: FileCard,
		contentsFilterParam: "folder",
		contentsClass: FileObject as typeof Model
	};

	/** Name of the folder */
	name: string;

	/** Full path to the folder */
	path: string;

	/** ID of parent folder */
	parentID: number;

	/** Number of files in the folder (including subfolders) */
	file_count: number;
}
