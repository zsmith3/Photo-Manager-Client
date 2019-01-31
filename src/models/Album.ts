import { Database, DBTables } from "../controllers/Database";
import { promiseChain } from "../utils";
import { Model, ModelMeta } from "./Model";

/** Album model */
export class Album extends Model {
	/** Album model metadata */
	static meta = new ModelMeta<Album>({
		modelName: DBTables.Album,
		props: ["id", "name", "file_count"],
		specialProps: { parent: "parentID" }
	});

	/** List of root-level albums only */
	static get rootAlbums(): Album[] {
		return Album.meta.objects.filter(album => album.parent === undefined);
	}

	/**
	 * Create a new album and add it to the remote database
	 * @param parentId ID of the parent album (-1 for root-level) TODO this
	 * @param name Name of the new album
	 * @returns Promise object representing new album
	 */
	static create(parentId: number, name: string): Promise<Album> {
		return new Promise((resolve, reject) => {
			Database.create(Album.meta.modelName, { parent: parentId, name: name })
				.then(data => {
					let album = Album.addObject(data);

					// App.app.els.navDrawer.refreshAlbums();
					resolve(album);
				})
				.catch(reject);
		});
	}

	id: number;

	/** Name of album */
	name: string;

	/** Number of files in this album (and children) */
	file_count: number;

	/** ID of parent album */
	private parentID: number;

	/** Parent album (undefined if root-level) */
	get parent(): Album {
		return this.parentID === null ? null : Album.getById(this.parentID);
	}

	/** Child albums */
	get children(): Album[] {
		return Album.meta.objects.filter(album => album.parent !== null && album.parent.id == this.id);
	}

	/** Full path of the album */
	get path(): string {
		return (this.parent ? this.parent.path + "/" : "") + this.name;
	}

	/**
	 * Add a single file to album
	 * @param fileId ID of file to be added
	 * @param multiple Whether this is part of a larger operation
	 * (and so whether to reload the album)
	 * @returns Promise representing completion
	 */
	async addFile(fileId: number, multiple = false): Promise<void> {
		await Database.create(DBTables.AlbumFile, { album: this.id, file: fileId });
		if (!multiple) Album.loadObject(this.id, true);
	}

	/**
	 * Add files to album
	 * @param files List of IDs of files to be added
	 * @returns Promise representing completion
	 */
	async addFiles(files: number[]): Promise<void> {
		await promiseChain(files, (resolve, reject, fileId) => {
			this.addFile(fileId, true)
				.then(resolve)
				.catch(reject);
		});
		Album.loadObject(this.id, true);
	}

	/**
	 * Remove a file from album
	 * @param file File-like (only needs ID property) object to be removed from album
	 * @param multiple Whether or not this is part of a larger operation. If true, album listings will not be updated after removal.
	 * @returns Empty Promise object representing completion
	 */
	/* removeFile (file: { id: string }, multiple?: boolean): Promise<never> {
		return new Promise((resolve, reject) => {
			// TODO Database class
			apiRequest("albums/" + this.id + "/files/" + file.id + "/", "DELETE").then(() => {
				App.app.els.filesCont.removeFile(file.id);
				if (!multiple) {
					Database.get("albums").then((data: { id: number }[]) => {
						Album.updateObjects(data);
						App.app.els.navDrawer.refreshAlbums();
						resolve();
					});
				} else resolve();
			}).catch(reject);
		});
	} */

	/**
	 * Remove multiple files from album
	 * @param fileIDs List of IDs of files to be removed
	 * @returns Empty Promise object representing completion
	 */
	/* removeFiles (fileIDs: string[]): Promise<never> {
		return new Promise((fullResolve, fullReject) => {
			promiseChain(fileIDs, (resolve, reject, fileID: string) => { this.removeFile({ id: fileID }, true).then(resolve).catch(reject); }).then(() => {
				// TODO Database
				apiRequest("albums/").then((data: { id: number }[]) => {
					Album.updateObjects(data);
					App.app.els.navDrawer.refreshAlbums();
					fullResolve();
				}).catch(fullReject);
			}).catch(fullReject);
		});
	} */

	/**
	 * Delete album from remote database
	 * @returns Empty Promise object representing completion
	 */
	/* delete (): Promise<void> {
		return new Promise((resolve, reject) => {
			Database.delete(Album.meta.modelName, this.id).then(() => {
				Album.deleteById(this.id);
				// App.app.els.navDrawer.refreshAlbums();
				resolve();
			}).catch(reject);
		});
		//TODO BUG - removing album seems to remove other album from display (but not actually, thankfully)
	} */
}
// TODO will need to make some ammends to album api i think
// 		and certainly to how they're accessed in JS/TS
