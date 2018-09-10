// Info column class
class InfoColumn extends ToggleBar {
	//Display info about a selection TOREM infocol/setfdetails
	setInfo (selection) {
		if (!this.open) return;

		if (selection !== null && selection.constructor == Array) {
			if (selection.length == 0) {
				this.setInfo(pageLoader.data.currentRootObject);
			} else if (selection.length == 1) {
				this.setInfo(pageLoader.filesContainer.getFile(selection[0]));
			} else {
				// TODO this now
				let cont = pageLoader.filesContainer;
				this.setInfo(new FileObject({
					name: cont.getFile(selection[0]).name + " + " + (selection.length - 1) + " more",
					type: selection.map(id => cont.getFile(id).type).filter(t => t != cont.getFile(selection[0]).type).length ? "Various" : cont.getFile(selection[0]).type,
					length: selection.reduce((totalSize, file) => totalSize + cont.getFile(file).length, 0),
					file_count: selection.length
				}));
			}
		} else {
			$("#infocolumn-thumbdiv > *").css("display", "none");
			var infoObj = {};

			if (selection === null) {
				infoObj = {
					name: "None",
					type: null,
					geotag: null,
					size: null,
					fcount: null
				};
			} else if (selection.constructor == Face) {
				this.setInfo(selection.file);
			} else if (selection.constructor == FileObject) {
				if ((selection.type == "image" || selection.type == "video") && selection.data[0]) {
					$("#infocolumn-thumb").attr("src", selection.data[0]).css("display", "");
				} else {
					let icons = {
						image: "photo",
						video: "movie",
						folder: "folder_open",
						file: "insert_drive_file"
					};
					$("#infocolumn-thumb-icon").text(icons[selection.type] || icons.file).css("display", "");
				}

				infoObj = {
					name: selection.name,
					type: selection.type + (selection.format ? (" (" + selection.format.toUpperCase() + ")") : ""),
					geotag: selection.geotag ? selection.geotag.getString() : "None",
					size: selection.length ? displaySize(selection.length) : null,
					fcount: selection.file_count || null
				};
			} else if (selection.constructor == Album) {
				$("#infocolumn-thumb-icon").text("folder").css("display", "");

				infoObj = {
					name: selection.name,
					type: "album",
					geotag: null,
					size: null,
					fcount: selection.file_count
				};
			} else if (selection.constructor == Person) {
				if (selection.thumbnail) {
					let thumb = Face.getById(selection.thumbnail);
					if (thumb && "data" in thumb && thumb.data[0]) $("#infocolumn-thumb").attr("src", thumb.data[0]).css("display", "");
					else $("#infocolumn-thumb").attr("src", serverUrl + "api/images/faces/" + selection.thumbnail + "/").css("display", "");
				} else {
					$("#infocolumn-thumb-icon").text("face").css("display", "");
				}

				infoObj = {
					name: selection.full_name,
					type: "person",
					geotag: null,
					size: null,
					fcount: selection.face_count
				};
			}

			for (var attr in infoObj) {
				if (infoObj[attr] === null) $("#infocolumn-info-" + attr).parent().css("display", "none");
				else {
					$("#infocolumn-info-" + attr).html(infoObj[attr]).parent().css("display", "");
				}
			}
		}

		/* $(this).find("#infocolumn-info").html("");

		$("#infocolumn-thumbdiv").removeClass("infocolumn-thumb-folder").removeClass("infocolumn-thumb-multiple");

		//TODO change display format of stuff (make it like a table), but not priority

		if (type == 0 || (type == 1 && sel.fType == "folder")) {
			$("#infocolumn-thumbdiv").addClass("infocolumn-thumb-folder");
			$("#infocolumn-name").html(sel.name);

			this.addInfo("Path", sel.fullPath + "/", true);
			this.addInfo("Files", sel.fileCount);

			if (sel.rootStarred) $("#infocolumn-star").css("opacity", 1);
			else if (sel.starred) $("#infocolumn-star").css("opacity", 0.6);
			else $("#infocolumn-star").css("opacity", 0);

			if (sel.deleted) $("#infocolumn-bin").css("opacity", 1);
			else $("#infocolumn-bin").css("opacity", 0);

			if (sel.kept) $("#infocolumn-tick").css("opacity", 1);
			else $("#infocolumn-tick").css("opacity", 0);
		} else if (type == 1) {
			if ($("#fBox" + selection[0]).find(".imgthumb").length > 0) {
				$("#infocolumn-thumb").attr("src", getBase64Image($("#fBox" + selection[0]).find(".imgthumb").get(0)));
			} else {
				$("#infocolumn-thumb").attr("src", serverUrl + "api/image?path=" + urlEncode(sel.fullPath) + "&size=180x120");
			}

			$("#infocolumn-name").html(sel.name);
			this.addInfo("Path", sel.path, true);
			this.addInfo("Date", InfoColumn.displayDate(sel.timestamp));
			this.addInfo("Size", InfoColumn.displaySize(sel.length));

			this.addInfo("Tags", sel.tags.join() || "None");
			this.addInfo("Albums", sel.albums.join() || "None");
			this.addInfo("Comments", sel.comments.join() || "None");
			if (sel.geotag) {
				this.addInfo("Geotag", sel.geotag.title + "<br /><i style='font-size: 12px; white-space: pre;'>    " + sel.geotag.address.replace(/\n/g, "\n    ") + "</i><br /><i style='font-size: 14px; margin-left: 5px;'>Co-ords: " + Math.round(sel.geotag.lat * 100) / 100 + ", " + Math.round(sel.geotag.lng * 100) / 100 + "</i>");
			} else this.addInfo("Geotag", "None");

			if (sel.rootStarred) $("#infocolumn-star").css("opacity", 1);
			else if (sel.starred) $("#infocolumn-star").css("opacity", 0.6);
			else $("#infocolumn-star").css("opacity", 0);

			if (sel.deleted) $("#infocolumn-bin").css("opacity", 1);
			else $("#infocolumn-bin").css("opacity", 0);

			if (sel.kept) $("#infocolumn-tick").css("opacity", 1);
			else $("#infocolumn-tick").css("opacity", 0);
		} else {
			let sFiles = sel.map(i => allFiles[i + maxFiles * (page - 1)]);

			$("#infocolumn-thumbdiv").addClass("infocolumn-thumb-multiple");

			if (sFiles.every(f => f.starred)) $("#infocolumn-star").css("opacity", 1);
			else if (sFiles.some(f => f.starred)) $("#infocolumn-star").css("opacity", 0.5);
			else $("#infocolumn-star").css("opacity", 0);

			if (sFiles.every(f => f.deleted)) $("#infocolumn-bin").css("opacity", 1);
			else if (sFiles.some(f => f.deleted)) $("#infocolumn-bin").css("opacity", 0.5);
			else $("#infocolumn-bin").css("opacity", 0);

			let nameStr = "";
			if (sFiles.length <= 3) nameStr = sFiles.map(f => f.name).join(", ");
			else nameStr = sFiles[0].name + ", " + sFiles[1].name + " + " + (sFiles.length - 2) + " more";
			$("#infocolumn-name").html(nameStr);

			this.addInfo("Path", sFiles[0].path, true);

			let minTime = sFiles.reduce((minT, f) => Math.min(minT, f.timestamp), Infinity);
			let maxTime = sFiles.reduce((maxT, f) => Math.max(maxT, f.timestamp), 0);
			this.addInfo("Dates", InfoColumn.displayDate(minTime) + " - " + InfoColumn.displayDate(maxTime));

			this.addInfo("Files", sFiles.length + "/" + allFiles.length + " selected");

			let totalSize = sFiles.reduce((total, f) => total + (f.length || 0), 0);
			this.addInfo("Size", InfoColumn.displaySize(totalSize));
		} */
	}

	onshow () {
		this.setInfo(pageLoader.filesContainer.selection);
	}

	//Add a detail to the info column TOREM infocol/addInfo
	addInfo (title, text, ellipsis) {
		$("<h4></h4>").html(title + ":").appendTo($(this).find("#infocolumn-info"));
		let value = $("<div></div>").html(" " + text).addClass("infocolumn-value").appendTo($(this).find("#infocolumn-info"));
		$("<br />").appendTo($(this).find("#infocolumn-info"));

		if (ellipsis) value.addClass("icellipsis");
	}
}

window.customElements.define("info-column", InfoColumn);

//Display a date from a PHP timestamp TOREM infocol/displaydate
InfoColumn.displayDate = function (timestamp) {
	date = new Date(timestamp * 1000);
	dateText = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
	timeText = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
	return dateText + " " + timeText;
};
