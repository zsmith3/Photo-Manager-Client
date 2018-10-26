abstract class View {
	extractData (data) {
		if (app.data.objectType == "files") {
			if (data.constructor == Array) data = {folders: data};
			data.folders = data.folders || [];
			data.files = data.files || [];
		}

		return data;
	}

	getFiles (data) {
		var files;
		if (app.data.objectType == "faces") files = {folders: {}, files: data.faces};
		else files = {folders: FileObject.createFromList(data.folders), files: data.files};

		return files;
	}

	refresh (data) {
		data = this.extractData(data);

		app.refreshMetadata(data);

		app.els.toolBar.refresh();
		app.els.sortBar.refreshPagination(app.data.objectCount);

		return this.getFiles(data);
	}

	// Overridden
	addFiles (data) {}
	abstract checkRange (start, end): boolean
	refreshDisplay () {}
	refreshPage (fpp, page) {}
	// TODO make all abstract and implement on mapview
	// 	some may not be needed on mapview, in which case
	//	add type guarding in App.ts
}

class FilesView extends View {
	refresh (data) {
		var files = super.refresh(data);

		$("#filesContainer").css("display", "");

		app.els.filesCont.refreshFileListing(files, app.getQueryParam("fpp"), app.getQueryParam("page"));
		//app.els.filesCont.refreshFiles(files);

		$("#files .mdc-linear-progress").css("display", "none");

		app.fetchPageFiles();
	}

	refreshDisplay () {
		app.els.filesCont.displayFull();
	}

	refreshPage (fpp, page) {
		app.els.sortBar.refreshPagination(app.data.objectCount);

		app.els.filesCont.displayInitial(fpp, page);
		//app.els.filesCont.refreshFiles(null, fpp, page);

		app.fetchPageFiles();
	}

	addFiles (data) {
		var files;
		if (app.data.objectType == "faces") files = Face.createFromList(data);
		else files = FileObject.createFromList(data);

		app.els.filesCont.addFiles(files);
	}

	checkRange (start, end) {
		return app.els.filesCont.checkRange(start, end);
	}
}

/* class CommentsView extends View {
	refresh () {

	}
}

class PeopleView extends View {
	refresh () {

	}
} */

class MapView extends View {
	refresh (data) {
		var files = super.refresh(data);
		for (var id in files) if (!files[id].geotag) delete files[id];

		$("#filesMap").css("display", "");

		// TODO files on map
		app.els.filesMap.init(files);

		$("#files .mdc-linear-progress").css("display", "none");
	}

	// TODO implement
	checkRange (start, end): boolean { return false; }
}
