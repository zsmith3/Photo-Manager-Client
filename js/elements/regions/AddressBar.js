//Address bar class
class AddressBar extends HTMLElement {
	constructor () {
		super();

		this.backUrls = [];
		this.forwardUrls = [];
	}

	//Refresh address bar elements
	refresh () {
		this.refreshArrows();
		this.refreshAddress();
		mdcSetupRipples(this);
	}

	// Hide search bar on window smaller
	hideSearch () {
		$("#search .mdc-text-field").addClass("mdc-text-field--with-leading-icon");

		$("#search .mdc-text-field__icon-after").get(0).onclick = function () {
			$(this).css({"width": "32px", "height": "32px", "font-size": "24px"});
			mdcSetupRipples(this);
			if ($("#searchinput").width() > 0) {
				refreshGetData(addGet({"search": $("#searchinput").val()}));
			} else {
				$("#search").css("transition", "width .4s").css({"width": "calc(100vw - 16px)", "padding": "2px"});
				$("#search .mdc-text-field__input, #search .mdc-text-field__icon-before").css("transition", "opacity .4s").css("opacity", 1);
				$("#searchinput").focus();
			}
		};

		$("#search .mdc-text-field__icon-before").get(0).onclick = function () {
			$("#search .mdc-text-field__icon-after").css({"width": "", "height": "", "font-size": ""});
			mdcSetupRipples($("#search .mdc-text-field__icon-after").get(0));
			$("#search").css("transition", "width .1s").css({"width": "0px", "padding": 0});
			$("#search .mdc-text-field__input, #search .mdc-text-field__icon-before").css("transition", "opacity .05s").css("opacity", 0);
		};
	}

	// Show search bar on window larger
	showSearch () {
		$("#search").removeClass(".mdc-text-field--with-leading-icon");
		$("#search .mdc-text-field__icon-after").get(0).onclick = null;
		$("#search .mdc-text-field__icon-before").get(0).onclick = null;
	}

	// Refresh stored history upon following link
	refreshUrls (type) {
		let currentUrl = getCurrentAddress() + getCurrentQuery();
		if (type == "back") {
			this.backUrls.pop();
			this.forwardUrls.push(currentUrl);
		} else if (type == "forward") {
			this.backUrls.push(currentUrl);
			this.forwardUrls.pop();
		} else if (type != "initial") {
			this.backUrls.push(currentUrl);
			this.forwardUrls = [];
		}
	}

	// Refresh navigation arrows
	refreshArrows () {
		if (this.backUrls.length) {
			$("#addressBar-arrow-left")
				.attr("href", this.backUrls[this.backUrls.length - 1])
				.removeClass("mdc-icon-toggle--disabled");
		} else $("#addressBar-arrow-left").addClass("mdc-icon-toggle--disabled");

		if (this.forwardUrls.length) {
			$("#addressBar-arrow-right")
				.attr("href", this.forwardUrls[this.forwardUrls.length - 1])
				.removeClass("mdc-icon-toggle--disabled");
		} else $("#addressBar-arrow-right").addClass("mdc-icon-toggle--disabled");

		//let toAdd = folderType.indexOf("file") != -1 ? [] : (folderType.indexOf("album") != -1 ? {"album": album.fullPath} : {"folder": folder.path});
		//let toDel = ["search", "file"];

		/* if (person !== null) {
			toAdd = {};
			toDel = ["search", "file", "person"];
		} */

		//$("#arrow-up-link").attr("href", addGet(toAdd, toDel));
		let titleArray = pageLoader.data.address.split("/").filter(function (entry) { return entry.trim() != ""; });
		$("#addressBar-arrow-up").attr("href", "/" + [pageLoader.data.folderType, titleArray.slice(0, titleArray.length - 1).join("/"), getCurrentQuery()].filter(function (entry) { return entry.trim() != ""; }).join("/"));
	}

	// Refresh folder address
	refreshAddress () {
		let addressPara = $("#addressBar-address");
		addressPara.text("/");

		let titleArray = pageLoader.data.address.split("/").filter(function (entry) { return entry.trim() != ""; });

		for (var i in titleArray) {
			let pathItem = titleArray[i];

			let newItem;
			if (i < titleArray.length - 1) {
				newItem = $("<a class='link'></a>")
					.attr("href", "/" + [pageLoader.data.folderType, titleArray.slice(0, parseInt(i) + 1).join("/"), getCurrentQuery()].join("/"))
					.attr("title", pathItem);
			} else {
				newItem = $("<span></span>")
					.attr("title", pathItem + " (current page)");
			}

			newItem.text(pathItem);

			newItem.appendTo(addressPara);
			addressPara.append("/");
		}

		/* if (folderView == "faces" && person !== null) {
			$("<span> - " + folderPeople[person].name +"</span>").appendTo(addressPara);
		} */
	}
}

window.customElements.define("address-bar", AddressBar);
