// Sync-pair class
class Sync {
	constructor (localDir, remoteDir) {
		if (!localDir.endsWith("/")) localDir += "/";

		this.localDir = localDir;
		this.remoteDir = remoteDir;
	}

	// Update notification
	notify (text, progress) {
		Platform.notify({
			id: Sync.notificationId,
			title: "Syncing: " + this.remoteDir + " to " + this.localDir,
			text: text,
			progressBar: progress
		});
	}

	// Run sync pair
	run () {
		this.notify({text: "Scanning file listings..."});

		let sync = this;
		return this.getAllSyncFiles().then(function (data) {
			let toDelete = Object.keys(data.localFiles).filter(id => !(id in data.remoteFiles));
			let toAdd = Object.keys(data.remoteFiles).filter(id => !(id in data.localFiles));
			let toMove = Object.keys(data.localFiles).filter(id => (id in data.remoteFiles && data.remoteFiles[id] != data.localFiles[id]));

			// Delete unwanted local files
			return Platform.deleteFiles(toDelete.map(id => data.localFiles[id])).progress(function (data) {
				sync.notify({text: "Deleting " + (data.doneCount + 1) + " of " + (data.totalCount) + " files", progress: data.doneCount / data.totalCount * 100});
			}).then(function () {
				// Move out-of-place local files
				return Platform.moveFiles(toMove.map(id => ({from: data.localFiles[id], to: sync.localDir + data.remoteFiles[id]}))).progress(function (data) {
					sync.notify({text: "Moving " + (data.doneCount + 1) + " of " + (data.totalCount) + " files", progress: data.doneCount / data.totalCount * 100});
				});
			}).then(function () {
				// Download new files
				return Platform.downloadFiles(sync.localDir, toAdd.map(id => data.remoteFiles[id])).progress(function (data) {
					sync.notify({text: "Downloading " + (data.doneCount + 1) + " of " + (data.totalCount) + " files", progress: data.doneCount / data.totalCount * 100});
				});
			});
		});
	}

	// Get all files for sync pair (local and remote)
	getAllSyncFiles () {
		let sync = this;
		return new Promise(function (resolve, reject) {
			var allLocalFiles, allRemoteFiles;

			this.notify({text: "Scanning local file listings..."});
			sync.getLocalFiles(sync.localDir).then(function (files) {
				allLocalFiles = files.reduce((allFiles, filePath) => Object.assign(allFiles, {[filePath.split("/").reverse()[0].split(".")[0]]: decodeURI(filePath.substr(sync.localDir.length))}), {});

				this.notify({text: "Fetching remote file listings..."});
				apiRequest("folders/" + sync.remoteDir + "/files/?isf=true&fpp=inf&fields=id,path").then(function (files) {
					allRemoteFiles = files.reduce((allFiles, file) => Object.assign(allFiles, {[file.id]: file.path}), {});

					resolve({localFiles: allLocalFiles, remoteFiles: allRemoteFiles});
				});
			});
		});
	}
}

Sync.notificationId = 0;

Sync.runAll = function () {
	// Storage format:
	// localStorage.sync.pairs = [{localDir: "", remoteDir: ""}]
	// TODO add stuff like whether to do each auto or not, etc.

	syncPairs = JSON.parse(window.localStorage.getItem("sync")).pairs.map(pair => new Sync(pair.localDir, pair.remoteDir));
	return promiseChain(syncs, function (resolve, reject, sync) {
		sync.run().then(resolve);
	});
};
