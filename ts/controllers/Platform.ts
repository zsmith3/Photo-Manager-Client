import { mediaRequest } from "../utils";


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
	abstract getImgSrc (object: any, size: string): Promise<string>

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

	getImgSrc (object: { type: ("file" | "face"), id: number }, size: string): Promise<string> {
		switch (object.type) {
		case "file":
			return mediaRequest("api/images/" + object.id + size);
		case "face":
			return mediaRequest("api/images/faces/" + object.id + size);
		}
	}

	notify (data: { id: number, title: string, text: string, progress?: number}): void {
		// TODO
	}
}

export const Platform = new WebPlatform();
