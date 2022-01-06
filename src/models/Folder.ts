import { AuthGroup } from ".";
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
		props: ["id", "name", "path", "file_count", "length"],
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

	/** Folder access user group IDs */
	accessGroupIds: number[];

	/** Folder access user group */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

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

	/**
	 * Change user access groups for this folder
	 * @param accessGroupIds New access group IDs
	 * @param propagate Whether to propagate change to child folders
	 * @param save Whether to save changes to remote database
	 * @returns Promise representing completion
	 */
	updateAccessGroups(accessGroupIds: number[], propagate: boolean, save = true) {
		this.accessGroupIds = accessGroupIds;
		if (propagate) {
			Folder.meta.objects.filter(folder => folder.parentID === this.id).forEach(folder => folder.updateAccessGroups(accessGroupIds, true, false));
			let allFileIds = [];
			for (let entry of this.contents) allFileIds = allFileIds.concat(entry[1].objectIds);
			allFileIds = allFileIds.filter((v, i, a) => a.indexOf(v) === i);
			allFileIds.forEach(id => (FileObject.getById(id).accessGroupIds = accessGroupIds));
		}
		if (save) return Database.update(this.class.meta.modelName, this.id, { access_groups: accessGroupIds, propagate_ag: propagate }, true);
	}
}
