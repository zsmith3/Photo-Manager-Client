import { Model, ModelMeta } from "./Model";
import { DBTables } from "../controllers/Database";
import { FileObject } from "./FileObject";
import { LocationManager } from "../components/utils";

export class Folder extends Model {
	static meta = new ModelMeta<Folder>({
		modelName: DBTables.Folder,
		props: ["id", "name", "path", "file_count", "length"], // TODO
		specialProps: { parent: "parentID" }
	});

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

	/** IDs of Files within folder */
	private fileIds: number[];

	/** IDs of subfolders */
	private subfolderIds: number[];

	/** Whether or not contained files have been loaded */
	private loadedFiles: boolean;

	/** Whether or not subfolders have been loaded */
	private loadedFolders: boolean;

	constructor (obj) {
		super(obj);

		this.fileIds = new Array(this.file_count);
		this.fileIds.fill(null);
	}

	/** Get (and load if needed) instances of File model within folder */
	async getFiles(page: number, page_size: number, searchQuery?: string): Promise<{ count: number, objects: FileObject[] }> {
		let pageIds = this.fileIds.slice((page - 1) * page_size, page * page_size);
		if (!searchQuery && pageIds.every(id => id !== null)) return { count: this.file_count, objects: pageIds.map(id => FileObject.getById(id)) };

		const files = await FileObject.loadFiltered<FileObject>({
			folder: this.id,
			...(searchQuery ? { search: searchQuery } : {})
		}, page, page_size);
		if (!searchQuery) this.fileIds.splice((page - 1) * page_size, page_size, ...(files.objects.map(file => file.id)));
		return files;
	}

	/** Get (and load if needed) child instances of Folder model within folder */
	async getSubfolders(searchQuery?: string): Promise<{ count: number, objects: Folder[] }> {
		if (this.loadedFolders && !searchQuery) return { count: this.subfolderIds.length, objects: this.subfolderIds.map(id => Folder.getById(id)) };
		else {
			const folders = await Folder.loadFiltered<Folder>({
				parent: this.id,
				...(searchQuery ? { search: searchQuery } : {})
			});
			if (!searchQuery) {
				this.loadedFolders = true;
				this.subfolderIds = folders.objects.map(folder => folder.id);
			}
			return folders;
		}
	}

	/** Get (and load if needed) child files and folders */
	async getContents(page: number, page_size: number, searchQuery?: string): Promise<{ folders: { count: number, objects: Folder[] }, files: { count: number, objects: FileObject[]} }> {
		// TODO figure out pagination in each of these functions (and in loadfiltered)
		const files = await this.getFiles(page, page_size, searchQuery);
		const folders = await this.getSubfolders(searchQuery);
		return { folders: folders, files: files };
	}

	/** Open folder in Application */
	open() {
		LocationManager.updateLocation("/folders/" + this.id + "/");
	}
}
