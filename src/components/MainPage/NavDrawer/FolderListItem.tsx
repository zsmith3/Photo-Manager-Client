import { Folder } from "../../../models";
import FolderList from "./FolderList";
import HierarchyListItem from "./HierarchyListItem";

/** ListItem to display a single folder, with children as collapsible sub-list */
export default class FolderListItem extends HierarchyListItem<Folder> {
	static get modelType() {
		return Folder;
	}

	static get listComponent() {
		return FolderList;
	}

	static modelTypeName = "Folder";
}
