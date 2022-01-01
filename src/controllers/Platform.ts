import { mediaRequest, promiseChain } from "../utils";

/** Sizes for File image data requests */
export enum FileImgSizes {
	Thumbnail = 0,
	Small = 1,
	Large = 2,
	Original = 3
}

/** Sizes for Face image data requests */
export enum FaceImgSizes {
	Standard = 0
}

/** Models which can be opened in ImageModal */
export type ImageModelType = "file" | "face" | "scan";

// TODO document this

abstract class BasePlatform {
	urls: {
		serverUrl: string;

		getPageUrl(page: string, query?: string): string;

		getCurrentAddress(): string;

		getCurrentQuery(): string;

		getDisplayUrl(url: string): string;
	};

	files: {
		// Get the full paths of all files in a directory and subdirectories
		getLocalFiles(baseDir: string): Promise<string[]>;

		// Delete a list of local files
		deleteFiles(files: string[]): Promise<void>;

		// Perform a list of file movements (each in the form {from: path1, to: path2})
		moveFiles(movements: { from: string; to: string }[]): Promise<void>;

		// Download a list of files and save them locally
		downloadFiles(localDir: string, files: string[]): Promise<void>;
	};

	// Get the src for an image
	abstract getImgSrc(object: { id: number }, type: "file" | "face", size: FileImgSizes | FaceImgSizes, queue: boolean): Promise<string>;

	// Display notification
	abstract notify(data: { id: number; title: string; text: string; progress?: number }): void;
}

// Platform-specific versions of functions
class WebPlatform extends BasePlatform {
	/** Media queue instance for this Platform instance */
	mediaQueue = new MediaQueue();

	urls = {
		serverUrl: process.env.SERVER_URL,

		getPageUrl(page, query) {
			if (page == "index") page = "";
			return Platform.urls.serverUrl + page + (query ? "?" + query : "");
		},

		getCurrentAddress() {
			return window.location.pathname.substr(11);
		},

		getCurrentQuery() {
			return window.location.search;
		},

		getDisplayUrl(url) {
			return Platform.urls.serverUrl + url;
		}
	};

	getImgSrc(object: { id: number }, type: ImageModelType, size: FileImgSizes | FaceImgSizes, queue: boolean): Promise<string> {
		let url: string;
		switch (type) {
			case "file":
				url = "api/images/" + object.id + "/" + ["thumbnail/", "300x200/", "1800x1200/", ""][size];
				break;
			case "face":
				url = "api/images/faces/" + object.id + "/" + [""][size];
				break;
			case "scan":
				url = "api/images/scans/" + object.id + "/" + ["thumbnail/", "300x200/", "1800x1200/", ""][size];
				break;
		}

		if (queue) return this.mediaQueue.add(url);
		else return mediaRequest(url);
	}

	notify(data: { id: number; title: string; text: string; progress?: number }): void {
		// TODO
	}
}

class CordovaPlatform extends BasePlatform {
	urls = {
		get serverUrl () { return window.localStorage.serverUrl; },

		getPageUrl(page, query) {
			return page + ".html" + (query ? ("?" + query) : "");
		},

		getCurrentAddress() {
			return new URLSearchParams(window.location.search).get("address") || "";
		},

		getCurrentQuery() {
			let params = new URLSearchParams(window.location.search);
			params.delete("address");
			return params.toString();
		},

		getDisplayUrl(url) {
			var query;
			if (url.indexOf("?") !== -1) {
				query = new URLSearchParams(url.substr(url.indexOf("?")));
				url = url.substr(0, url.indexOf("?"));
			} else query = new URLSearchParams();

			query.set("address", url);

			return "index.html?" + query.toString();
		}
	}

	// Display notification
	notify (data) {
		cordova.plugins.notification.local.schedule({
			id: data.id,
			title: data.title,
			text: data.text,
			progressBar: (data.progress || data.progress === 0) ? { value: data.progress } : null
		});
	}

	// Get the src for an image
	getImgSrc(object, size) {
		switch (object.type) {
		case "file":
			return mediaRequest("api/images/" + object.id + size);
		case "face":
			return mediaRequest("api/images/faces/" + object.id + size);
		}
	}

	fileTransfer: FileTransfer = null

	// TODO resolve all the missing modules
	// and try to convert to async rather than callbacks

	// Get the full paths of all files in a directory and subdirectories
	getLocalFiles(baseDir: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			window.resolveLocalFileSystemURL(baseDir, directory => {
				let dReader = directory.createReader();
				let entries = [];

				let getEntries = () =>  {
					dReader.readEntries(results => {
						if (results.length) {
							entries = entries.concat(results);
							getEntries();
						} else {
							promiseChain(entries, (resolve, reject, entry, allFiles) => {
								if (entry.isDirectory) {
									this.getLocalFiles(entry.nativeURL).then(files => {
										resolve(allFiles.concat(files));
									});
								} else {
									resolve(allFiles.concat([entry.nativeURL]));
								}
							}, []).then(allFiles => {
								resolve(allFiles);
							});
						}
					});
				};

				getEntries();
			}, reject);
		});
	}

	// Delete a list of local files
	deleteFiles(files: string[]) {
		return promiseChain(files, (resolve, reject, filePath) => {
			window.resolveLocalFileSystemURL(filePath, entry => {
				if (entry.isDirectory) {
					this.getLocalFiles(entry.toURL()).then((allFiles) => {
						return this.deleteFiles(allFiles);
					}).then(() => {
						entry.remove(resolve, reject);
					});
				} else entry.remove(resolve, reject);
			});
		});
	}

	// Perform a list of file movements (each in the form {from: path1, to: path2})
	moveFiles(movements: {from: string, to: string}[]) {
		return promiseChain(movements, function (resolve, reject, movement) {
			window.resolveLocalFileSystemURL(movement.from, fileEntry => {
				let dirURL = movement.to.split("/").reverse().slice(1).reverse().join("/");
				let newName = movement.to.split("/").reverse()[0];
				window.resolveLocalFileSystemURL(dirURL, dirEntry => {
					fileEntry.moveTo(dirEntry, newName, resolve, reject);
				});
			});
		});
	}

	// Download a list of files and save them locally
	downloadFiles(localDir: string, files: string[]) {
		return promiseChain(files, (resolve, reject, file) => {
			if (this.fileTransfer === null) throw "Tried to download files but FileTransfer instance not found"
			else this.fileTransfer.download(this.urls.serverUrl + "api/images/" + file.split("/").reverse()[0].split(".")[0] + "/", localDir + file, resolve, reject);
		});
		// TODO check this does correct quality etc.
		// TODO different sizes (as parameter to this)
	}
};


/** Item format for MediaQueue */
interface MediaQueueItem {
	id: number;
	url: string;
	resolve: (data: string) => void;
	reject: (error?: any) => void;
}

/** Queue to download media (i.e. images) sequentially, with up to some number at a time */
class MediaQueue {
	/** Maximum number of media items to be downloading at any one time */
	max: number;

	/** Queued items to be downloaded */
	private items: MediaQueueItem[] = [];

	/** Number of items currently being downloaded */
	private running = 0;

	/** Whether the queue is currently paused */
	private paused = false;

	/** Unique ID of latest item added */
	currentId = 0;

	constructor(max = 6) {
		this.max = max;
	}

	/**
	 * Add an item to the download queue
	 * @param url URL of the media item to download
	 * @returns Promise representing downloaded media data
	 */
	add(url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.currentId++;
			this.items.unshift({
				id: this.currentId,
				url: url,
				resolve: resolve,
				reject: reject
			});
			this.run();
		});
	}

	/** Run the next download if there is space available */
	run() {
		if (this.paused || this.items.length === 0 || this.running >= this.max) return;

		let item = this.items.pop();
		this.running++;

		mediaRequest(item.url)
			.then(data => {
				this.running--;
				item.resolve(data);
				this.run();
			})
			.catch(error => {
				this.running--;
				item.reject(error);
				this.run();
			});

		this.run();
	}

	/** Reset the queue (cancel all not-yet-started items) */
	reset() {
		this.items = [];
	}

	/** Pause the queue (delay all not-yet-started items) */
	pause() {
		this.paused = true;
	}

	/** Resume the queue (having paused it) */
	resume() {
		this.paused = false;
		this.run();
	}

	/**
	 * Cancel a queued item (if not started yet)
	 * @param id ID of the item to cancel
	 */
	cancel(id: number) {
		let index = this.items.findIndex(item => item.id === id);
		if (index !== -1) this.items.splice(index, 1);
	}
}

// Export correct Platform version
let Platform: BasePlatform;

if (process.env.BUILD_PLATFORM === undefined || process.env.BUILD_PLATFORM === "browser") {
	Platform = new WebPlatform();
} else {
	Platform = new CordovaPlatform();
	document.addEventListener("deviceready", () => (Platform as CordovaPlatform).fileTransfer = new FileTransfer(), false);
}

export default Platform;
