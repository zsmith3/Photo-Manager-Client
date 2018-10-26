// Files container to handle file/face listings
class FilesContainer extends HTMLElement {
	format: string
	_allFiles: object;
	groups: PersonGroup[]
	sortedFiles: string[]
	page: number
	fpp: number

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
			if (app.data.objectType == "faces") $("<face-box data-id='" + this.currentFiles[i] + "'></face-box>").appendTo(this);
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

	displayInitial (fpp?: number, page?: number) {
		if (fpp !== undefined && fpp !== null) this.fpp = fpp;
		if (page !== undefined && page !== null) this.page = page;

		$(this).html("");

		for (var i in this.currentFiles) {
			if (app.data.objectType == "faces") $("<face-box data-id='" + this.currentFiles[i] + "'></face-box>").appendTo(this);
			else $("<file-box data-id='" + this.currentFiles[i] + "'></file-box>").appendTo(this);
		}

		let _this = this;
		setTimeout(function () { _this.scaleFiles(); }, 0);
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
			for (var j in this.groups[i][app.data.objectType]) {
				if (app.data.objectType == "people") $("<person-box data-id='" + this.groups[i][app.data.objectType][j].id + "'></person-box>").appendTo(group);
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
	scaleFiles (scale?: number) {
		$(this).find("file-box, face-box").each(function () { this.scale(scale); });
	}

	selectAll (value, auto) {
		$("file-box, face-box").each(function () { app.els.getElement<Filebox>(this, "file-box").selected = value; });

		/* var hiddenChecks = document.getElementsByClassName("hiddenfilecheck");
		for (i = 0; i < hiddenChecks.length; i++) {
			hiddenChecks[i].checked = false;
		} */

		this.updateSelection();

		if (value && app.config.get("select_mode") == 1) {
			app.config.set("select_mode", 2);
		} else if (!value && app.config.get("select_mode") == 2) {
			app.config.set("select_mode", 1);
		}

		if (!auto) this.onSelectionChange();
	}

	invertSelection () {
		$(this).find("file-box, face-box").each(function () { this.selected = !this.selected; });

		this.updateSelection();

		this.onSelectionChange();
	}

	selectRange (last) {
		if (!("lastSelected" in this)) {
			if (this.selection.length) this.lastSelected = this.getFilebox(this.selection[0]);
			else this.lastSelected = $("file-box").get(0);
		}

		let _this = this;
		$(this).find("file-box, face-box").each(function () {
			if ((this.compareDocumentPosition(last) == _this.lastSelected.compareDocumentPosition(last) &&
				this.compareDocumentPosition(_this.lastSelected) == last.compareDocumentPosition(_this.lastSelected))
				|| (this == _this.lastSelected || this == last))
			{
				this.checkbox.checked = true;
			}
		});

		this.updateSelection();

		this.onSelectionChange();
	}

	moveSelection (axis, direction) {
		if (!("lastSelected" in this)) {
			if (this.selection.length) this.lastSelected = this.getFilebox(this.selection[0]);
			else this.lastSelected = $("file-box").get(0);
		}

		let currentRect = this.lastSelected.getBoundingClientRect();
		let currentX = currentRect.x + currentRect.width / 2;
		let currentY = currentRect.y + currentRect.height / 2;

		let newX = currentX + direction * (axis == "x" ? currentRect.width : 0);
		let newY = currentY + direction * (axis == "y" ? currentRect.height : 0);

		let newFBoxes = $(document.elementFromPoint(newX, newY)).closest("file-box");

		let lastFile = this.getAdjacentFile(this.lastSelected.file, -1);
		let nextFile = this.getAdjacentFile(this.lastSelected.file, 1);
		let defaults = {
			"x-1": lastFile ? this.getFilebox(lastFile.id) : null,
			"x1": nextFile ? this.getFilebox(nextFile.id) : null,
			"y-1": $("file-box").get(0),
			"y1": $("file-box").get($("file-box").length - 1)
		};

		let newFBox;
		if (newFBoxes.length) newFBox = newFBoxes.get(0);
		else newFBox = defaults[axis + direction];

		if (newFBox === null) return;

		this.selectAll(false, true);
		newFBox.selected = true;
		this.lastSelected = newFBox;

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

	// Apply a promise-based function to the current selection
	applyToSelection (action, undoAction, selection) {
		selection = selection || this.selection;

		let _this = this;

		var filesText = selection.length + " " + app.data.objectType;
		if (selection.length == 1) filesText = filesText.substr(0, filesText.length - 1);

		var afterSnackbar;
		if (undoAction) afterSnackbar = { message: action.afterMessage.replace(/%f/g, filesText), actionText: "Undo", actionHandler: function () { _this.applyToSelection(undoAction, action, selection); } };
		else afterSnackbar = { message: action.afterMessage.replace(/%f/g, filesText) };

		return new Promise(function (resolve, reject) {
			app.snackbar.show({ message: action.beforeMessage.replace(/%f/g, filesText) });
			promiseChain(selection.map(id => _this.getFile(id)), action.callback).then(function () {
				app.dismissSnackbar();
				app.snackbar.show(afterSnackbar);
				resolve();
			}).catch(reject);
		});
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
	getFilebox (id): Filebox {
		let fboxes = $(this).find("file-box, face-box, person-box").filter("[data-id=" + id + "]");
		if (fboxes.length > 0) {
			return app.els.getElement<Filebox>(fboxes.get(0), "file-box");
		} else if (this.getFile(id)) {
			return app.els.getElement<Filebox>($("<file-box data-id='" + id + "'></file-box>").appendTo(this).get(0), "file-box");
		}
	}

	get allFiles () {
		if (this.format == "groups") {
			var files = {};

			for (var i in this.groups) {
				for (var j in this.groups[i][app.data.objectType]) {
					files[this.groups[i][app.data.objectType][j].id] = this.groups[i][app.data.objectType][j];
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
