import { Model, ModelMeta } from "./Model";
import { DBTables } from "../controllers/Database";
import { FileObject } from "./FileObject";
import { LocationManager } from "../components/App";

export class Folder extends Model {
	static meta = new ModelMeta<Folder>({
		modelName: DBTables.Folder,
		props: ["id", "name", "path", "file_count", "length"], // TODO
		specialProps: {
			"files": "fileIds",
			"folders": "subfolderIds"
		}
	})


	/** Name of the folder */
	name: string

	/** Full path to the folder */
	path: string

	/** Number of files in the folder (including subfolders) */
	file_count: number

	/** Folder size (bytes) */
	length: number

	/** IDs of Files within folder */
	private fileIds: number[]

	/** IDs of subfolders */
	private subfolderIds: number[]


	/** Get (and load if needed) instances of File model within folder */
	getFiles (): Promise<FileObject[]> { return FileObject.loadIds<FileObject>(this.fileIds); }

	/** Get (and load if needed) child instances of Folder model within folder */
	getSubfolders (): Promise<Folder[]> { return Folder.loadIds<Folder>(this.subfolderIds); }

	/** Get (and load if needed) child files and folders */
	getContents (): Promise<{ folders: Folder[], files: FileObject[] }> {
		return new Promise((resolve, reject) => {
			this.getFiles().then(files => {
				this.getSubfolders().then(folders => {
					resolve({ folders: folders, files: files });
				}).catch(reject);
			}).catch(reject);
		});
	}

	/** Open folder in Application */
	open () {
		LocationManager.updateLocation("/folders/" + this.id + "/");
	}
}
