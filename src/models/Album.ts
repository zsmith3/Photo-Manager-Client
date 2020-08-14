import FileCard from "../components/MainPage/MainView/cards/FileCard";
import { Database, DBTables } from "../controllers/Database";
import { promiseChain } from "../utils";
import { FileObject } from "./FileObject";
import { ModelMeta } from "./Model";
import RootModel from "./RootModel";

/** Album model */
export class Album extends RootModel {
	/** Album model metadata */
	static meta = new ModelMeta<Album>({
		modelName: DBTables.Album,
		props: ["id", "name", "file_count"],
		specialProps: { parent: "parentID" }
	});

	static rootModelMeta = {
		contentsName: "Files",
		contentsCard: FileCard,
		contentsFilterParam: "album",
		contentsClass: FileObject,
		hasRoots: false
	};

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

	/** All parent albums (found recursively) */
	get allParents(): Album[] {
		if (this.parent === null) return [];
		else return [this.parent].concat(this.parent.allParents);
	}

	/** Child albums */
	get children(): Album[] {
		return Album.meta.objects.filter(album => album.parent !== null && album.parent.id == this.id);
	}

	/** All child albums (found recursively) */
	get allChildren(): Album[] {
		let allChildren = this.children;
		this.children.forEach(album => allChildren.concat(album.allChildren));
		return allChildren;
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
		if (!multiple) this.updateParents();
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
		this.updateParents();
	}

	/** Reload data about all parents of this album, after adding files */
	updateParents() {
		let parents = this.allParents.concat([this]);
		parents.forEach(album => album.resetData());
		let albumIds = parents.map(album => album.id);
		Album.loadIds(albumIds, true);
	}

	/**
	 * Change the parent album of this album (and update local data)
	 * @param newParentId ID of new parent album
	 * @returns Promise representing completion
	 */
	async changeParent(newParentId: number) {
		let oldParent = this.parent;
		await this.updateSave({ parent: newParentId });
		oldParent.updateParents();
		this.parent.updateParents();
		Album.meta.listUpdateHandlers.handle();
	}

	/**
	 * Reload local data about child and parent albums after removing files
	 * @param fileIds List of File IDs which have been removed
	 * @param removeFromParents Whether files have also been removed from parent albums (default=false)
	 */
	removeFilesLocally(fileIds: number[], removeFromParents = false) {
		let albums = this.allChildren;
		albums.push(this);
		if (removeFromParents) albums.push(...this.allParents);
		albums.forEach(album => album.removeContentsItems(fileIds));
		let albumIds = albums.map(album => album.id);
		Album.loadIds(albumIds, true);
	}

	/**
	 * Remove a single file from this album
	 * @param fileId ID of file to remove
	 * @param multiple Whether this is part of a larger operation
	 * (and so whether to reload local data)
	 * @returns Promise representing completion
	 */
	async removeFile(fileId: number, removeFromParents = false, multiple = false) {
		const albumFiles = await Database.get(DBTables.AlbumFile, [
			{ field: "album", type: "exact", value: this.id },
			{ field: "file", type: "exact", value: fileId }
		]);
		if (removeFromParents || this.parent === null) await Database.delete(DBTables.AlbumFile, albumFiles[0].id);
		else await Database.update(DBTables.AlbumFile, albumFiles[0].id, { album: this.parent.id });
		if (!multiple) this.removeFilesLocally([fileId], removeFromParents);
	}

	/**
	 * Remove a set of files from this album
	 * @param files List of File ids to remove
	 * @param removeFromParents Whether to also remove the files from the parent of this album (default=false)
	 * Promise representing completion
	 */
	async removeFiles(files: number[], removeFromParents = false) {
		await promiseChain(files, (resolve, reject, fileId) => {
			this.removeFile(fileId, removeFromParents, true)
				.then(resolve)
				.catch(reject);
		});
		this.removeFilesLocally(files, removeFromParents);
	}

	/**
	 * Delete album from remote database
	 * @returns Empty Promise object representing completion
	 */
	delete(): Promise<void> {
		return new Promise((resolve, reject) => {
			Database.delete(Album.meta.modelName, this.id)
				.then(() => {
					Album.deleteById(this.id);
					resolve();
				})
				.catch(reject);
		});
	}
}
