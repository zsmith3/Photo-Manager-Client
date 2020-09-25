import { Folder } from "../../../models";
import FolderListItem from "./FolderListItem";
import HierarchyList from "./HierarchyList";

/** List of Folder instances (for root or child Folders) */
export default class FolderList extends HierarchyList<Folder> {
	static get modelType() {
		return Folder;
	}

	static get listItemComponent() {
		return FolderListItem;
	}

	static modelTypeName = "Folder";
}
