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

var Platform: BasePlatform;
