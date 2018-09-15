// Files container to handle file/face listings
class FilesContainer extends HTMLElement {
	constructor () {
		super();

		this.format = "empty";
		this._allFiles = {};
		this.sortedFiles = [];
		this.page = 1;
		this.fpp = 50; // TODO
	}

	// Refresh the files shown
	/* refreshFiles (files, fpp, page) {
		this.format = "files";
		if (files !== undefined && files !== null) this.allFiles = files;

		if (page !== undefined && page !== null) this.page = page;
		if (fpp !== undefined && fpp !== null) this.fpp = fpp;

		// TODO consider updating rather than removing, see what performance is like
		//$(this).find("file-box, face-box").remove();
		$(this).html("");

		for (var i in this.currentFiles) {
			if (pageLoader.data.objectType == "faces") $("<face-box data-id='" + this.currentFiles[i] + "'></face-box>").appendTo(this);
			else $("<file-box data-id='" + this.currentFiles[i] + "'></file-box>").appendTo(this);
		}

		let parent = this;
		setTimeout(function () { parent.scaleFiles($("#thumbScaler").val()); }, 0);
	} */

	refreshFileListing (data, fpp, page) {
		this.format = "files";
		this.allFiles = data.folders;
		this.sortedFiles = Object.keys(data.folders).concat(data.files);

		this.displayInitial(fpp, page);

		// TODO faces (on API side as well)
	}

	displayInitial (fpp, page) {
		if (fpp !== undefined && fpp !== null) this.fpp = fpp;
		if (page !== undefined && page !== null) this.page = page;

		$(this).html("");

		for (var i in this.currentFiles) {
			if (pageLoader.data.objectType == "faces") $("<face-box data-id='" + this.currentFiles[i] + "'></face-box>").appendTo(this);
			else $("<file-box data-id='" + this.currentFiles[i] + "'></file-box>").appendTo(this);
		}

		let parent = this;
		setTimeout(function () { parent.scaleFiles(); }, 0);
	}

	displayFull () {
		$(this).find("file-box, face-box").each(function () { this.generate(); });
	}


	refreshGroups (groups) {
		this.format = "groups";
		this.groups = groups;
		this.allFiles = {};

		$(this).html("");

		for (var i in this.groups) {
			let group = $("<div class='mdc-elevation--z2 files-group'></div>").appendTo(this);
			$("<h3></h3>").text(this.groups[i].name).appendTo(group);
			for (var j in this.groups[i][pageLoader.data.objectType]) {
				if (pageLoader.data.objectType == "people") $("<person-box data-id='" + this.groups[i][pageLoader.data.objectType][j].id + "'></person-box>").appendTo(group);
			}
		}
	}

	// Add new files to allFiles
	addFiles (files) {
		Object.assign(this.allFiles, files);
	}

	// Check if all files in a range have been loaded
	checkRange (start, end) {
		let parent = this;
		return [...Array(end - start).keys()].map(n => parent.sortedFiles[n + start]).filter(id => id !== undefined && !(id in parent.allFiles)).length == 0;
	}

	removeFile (id) {
		$(this.getFilebox(id)).remove();
		this.sortedFiles.splice(this.sortedFiles.indexOf(id), 1);
		delete this.allFiles[id];
		this.displayInitial();

		// TODO need to add proper sorting options at some point but i think for now lets try doing native apps with syncing
	}

	// Scale file boxes
	scaleFiles (scale) {
		$(this).find("file-box, face-box").each(function () { this.scale(scale); });
	}

	selectAll (value, auto) {
		$("file-box, face-box").each(function () { this.selected = value; });

		/* var hiddenChecks = document.getElementsByClassName("hiddenfilecheck");
		for (i = 0; i < hiddenChecks.length; i++) {
			hiddenChecks[i].checked = false;
		} */

		this.updateSelection();

		if (value && pageLoader.config.get("select_mode") == 1) {
			pageLoader.config.set("select_mode", 2);
		} else if (!value && pageLoader.config.get("select_mode") == 2) {
			pageLoader.config.set("select_mode", 1);
		}

		if (!auto) this.onSelectionChange();
	}

	invertSelection () {
		$(this).find("file-box, face-box").each(function () { this.selected = !this.selected; });

		this.updateSelection();

		this.onSelectionChange();
	}

	selectRange (last) {
		if (!("lastSelected" in this)) this.lastSelected = $("file-box").get(0);

		let container = this;
		$(this).find("file-box, face-box").each(function () {
			if ((this.compareDocumentPosition(last) == container.lastSelected.compareDocumentPosition(last) &&
				this.compareDocumentPosition(container.lastSelected) == last.compareDocumentPosition(container.lastSelected))
				|| (this == container.lastSelected || this == last))
			{
				this.checkbox.checked = true;
			}
		});

		this.updateSelection();

		this.onSelectionChange();
	}

	updateSelection () {
		$(this).find("file-box, face-box").each(function () { this.updateSelection(); });
	}

	onSelectionChange () {
		infoColumn.setInfo(this.selection);
	}

	get selection () {
		var selection = [];
		$(this).find("file-box, face-box").each(function () {
			if (this.selected) selection.push($(this).attr("data-id"));
		});
		return selection;
	}

	// Get the next/previous file
	getAdjacentFile (file, direction, requireType) {
		var searchArray;
		let parent = this;
		if (requireType) searchArray = this.sortedFiles.filter(file => (parent.allFiles[file] && parent.allFiles[file].type == requireType));
		else searchArray = this.sortedFiles;
		return this.allFiles[searchArray[searchArray.indexOf(file.id) + direction]];
	}

	// Retrieve a file object by ID
	getFile (id) {
		return this.allFiles[id] || null;
	}

	// Get the filebox from a file ID
	getFilebox (id) {
		let fboxes = $(this).find("file-box, face-box, person-box").filter("[data-id=" + id + "]");
		if (fboxes.length > 0) {
			return fboxes.get(0);
		} else if (this.getFile(id)) {
			return $("<file-box data-id='" + id + "'></file-box>").appendTo(this).get(0);
		}
	}

	get allFiles () {
		if (this.format == "groups") {
			var files = {};

			for (var i in this.groups) {
				for (var j in this.groups[i][pageLoader.data.objectType]) {
					files[this.groups[i][pageLoader.data.objectType][j].id] = this.groups[i][pageLoader.data.objectType][j];
				}
			}

			return files;
		} else if (this.format == "files") {
			return this._allFiles;
		}
	}

	set allFiles (value) { this._allFiles = value; }

	get currentFiles () {
		// TODO - current method only works for non-grouped
		return this.sortedFiles.slice((this.page - 1) * this.fpp, this.page * this.fpp);
	}
}

window.customElements.define("files-container", FilesContainer);
