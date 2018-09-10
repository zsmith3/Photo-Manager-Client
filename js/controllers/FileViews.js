class View {
	constructor (loader) {
		this.loader = loader;
	}

	extractData (data) {
		if (this.loader.data.objectType == "files") {
			if (data.constructor == Array) data = {folders: data};
			data.folders = data.folders || [];
			data.files = data.files || [];
		}

		return data;
	}

	getFiles (data) {
		var files;
		if (this.loader.data.objectType == "faces") files = {folders: {}, files: data.faces};
		else files = {folders: FileObject.createFromList(data.folders), files: data.files};

		return files;
	}

	refresh (data) {
		data = this.extractData(data);

		this.loader.refreshMetadata(data);

		toolBar.refresh();
		sortBar.refreshPagination(this.loader.data.objectCount);

		return this.getFiles(data);
	}

	// Overridden
	addFiles () {}
	checkRange () {}
}

class FilesView extends View {
	refresh (data) {
		var files = super.refresh(data);

		$("#filesContainer").css("display", "");

		this.loader.filesContainer.refreshFileListing(files, this.loader.getQueryParam("fpp"), this.loader.getQueryParam("page"));
		//this.loader.filesContainer.refreshFiles(files);

		$("#files .mdc-linear-progress").css("display", "none");

		pageLoader.fetchPageFiles();
	}

	refreshDisplay () {
		this.loader.filesContainer.displayFull();
	}

	refreshPage (fpp, page) {
		sortBar.refreshPagination(this.loader.data.objectCount);

		this.loader.filesContainer.displayInitial(fpp, page);
		//this.loader.filesContainer.refreshFiles(null, fpp, page);

		pageLoader.fetchPageFiles();
	}

	addFiles (data) {
		var files;
		if (this.loader.data.objectType == "faces") files = Face.createFromList(data);
		else files = FileObject.createFromList(data);

		this.loader.filesContainer.addFiles(files);
	}

	checkRange (start, end) {
		return this.loader.filesContainer.checkRange(start, end);
	}
}

class CommentsView extends View {
	refresh () {

	}
}

class PeopleView extends View {
	refresh () {

	}
}

class MapView extends View {
	refresh (data) {
		var files = super.refresh(data);
		for (var id in files) if (!files[id].geotag) delete files[id];

		$("#filesMap").css("display", "");

		// TODO files on map
		this.loader.filesMap.init(files);

		$("#files .mdc-linear-progress").css("display", "none");
	}
}
