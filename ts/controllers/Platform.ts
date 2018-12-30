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
	Small = 0,
	Standard = 1
}


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
	abstract getImgSrc (object: { id: number }, type: ("file" | "face"), size: (FileImgSizes | FaceImgSizes)): Promise<string>

	// Display notification
	abstract notify (data: { id: number, title: string, text: string, progress?: number}): void
}


// Platform-specific versions of functions
class WebPlatform extends BasePlatform {
	urls = {
		serverUrl: "http://localhost/fileserver/",

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

	getImgSrc (object: { id: number }, type: ("file" | "face"), size: (FileImgSizes | FaceImgSizes)): Promise<string> {
		switch (type) {
			case "file":
				return mediaRequest("api/images/" + object.id + "/" + ["thumbnail/", "300x200/", "1800x1200/", ""][size]);
			case "face":
			return mediaRequest("api/images/faces/" + object.id + "/" + ["40/", "200/"][size]);
		}
	}

	notify (data: { id: number, title: string, text: string, progress?: number}): void {
		// TODO
	}
}

export const Platform = new WebPlatform();
