import {promiseChain, apiRequest } from "../utils";
import Platform from "./Platform";

// Sync-pair class
export default class SyncPair {
	static notificationId = 0;

	localDir: string;
	remoteDir: string;

	static getAll() {
		// Storage format:
		// localStorage.sync.pairs = [{localDir: "", remoteDir: ""}]
		// TODO add stuff like whether to do each auto or not, etc.

		let storedSyncs: {
			pairs: { localDir: string; remoteDir: string }[];
		} = JSON.parse(window.localStorage.getItem("sync"));
		return storedSyncs.pairs.map(pair => new SyncPair(pair.localDir, pair.remoteDir));
	}

	static runAll() {
		return promiseChain(this.getAll(), (resolve, reject, sync: SyncPair) =>
			sync.run().then(resolve));
	}

	static save(syncPairs: SyncPair[]) {
		window.localStorage.setItem("sync", JSON.stringify({pairs: syncPairs}));
	}

	constructor(localDir: string, remoteDir: string) {
		if (!localDir.endsWith("/")) localDir += "/";

		this.localDir = localDir;
		this.remoteDir = remoteDir;
	}

	toJSON() {
		return {localDir: this.localDir, remoteDir: this.remoteDir};
	}

	// Update notification
	notify(object: { text: string; progress?: number }) {
		Platform.notify({
			id: SyncPair.notificationId,
			title: "Syncing: " + this.remoteDir + " to " + this.localDir,
			text: object.text,
			progress: object.progress
		});
	}

	// Run sync pair
	async run() {
		this.notify({ text: "Scanning file listings..." });

		let sync = this;
		const data = await this.getAllSyncFiles();
		let toDelete = Object.keys(data.localFiles).filter(id => !(id in data.remoteFiles));
		let toAdd = Object.keys(data.remoteFiles).filter(id => !(id in data.localFiles));
		let toMove = Object.keys(data.localFiles).filter(id => id in data.remoteFiles && data.remoteFiles[id] != data.localFiles[id]);

		await Platform.files
			.deleteFiles(toDelete.map(id => data.localFiles[id]))
			.progress(progressData => 
				this.notify({
					text: "Deleting " + (progressData.doneCount + 1) + " of " + progressData.totalCount + " files",
					progress: (progressData.doneCount / progressData.totalCount) * 100
				})
			, false);

		await Platform.files
			.moveFiles(
				toMove.map(id => ({
					from: data.localFiles[id],
					to: sync.localDir + data.remoteFiles[id]
				}))
			)
			.progress(progressData =>
				this.notify({
					text: "Moving " + (progressData.doneCount + 1) + " of " + progressData.totalCount + " files",
					progress: (progressData.doneCount / progressData.totalCount) * 100
				}), false);

		return await Platform.files
			.downloadFiles(
				this.localDir,
				toAdd.map(id => data.remoteFiles[id])
			)
			.progress(progressData =>
				this.notify({
					text: "Downloading " + (progressData.doneCount + 1) + " of " + progressData.totalCount + " files",
					progress: (progressData.doneCount / progressData.totalCount) * 100
				}), false);
	}

	// Get all files for sync pair (local and remote)
	async getAllSyncFiles() {
		this.notify({ text: "Scanning local file listings..." });
		const localFiles = await Platform.files.getLocalFiles(this.localDir);
		const allLocalFiles = localFiles.reduce(
			(allFiles, filePath) =>
				Object.assign(allFiles, {
					[filePath
						.split("/")
						.reverse()[0]
						.split(".")[0]]: decodeURI(filePath.substr(this.localDir.length))
				}),
			{}
		);

		this.notify({ text: "Fetching remote file listings..." });
		const remoteFiles = await apiRequest("folders/" + this.remoteDir + "/files/?isf=true&fpp=inf&fields=id,path");
		const allRemoteFiles = remoteFiles.reduce((allFiles, file) => Object.assign(allFiles, { [file.id]: file.path }), {});

		return { localFiles: allLocalFiles, remoteFiles: allRemoteFiles };
	}
}
