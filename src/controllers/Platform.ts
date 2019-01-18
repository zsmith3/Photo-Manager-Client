import { mediaRequest } from "../utils";


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

// TODO document this

abstract class BasePlatform {
	urls: {
		serverUrl: string

		getPageUrl (page: string, query?: string): string

		getCurrentAddress (): string

		getCurrentQuery (): string

		getDisplayUrl (url: string): string
	}

	files: {
		// Get the full paths of all files in a directory and subdirectories
		getLocalFiles (baseDir: string): Promise<string[]>

		// Delete a list of local files
		deleteFiles (files: string[]): Promise<void>

		// Perform a list of file movements (each in the form {from: path1, to: path2})
		moveFiles (movements: { from: string, to: string }[]): Promise<void>

		// Download a list of files and save them locally
		downloadFiles (localDir: string, files: string[]): Promise<void>
	}

	// Get the src for an image
	abstract getImgSrc (object: { id: number }, type: ("file" | "face"), size: (FileImgSizes | FaceImgSizes), queue: boolean): Promise<string>

	// Display notification
	abstract notify (data: { id: number, title: string, text: string, progress?: number}): void
}


// Platform-specific versions of functions
class WebPlatform extends BasePlatform {
	/** Media queue instance for this Platform instance */
	mediaQueue = new MediaQueue()

	urls = {
		serverUrl: process.env.SERVER_URL,

		getPageUrl (page, query) {
			if (page == "index") page = "";
			return Platform.urls.serverUrl + page + (query ? ("?" + query) : "");
		},

		getCurrentAddress () {
			return window.location.pathname.substr(11);
		},

		getCurrentQuery () {
			return window.location.search;
		},

		getDisplayUrl (url) {
			return Platform.urls.serverUrl + url;
		}
	}

	getImgSrc (object: { id: number }, type: ("file" | "face"), size: (FileImgSizes | FaceImgSizes), queue: boolean): Promise<string> {
		let url: string;
		switch (type) {
			case "file":
				url = "api/images/" + object.id + "/" + ["thumbnail/", "300x200/", "1800x1200/", ""][size];
				break;
			case "face":
				url = "api/images/faces/" + object.id + "/" + [""][size];
				break;
		}

		if (queue) return this.mediaQueue.add(url);
		else return mediaRequest(url);
	}

	notify (data: { id: number, title: string, text: string, progress?: number}): void {
		// TODO
	}
}


/** Item format for MediaQueue */
interface MediaQueueItem {
	id: number,
	url: string,
	resolve: (data: string) => void,
	reject: (error?: any) => void
}

/** Queue to download media (i.e. images) sequentially, with up to some number at a time */
class MediaQueue {
	/** Maximum number of media items to be downloading at any one time */
	max: number

	/** Queued items to be downloaded */
	private items: MediaQueueItem[] = []

	/** Number of items currently being downloaded */
	private running = 0

	/** Whether the queue is currently paused */
	private paused = false

	/** Unique ID of latest item added */
	currentId = 0


	constructor (max=6) {
		this.max = max;
	}


	/**
	 * Add an item to the download queue
	 * @param url URL of the media item to download
	 * @returns Promise representing downloaded media data
	 */
	add (url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.currentId++;
			this.items.unshift({ id: this.currentId, url: url, resolve: resolve, reject: reject });
			this.run();
		});
	}

	/** Run the next download if there is space available */
	run () {
		if (this.paused || this.items.length === 0 || this.running >= this.max) return;

		let item = this.items.pop();
		this.running++;

		mediaRequest(item.url).then(data => {
			this.running--;
			item.resolve(data);
			this.run();
		}).catch(error => {
			this.running--;
			item.reject(error);
			this.run();
		});

		this.run();
	}

	/** Reset the queue (cancel all not-yet-started items) */
	reset () {
		this.items = [];
	}

	/** Pause the queue (delay all not-yet-started items) */
	pause () {
		this.paused = true;
	}

	/** Resume the queue (having paused it) */
	resume () {
		this.paused = false;
		this.run();
	}

	/**
	 * Cancel a queued item (if not started yet)
	 * @param id ID of the item to cancel
	 */
	cancel (id: number) {
		let index = this.items.findIndex(item => item.id === id);
		if (index !== -1) this.items.splice(index, 1);
	}
}


export const Platform = new WebPlatform();
