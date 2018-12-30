import { Model, ModelMeta } from "./Model";
import { DBTables } from "../controllers/Database";
import { FileObject } from "./FileObject";
import { LocationManager } from "../components/utils";

export class Folder extends Model {
	static meta = new ModelMeta<Folder>({
		modelName: DBTables.Folder,
		props: ["id", "name", "path", "file_count", "length"], // TODO
		specialProps: { "parent": "parentID" }
	})


	/** Name of the folder */
	name: string

	/** Full path to the folder */
	path: string

	/** ID of parent folder */
	parentID: number

	/** Number of files in the folder (including subfolders) */
	file_count: number

	/** Folder size (bytes) */
	length: number

	/** IDs of Files within folder */
	private fileIds: number[]

	/** IDs of subfolders */
	private subfolderIds: number[]

	/** Whether or not contained files have been loaded */
	private loadedFiles: boolean

	/** Whether or not subfolders have been loaded */
	private loadedFolders: boolean


	/** Get (and load if needed) instances of File model within folder */
	async getFiles (searchQuery?: string): Promise<FileObject[]> {
		if (this.loadedFiles && !searchQuery) return this.fileIds.map(id => FileObject.getById(id));
		else {
			const files = await FileObject.loadFiltered<FileObject>({ "folder": this.id, ...(searchQuery ? { "search": searchQuery } : {}) });
			if (!searchQuery) {
				this.loadedFiles = true;
				this.fileIds = files.map(file => file.id);
			}
			return files;
		}
	}

	/** Get (and load if needed) child instances of Folder model within folder */
	async getSubfolders (searchQuery?: string): Promise<Folder[]> {
		if (this.loadedFolders && !searchQuery) return this.subfolderIds.map(id => Folder.getById(id));
		else {
			const folders = await Folder.loadFiltered<Folder>({ "parent": this.id, ...(searchQuery ? { "search": searchQuery } : {}) });
			if (!searchQuery) {
				this.loadedFolders = true;
				this.subfolderIds = folders.map(folder => folder.id);
			}
			return folders;
		}
	}

	/** Get (and load if needed) child files and folders */
	async getContents (searchQuery?: string): Promise<{ folders: Folder[], files: FileObject[] }> {
		const files = await this.getFiles(searchQuery);
		const folders = await this.getSubfolders(searchQuery);
		return { folders: folders, files: files };
	}

	/** Open folder in Application */
	open () {
		LocationManager.updateLocation("/folders/" + this.id + "/");
	}
}
