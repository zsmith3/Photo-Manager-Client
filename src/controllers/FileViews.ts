abstract class View {
	extractData(data) {
		if (App.app.data.objectType == "files") {
			if (data.constructor == Array) data = { folders: data };
			data.folders = data.folders || [];
			data.files = data.files || [];
		}

		return data;
	}

	getFiles(data) {
		var files;
		if (App.app.data.objectType == "faces") files = { folders: {}, files: data.faces };
		else
			files = {
				folders: FileObject.createFromList(data.folders),
				files: data.files
			};

		return files;
	}

	refresh(data) {
		data = this.extractData(data);

		App.app.refreshMetadata(data);

		App.app.els.toolBar.refresh();
		App.app.els.sortBar.refreshPagination(App.app.data.objectCount);

		return this.getFiles(data);
	}

	// Overridden
	addFiles(data) {}
	abstract checkRange(start, end): boolean;
	refreshDisplay() {}
	refreshPage(fpp, page) {}
	// TODO make all abstract and implement on mapview
	// 	some may not be needed on mapview, in which case
	//	add type guarding in App.ts
}

class FilesView extends View {
	refresh(data) {
		var files = super.refresh(data);

		$("#filesContainer").css("display", "");

		App.app.els.filesCont.refreshFileListing(files, App.app.getQueryParam("fpp"), App.app.getQueryParam("page"));
		//App.app.els.filesCont.refreshFiles(files);

		$("#files .mdc-linear-progress").css("display", "none");

		App.app.fetchPageFiles();
	}

	refreshDisplay() {
		App.app.els.filesCont.displayFull();
	}

	refreshPage(fpp, page) {
		App.app.els.sortBar.refreshPagination(App.app.data.objectCount);

		App.app.els.filesCont.displayInitial(fpp, page);
		//App.app.els.filesCont.refreshFiles(null, fpp, page);

		App.app.fetchPageFiles();
	}

	addFiles(data) {
		var files;
		if (App.app.data.objectType == "faces") files = Face.createFromList(data);
		else files = FileObject.createFromList(data);

		App.app.els.filesCont.addFiles(files);
	}

	checkRange(start, end) {
		return App.app.els.filesCont.checkRange(start, end);
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
	refresh(data) {
		var files = super.refresh(data);
		for (var id in files) if (!files[id].geotag) delete files[id];

		$("#filesMap").css("display", "");

		// TODO files on map
		App.app.els.filesMap.init(files);

		$("#files .mdc-linear-progress").css("display", "none");
	}

	// TODO implement
	checkRange(start, end): boolean {
		return false;
	}
}
