//Info popup class
class InfoPopup extends HTMLElement {
	//Setup popup when hover starts
	setup (item, event) {
		if (app.config.platform == "mobile") return;

		this.item = item;
		Input.xPos = event.clientX;
		Input.yPos = event.clientY;

		let parent = this;
		setTimeout(function () { parent.display(); }, 1000);
	}

	//Show popup after delay
	display () {
		let rect = this.item.getBoundingClientRect();

		if (!(Input.yPos <= rect.top || Input.yPos >= rect.bottom || Input.xPos <= rect.left || Input.xPos >= rect.right)) {
			$(this).css({
				"transform": "scale(1)",
				"left": (Input.xPos + document.body.scrollLeft + 15) + "px",
				"top": (Input.yPos + document.body.scrollTop + 100) + "px"
			});

			/* var starred, deleted, kept, tags, comments, albums;

			if (this.item.file.rootStarred) starred = "Starred<br />";
			else if (this.item.file.starred) starred = "Starred by: " + this.item.file.starredList.join() + "<br />";
			else starred = "";

			if (this.item.file.deletedList.length > 0) deleted = "Marked for deletion by: " + this.item.file.deletedList.join() + "<br />";
			else deleted = "";
			if (this.item.file.keptList.length > 0) kept = "Marked for keeping by: " + this.item.file.keptList.join() + "<br />";
			else kept = "";

			if (this.item.file.tags.length > 0) tags = this.item.file.tags.join();
			else tags = "None";
			if (this.item.file.comments.length > 0) comments = this.item.file.comments.join();
			else comments = "None";
			if (this.item.file.albums.length > 0) albums = this.item.file.albums.join();
			else albums = "None";

			this.innerHTML = "Name: " + this.item.file.name + "<br />"
				+ starred + deleted + kept
				+ "Tags: " + tags + "<br />"
				+ "Comment(s): " + comments + "<br />"
				+ "Albums: " + albums; */

			if (this.item.constructor == Facebox) {
				this.innerHTML  = "Person: " + this.item.face.person.full_name;
			} else {
				this.innerHTML  = "Name: " + this.item.file.name;
			}
		}
	}

	//Hide popup
	hide (div, event) {
		if (app.config && app.config.platform == "mobile" || $(this).css("transform") == "matrix(0, 0, 0, 0, 0, 0)") return;

		Input.xPos = event.clientX;
		Input.yPos = event.clientY;

		if (div.id == "files") {
			let rect = div.getBoundingClientRect();
			if (Input.yPos <= rect.top || Input.yPos >= rect.bottom || Input.xPos <= rect.left || Input.xPos >= rect.right) {
				setTimeout(function() { $(this).css("transform", "scale(0)"); }, 1001);
			}
		} else {
			let rect = this.item.getBoundingClientRect();
			if (Input.yPos <= rect.top || Input.yPos >= rect.bottom || Input.xPos <= rect.left || Input.xPos >= rect.right) $(this).css("transform", "scale(0)");
		}
	}
}

window.customElements.define("info-popup", InfoPopup);
