//Navigation drawer class
class NavigationDrawer extends HTMLElement {
	// Convert a permanent drawer to a temporary drawer
	setTemporary () {
		let aside = $("<aside></aside>").addClass("mdc-drawer mdc-drawer--temporary").insertBefore(this);
		$(this).removeClass("mdc-drawer mdc-drawer--permanent mdc-elevation--z6").addClass("mdc-drawer__drawer").appendTo(aside);
		this.api = new mdc.drawer.MDCTemporaryDrawer($(this).parent().get(0));
		this.api.listen("MDCTemporaryDrawer:open", NavigationDrawer.onOpen);
	}

	// Convert a temporary drawer to a permanent drawer
	setPermanent () {
		if (this.api) {
			this.api.unlisten("MDCTemporaryDrawer:open", NavigationDrawer.onOpen);
			this.api.destroy();
		}
		let aside = $(this).parent();
		$(this).removeClass("mdc-drawer__drawer").addClass("mdc-drawer mdc-drawer--permanent mdc-elevation--z6").insertAfter(aside);
		aside.remove();
	}

	optionsMenuToDrawer () {
		$("#optionsButton-menu").get(0).initOptions();
		let newNav = $("<nav></nav>").attr("id", "optionsButton-drawer-menu").addClass("mdc-list").appendTo(this);
		$("#optionsButton-menu .mdc-menu__items > .mdc-list-item").appendTo(newNav);
	}

	optionsMenuToHeader () {
		$("#optionsButton-drawer-menu > .mdc-list-item").appendTo("#optionsButton-menu .mdc-menu__items");
		$("#optionsButton-drawer-menu").remove();
	}

	//Refresh all lists - NOTE never used
	refresh () {
		this.refreshAlbums();
		this.refreshPeople();
		this.refreshLinks();
	}

	refreshAlbums (albums) {
		albums = albums || Album.albums;
		if (albums.length == 0) return;
		var layer = (albums[0].path.match(/\//g) || [0]).length - 1;

		var modal = $("#albumModal").get(0);

		if (layer == 0) {
			$(this).find("#albums > *:not(.nav-title)").remove();
			mdcSetupRipples($(this).find("#albums > .nav-title").get(0));
			modal.clearOptions();

			modal.onadd = function () {
				let item = $(this).parent();
				Album.create(item.attr("data-parent"), item.find("mdc-text").val()).then(function (data) {
					item.val(data.id);
					item.closest("mdc-modal").val(data.id);
					item.find("hover-icon-button").text("add").click(function () {
						$(this).closest("mdc-modal").get(0).addOption(-1, "", "child", $(this).parent());
					});
				});
			};
		}

		for (var i in albums) {
			let albumEl = $($("#template-albumsItem").html().trim()).clone();

			if (false) {//queryString.get("album") == fullPath) {
				albumEl.attr("id", "currentalbum"); // TODO
			} else {
				albumEl.find(".albumListName").attr("href", "/albums/" + albums[i].path);
			}

			albumEl.find(".albumListName")
				.text(albums[i].name + " (" + albums[i].file_count + ")")
				.css("margin-left", layer * 16)
				.attr("data-api", "albums/" + albums[i].id);


			albumEl
				.attr("data-id", albums[i].id)
				.attr("data-path", albums[i].path);

			albumEl.appendTo($(this).find("#albums"));

			mdcSetupRipples(albumEl.get(0));

			modal.addOption(albums[i].id, albums[i].name, null, null, layer * 16);

			this.refreshAlbums(albums[i].children);
		}
	}

	//Refresh people list
	refreshPeople () {
		$(this).find("#people > *:not(.nav-title)").remove();
		mdcSetupRipples($(this).find("#people > .nav-title").get(0));

		var modal = $("#modal-people-face-set").get(0);

		modal.onadd = function () {
			let item = $(this).parent();
			Person.create(item.attr("data-group"), item.find("mdc-text").val()).then(function (data) {
				item.val(data.id);
				item.closest("mdc-modal").val(data.id);
				item.find("hover-icon-button, .mdc-button").remove();
				item.find("mdc-text").replaceWith(document.createTextNode(item.find("mdc-text").val()));
			});
		};

		for (var i in PersonGroup.groups) {
			let group = PersonGroup.groups[i];

			this.addPersonGroup(group);

			modal.addOption(group.id, group.name, "group");

			for (var j in group.people) {
				let person = group.people[j];

				this.addPerson(person);
			}
		}
	}

	updateGroupPersonCount (id) {
		$("#people #pg" + id).find(".collapsible-header > .personListCount").text("(" + PersonGroup.getById(id).person_count + ")");
	}

	// Add a new PersonGroup to the display
	addPersonGroup (group) {
		let groupEl = $($("#template-peopleGroupItem").html().trim()).clone();
		groupEl.attr("id", "pg" + group.id).attr("icon", true).appendTo("#people");
		groupEl.get(0).init();
		groupEl.find(".collapsible-header").attr("data-id", group.id);
		groupEl.find(".collapsible-header > .people-group-name").text(group.name);

		groupEl.get(0).ontoggle = function () {
			$(this).find("img").each(function () {
				if (this.src == "" && $(this).attr("data-src") !== null) {
					this.src = $(this).attr("data-src");
				}
			});
		};

		mdcSetupRipples(groupEl.get(0));

		this.updateGroupPersonCount(group.id);
	}

	// Remove a PersonGroup from display
	deletePersonGroup (id) {
		let groupEl = $(this).find("#people #pg" + id);
		groupEl.find(".collapsible-body > .mdc-list-item").appendTo($(this).find("#people #pg0 > .collapsible-body"));
		groupEl.remove();
	}

	updatePersonFaceCount (id) {
		$("#people .collapsible-body > .mdc-list-item[data-id=" + id + "]").find(".personListCount").text("(" + Person.getById(id).face_count + ")");
	}

	// Add a new Person to the display
	addPerson (person) {
		let personEl = $($("#template-peopleItem").html().trim()).clone();

		personEl.attr("data-id", person.id).attr("href", "people/" + person.full_name);

		if (person.thumbnail !== null) personEl.find("img").attr("data-src", serverUrl + "api/images/faces/" + person.thumbnail +"/30/");
		else personEl.find("img").attr("data-src", null);

		personEl.find(".personListName").attr("href", "/people/" + person.full_name).attr("data-api", "/people/" + person.id).find("span").text(person.full_name);

		//if (person == i) personEl.attr("id", "currentperson");
		//else personEl.attr("id", "");

		personEl.appendTo("#people #pg" + person.group.id + " .collapsible-body");

		mdcSetupRipples(personEl.get(0));

		this.updatePersonFaceCount(person.id);

		$("#modal-people-face-set").get(0).addOption(person.id, person.full_name, "item", $("#modal-people-face-set .mdc-list-group[data-id=" + person.group.id + "]"), 16);
	}

	deletePerson (person) {
		$("#people #pg" + person.group.id).find(".collapsible-body > .mdc-list-item[data-id=" + person.id + "]").remove();
		this.updateGroupPersonCount(person.group.id);
		$("#modal-people-face-set .modal-list-group-body > .mdc-list-item[value=" + person.id + "]").remove();
	}

	refreshGeoTagAreas() {
		let select = $("#modal-geotag #modal-geotag-form-area-title").get(0);
		for (var i in GeoTagArea.areas) {
			$("<option></option>").val(GeoTagArea.areas[i].id).text(GeoTagArea.areas[i].name).appendTo(select);
		}
	}

	//Refresh links list
	refreshLinks () {
		if (true) return;

		$("#links").html("");
		for (id in shareLinks) {
			let link = shareLinks[id];
			let newLink = $($("#linksItem-template").html().trim()).clone();

			newLink.find(".linkName").attr("data-id", id);
			newLink.find(".linkName").attr("data-code", link.code);
			newLink.find(".linkName").attr("data-params", link.getvars);
			newLink.find(".linkName").attr("data-time", link.time);
			newLink.find(".linkName").text(link.name);

			newLink.find(".delLinkCheck").attr("id", "delLinkCheck" + id);
			newLink.find(".delLinkCheck").val(id);
			newLink.find(".linkDel").attr("id", "linkDel" + id);

			newLink.appendTo("#links");
		}
		if (shareLinks.length == 0) {
			$("#links").html("<br />No Links");
		}
	}
}

NavigationDrawer.onOpen = function () {
	$(this).find("mdc-slider").each(function () { let slider = this; setTimeout(function () { slider.resetAPI(); }, 200); });
};

window.customElements.define("nav-drawer", NavigationDrawer);
