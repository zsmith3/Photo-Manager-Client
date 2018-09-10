//Custom checkbox element class
class MDCCheckbox extends HTMLElement {
	connectedCallback () {
		$(this).html($("#template-mdc-checkbox").html().trim());
		this.api = new mdc.checkbox.MDCCheckbox($(this).find(".mdc-checkbox").get(0));

		$(this).find(".mdc-checkbox__native-control").attr("id", this.id + "_inp");
		$(this).find("label")
			.text($(this).attr("label"))
			.attr("for", this.id + "_inp")
			.css("cursor", "pointer");
	}

	//Checkbox element methods
	getBoundingClientRect () { return $(this).find(".mdc-checkbox__background").get(0).getBoundingClientRect(); }

	//Thumbscale size-setting
	setSize (newSize) {
		let newPadding = (11 / 18 * newSize);

		$(this).find(".mdc-checkbox").css({
			"width": newSize + "px",
			"padding": (11 / 18 * newSize) + "px",
		});

		let rippleProps = {
			"--mdc-ripple-fg-size": (newSize + 6) + "px",
			"--mdc-ripple-fg-scale": "1.66667",
			"--mdc-ripple-left": (newPadding - 3) + "px",
			"--mdc-ripple-top": (newPadding - 3) + "px"
		};
		for (var prop in rippleProps) $(this).find(".mdc-checkbox").get(0).style.setProperty(prop, rippleProps[prop]);

		$(this).find(".mdc-checkbox__background").css({"left": newPadding + "px", "top": newPadding + "px"});
	}

	//Checkbox API getters and setters
	get checked () { return this.api.checked; }

	set checked (value) { this.api.checked = value; }
}

window.customElements.define("mdc-checkbox", MDCCheckbox);

// Custom range input element class
class MDCSlider extends HTMLElement {
	connectedCallback () {
		if (!$(this).find(".mdc-slider").length) $($("#template-mdc-slider").html().trim()).clone().appendTo(this);

		this.resetAPI();
	}

	resetAPI () {
		if (this.api) {
			this.api.unlisten("MDCSlider:input", MDCSlider.input);
			this.api.unlisten("MDCSlider:change", MDCSlider.change);
			this.api.destroy();
		}
		this.api = mdc.slider.MDCSlider.attachTo($(this).find(".mdc-slider").get(0));

		this.min = $(this).attr("min") || 0;
		this.max = $(this).attr("max") || 100;
		this.value = $(this).attr("value") || this.api.min;

		this.api.listen("MDCSlider:input", MDCSlider.input);
		this.api.listen("MDCSlider:change", MDCSlider.change);
	}

	//Slider API getters and setters
	get value () { return this.api.value; }

	set value (value) {
		this.api.value = value;
		$(this).attr("value", value);
	}

	set min (value) {
		this.api.min = parseInt(value);
		$(this).attr("min", value);
	}

	set max (value) {
		this.api.max = parseInt(value);
		$(this).attr("max", value);
	}
}
MDCSlider.input = function () { if (this.parentElement.oninput) this.parentElement.oninput(); };
MDCSlider.change = function () { if (this.parentElement.onchange) this.parentElement.onchange(); };

window.customElements.define("mdc-slider", MDCSlider);

//Custom select element class
class MDCSelect extends HTMLElement {
	connectedCallback () {
		if (!$(this).find(".mdc-select").length) $($("#template-mdc-select").html().trim()).clone().appendTo(this);
		if (!$(this).find("mdc-text").length) $("<mdc-text></mdc-text>").appendTo(this);
		$(this).find(".mdc-select__label").text($(this).attr("label"));

		if (!$(this).find("selec").length) $("<selec></selec>").appendTo(this); //TODO this is temporary to prevent materialize from interfering

		let select = this;
		window.addEventListener("resize", function () { select.resetWidth(); });
		$(this).find(".mdc-select__surface").get(0).onclick = function () {
			if (select.opened) {
				this.onclick = null;
			} else setTimeout(function () { select.opened = true; mdcSetupRipples(select, true); }, 100);
		};
	}

	//Destroy and re-attach the MDC api
	resetAPI () {
		if (this.api) {
			this.api.unlisten("MDCSelect:change", MDCSelect.change);
			this.api.destroy();
		}
		this.api = mdc.select.MDCSelect.attachTo($(this).find(".mdc-select").get(0));

		this.resetWidth();

		mdcSetupRipples(this);

		this.api.listen("MDCSelect:change", MDCSelect.change);
	}

	// Reset the width of internal elements
	resetWidth () {
		if ($(this).attr("data-width") == "true") {
			$(this).find(".mdc-select__surface").css("width", window.getComputedStyle(this).width);
		}

		$(this).find(".mdc-text-field").css("width", $(this).find(".mdc-select__surface").get(0).style.width);
		$(this).find(".mdc-select__menu").css("width", (getStyleValue($(this).find(".mdc-select__surface").get(0).style.width) + 27) + "px");
	}

	//Initialise select with innerHTML options
	initOptions () {
		$(this).find(".mdc-list-item").remove();
		let parent = this;
		$(this).find("option").each(function () {
			parent.addOption($(this).val(), $(this).text());
			$(this).appendTo($(parent).find("selec"));
		});
		if ($(this).attr("data-new")) this.addOption("new", $(this).attr("data-new"));
		$(this).find("mdc-text").attr("label", $(this).attr("data-new"));
		$(this).find("mdc-text").attr("id", $(this).attr("id") + "_new");

		//TODO i love this idea but actually might not need it
		//	should first experiment with the mdc list dialog things

		this.resetAPI();

		this.api.disabled = $(this).attr("disabled") == "disabled";

		let selectedOptions = this.api.options.filter(option => $(option).attr("selected"));
		if (selectedOptions.length > 0) $(this).val(selectedOptions);
		else if (!$(this).attr("label")) $(this).val($(this).find("option").val());
	}

	//Remove all options
	clearOptions () {
		$(this).find(".mdc-list > .mdc-list-item").remove();
	}

	//Add an option to the select
	addOption (value, text) {
		let item = $("<li></li>")
			.addClass("mdc-list-item mdc-ripple-surface")
			.attr("id", this.id + "-" + value)
			.attr("role", "option")
			.attr("tabindex", 0)
			.text(text)
			.appendTo($(this).find(".mdc-list"));
	}

	//Select API getters and setters
	get value () { return this.api.value.substr(this.id.length + 1); }

	set value (value) {
		let done = false;
		for (var i in this.api.options) {
			if (this.api.options[i].id == this.id + "-" + value) {
				this.api.selectedIndex = i;
				done = true;
			}
		}
		$(this).find(".mdc-select__label").addClass("mdc-select__label--float-above");
		if (!done && $(this).attr("data-new")) {
			this.value = "new";
			MDCSelect.change.call($(this).find(".mdc-select").get(0));
			$(this).find("mdc-text").val(value);
		}
	}
}
MDCSelect.change = function () {
	select = this.parentElement;
	if ($(select).val() == "new") {
		$(select).find("mdc-text").css("visibility", "visible");
		$(select).find(".mdc-select__selected-text").css("display", "none");
	} else {
		$(select).find("mdc-text").css("visibility", "hidden");
		$(select).find(".mdc-select__selected-text").css("display", "");
	}
	if (select.onchange) select.onchange();
};

window.customElements.define("mdc-select", MDCSelect);

//Custom range input element class
class MDCModal extends HTMLElement {
	connectedCallback () {
		$($("#template-mdc-modal").html().trim()).clone().appendTo(this);
		this.api = mdc.dialog.MDCDialog.attachTo($(this).find(".mdc-dialog").get(0));

		if (!$(this).find("selec").length && $(this).attr("data-list")) $("<selec></selec>").appendTo(this);

		if ($(this).attr("data-list") && !$(this).find(".mdc-list").length) {
			let body = $(this).find(".mdc-dialog__body").addClass("mdc-dialog__body--scrollable");
			$("<ul></ul>").addClass("mdc-list").appendTo(body);
		}

		if ($(this).attr("data-newtype") == "item" && !$(this).find(".mdc-list-item__new").length) {
			this.addOption(-1, "", "new");
		}

		let parent = this;
		this.api.listen("MDCDialog:accept", function () {
			parent.onaccept();
		});

		this.api.listen("MDCDialog:cancel", function () {
			parent.oncancel();
		});

		this.onaccept = function () {
			eval($(this).attr("onaccept"));
		};

		this.oncancel = function () {
			eval($(this).attr("oncancel"));
		};

		this.api.foundation_.close = function () {
			$(parent).find(".mdc-dialog__surface").css("transition", "all 0.1s ease-in");
			$(parent).find(".mdc-dialog__surface").css("transform", "scale(0)");
			setTimeout(function () {
				$(parent).find(".mdc-dialog__surface").css({
					"transition": "",
					"transform": ""
				});
			}, 100);

			this.isOpen_ = false;
			this.adapter_.deregisterSurfaceInteractionHandler("click", this.dialogClickHandler_);
			this.adapter_.deregisterDocumentKeydownHandler(this.documentKeydownHandler_);
			this.adapter_.deregisterInteractionHandler("click", this.componentClickHandler_);
			this.adapter_.untrapFocusOnSurface();
			this.adapter_.registerTransitionEndHandler(this.transitionEndHandler_);
			this.adapter_.addClass(mdc.dialog.MDCDialogFoundation.cssClasses.ANIMATING);
			this.adapter_.removeClass(mdc.dialog.MDCDialogFoundation.cssClasses.OPEN);
		};
	}

	//Initialise based on innerHTML contents
	initContents () {
		$(this).find(".mdc-dialog__header__title").text($(this).attr("header"));
		if (!$(this).attr("data-list")) $(this).find(">*:not(.mdc-dialog)").appendTo($(this).find(".mdc-dialog__body"));

		if ($(this).attr("data-list")) {
			let parent = this;
			let select = $(this).find("selec");
			$(this).find("option").each(function () {
				parent.addOption($(this).val(), $(this).text());
				$(this).appendTo(select);
			});
		}

		$(this).find("mdc-select").each(function () { this.initOptions(); });
		$(this).find("mdc-slider").each(function () { this.resetAPI(); });
	}

	//Add option to list
	addOption (value, text, type, parent, indent) {
		if (!$(this).attr("data-list")) return;

		// Create new item
		let newItem = $("<li></li>")
			.addClass("mdc-list-item")
			.val(value)
			.css("padding-left", (indent + 16) + "px")
			.text(text)
			.click(function () {
				$(this).closest("mdc-modal")
					.val($(this).val())
					.get(0).refreshListHighlight();
			});

		// Insert item into list
		if ($(this).attr("data-newtype") == "item" && type != "new") newItem.insertBefore($(this).find(".mdc-list-item__new"));
		else if (type == "child") newItem.insertAfter(parent);
		else if ($(this).attr("data-newtype") == "group" && type != "group") {
			if (type == "new") newItem.appendTo(parent);
			else newItem.appendTo($(this).find(".mdc-list > .modal-list-group-body").last());
		} else newItem.appendTo($(this).find(".mdc-list"));

		if (type == "group") newItem.addClass("modal-list-group");

		// TODO adding to specific group

		// Parent-child based lists
		if ($(this).attr("data-newtype") == "child") {
			let newIcon = $("<hover-icon-button></hover-icon-button>").appendTo(newItem);

			if (type == "child") {
				$(this).find(".mdc-list-item__new").remove();
				newItem.addClass("mdc-list-item__selected");
				newItem.attr("data-parent", $(parent).val());

				$(newItem).css("padding-left", (getStyleValue($(parent).css("padding-left")) + 16) + "px");

				// Function on child to remove it
				newIcon.text("clear").click(function () {
					$(this).closest("mdc-modal").val("");
					$(this).parent().remove();
				});

				$(this).val(-1);
			} else {
				// Function on parent to add child
				newIcon.text("add").click(function () {
					$(this).closest("mdc-modal").get(0).addOption(-1, "", "child", $(this).parent());
				});
			}
		}

		// Groups
		if ($(this).attr("data-newtype") == "group") {
			if (type == "group") {
				newItem.val(-2).attr("data-id", value);

				let newIcon = $("<hover-icon-button></hover-icon-button>").appendTo(newItem);

				// Function on group to add new
				newIcon.text("add").click(function () {
					$(this).closest("mdc-modal").get(0).addOption(-1, "", "new", $(this).parent().next(), 16);
				});

				$("<div class='modal-list-group-body'></div>").insertAfter(newItem);
			} else if (type == "new") {
				$(this).find(".mdc-list-item__new").remove();
				newItem.attr("data-group", $(parent).prev().attr("data-id"));

				let newIcon = $("<hover-icon-button></hover-icon-button>").appendTo(newItem);

				// Function on child to remove it
				newIcon.text("clear").click(function () {
					$(this).closest("mdc-modal").val("");
					$(this).parent().remove();
				});
			}
		}

		// Add text input to new items
		if (type == "child" || type == "new") {
			newItem.addClass("mdc-list-item__new");

			// Text input
			$("<mdc-text label='" + $(this).attr("data-newlabel") + "'></mdc-text>")
				.on("input", function () {
					$(this).closest("mdc-modal").attr("data-newval", $(this).val());
				})
				.appendTo(newItem);

			// Add button
			$("<button></button>")
				.addClass("mdc-button mdc-button--unelevated mdc-ripple-surface mdc-theme--text-secondary-on-primary")
				.text("Add")
				.click(this.onadd)
				.appendTo(newItem);
		}

		return newItem;
	}

	//Clear all list options
	clearOptions () {
		if ($(this).attr("data-newtype") == "item") $(this).find(".mdc-list-item:not(.mdc-list-item__new)").remove();
		else $(this).find(".mdc-list-item").remove();
	}

	//Open modal
	open (anchor, keepAnchor) {
		this.toAnchor(anchor, keepAnchor);

		this.initContents();

		let parent = this;
		setTimeout(function () {
			$(parent).find(".mdc-dialog__surface").css("transform", "");
			parent.api.show();

			setTimeout(function () {
				$(parent).find("mdc-slider").each(function () { this.api.layout(); });
				$(parent).find("mdc-tabs").each(function () { this.resetAPI(); });
			}, 200);
		}, 0);
	}

	//Move the modal to an anchor element
	toAnchor (newAnchor, keepAnchor) {
		this.anchor = newAnchor || this.anchor;
		if (this.anchor) {
			let rect = this.anchor.getBoundingClientRect();
			let xTransform = rect.x - window.innerWidth / 2;
			let yTransform = rect.y - window.innerHeight / 2;

			$(this).find(".mdc-dialog__surface").css("transform", "translateX(" + xTransform + "px) translateY(" + yTransform + "px) scale(.1)");
		}

		if (keepAnchor === false) this.anchor = null;
	}

	//Refresh option highlighting for the list
	refreshListHighlight () {
		let parent = this;
		$(this).find(".mdc-list-item").each(function () {
			if ($(this).val() == $(parent).val() && $(this).val() != -2) $(this).addClass("mdc-list-item__selected");
			else $(this).removeClass("mdc-list-item__selected");
		});
	}

	//Value getter/setter
	get value () { return $(this).attr("value"); }

	set value (value) {
		$(this).attr("value", value);
		this.refreshListHighlight();
	}

	//TODO try adding an 'anchor element' as optional attribute, and make it pop out of that element
	//	^maybe make it an optional paramater in the open() method
	//TODO
	//	3) add to MDCSelect to allow for 'new' option and sorting
	//	4) the modal anchoring above
}

window.customElements.define("mdc-modal", MDCModal);

// Custom text input element class
class MDCText extends HTMLElement {
	connectedCallback () {
		if (!$(this).find(".mdc-text-field").length) $($("#template-mdc-text").html().trim()).clone().appendTo(this);

		$(this).find(".mdc-text-field__input").attr("id", this.id + "-tf").attr("placeholder", $(this).attr("placeholder")).attr("type", $(this).attr("type"));
		$(this).find(".mdc-text-field__label").attr("for", this.id + "-tf").text($(this).attr("label"));

		if ($(this).attr("data-icon-before")) {
			$(this).find(".mdc-text-field__icon-before")
				.text($(this).attr("data-icon-before"))
				.css("display", "");
		} else $(this).find(".mdc-text-field__icon-before").css("display", "none");

		if ($(this).attr("data-icon-after")) {
			$(this).find(".mdc-text-field__icon-after")
				.text($(this).attr("data-icon-after"))
				.css("display", "")
				.get(0).onclick = function (event) {
					if ($(this).closest("mdc-text").get(0).onsubmit) $(this).closest("mdc-text").get(0).onsubmit();
				};
			$(this).find(".mdc-text-field").addClass("mdc-text-field--with-trailing-icon");
		} else $(this).find(".mdc-text-field__icon-after").css("display", "none");

		this.resetAPI();
	}

	//Destroy and re-attach the MDC api
	resetAPI () {
		if (this.api) {
			this.api.unlisten("MDCTextField:input", MDCText.input);
			this.api.destroy();
		}
		this.api = mdc.textField.MDCTextField.attachTo($(this).find(".mdc-text-field").get(0));

		this.api.value = this.value || $(this).attr("value") || "";

		this.api.disabled = $(this).attr("disabled") == "disabled";

		if ($(this).attr("readonly") == "readonly") {
			$(this).find(".mdc-text-field").addClass("mdc-text-field--disabled");
		} else $(this).find(".mdc-text-field").removeClass("mdc-text-field--disabled");

		this.api.listen("MDCTextField:input", MDCText.input);

		mdcSetupRipples(this);
	}

	//MDC API getters and setters
	get value () {
		if (this.api.disabled) return null;
		else if ($(this).attr("data-type") == "number") return parseFloat(this.api.value);
		else return this.api.value;
	}

	set value (value) { this.api.value = value; }
}
MDCText.input = function () {
	this.parentElement.oninput();
};

window.customElements.define("mdc-text", MDCText);

// Custom textarea element class
class MDCTextArea extends HTMLElement {
	connectedCallback () {
		if (!$(this).find(".mdc-text-field").length) $($("#template-mdc-textarea").html().trim()).clone().appendTo(this);

		$(this).find(".mdc-text-field__input").attr("id", this.id + "-tf").attr("placeholder", $(this).attr("placeholder"));
		$(this).find(".mdc-text-field__label").attr("for", this.id + "-tf").text($(this).attr("label"));

		this.api = mdc.textField.MDCTextField.attachTo($(this).find(".mdc-text-field").get(0));
	}

	//MDC API getters and setters
	get value () { return this.api.value; }

	set value (value) { this.api.value = value; }
}

window.customElements.define("mdc-textarea", MDCTextArea);

//Custom dropdown menu class TODO fix this/make it properlly
class MDCMenu extends HTMLElement {
	connectedCallback () {
		$($("#template-mdc-menu").html().trim()).clone().appendTo(this);
	}

	//Destroy and re-attach the MDC api
	resetAPI () {
		if (this.api) this.api.destroy();
		this.api = mdc.menu.MDCMenu.attachTo($(this).find(".mdc-menu").get(0));
	}

	//Get contents from innerHTML
	initOptions () {
		let parent = this;
		$(this).find("option").each(function () {
			parent.addOption($(this).text(), this.onclick, $(this).attr("data-icon"), $(this).attr("disabled")).attr("id", this.id);
			$(this).remove();
		});
		this.resetAPI();
		mdcSetupRipples(this, true);
	}

	//Add a menu option
	addOption (text, onclick, icon, disabled) {
		var item;

		if (typeof text == "string") {
			if (icon) text = $("<i></i>").addClass("material-icons").text(icon).html() + text;

			item = $("<li></li>")
				.addClass("mdc-list-item mdc-ripple-surface")
				.attr("tabindex", "0")
				.html(text)
				.click(onclick)
				.appendTo($(this).find(".mdc-menu__items"));

			if (disabled) item.attr("aria-disabled", true).attr("tabindex", "-1");
		} else {
			let layout = text;

			item = $("<li></li>")
				.addClass("mdc-list-item mdc-ripple-surface")
				.attr("tabindex", "0")
				.attr("id", layout.id)
				.attr("href", layout.modal)
				.attr("onclick", layout.onclick)
				.attr("title", layout.title)
				.appendTo($(this).find(".mdc-menu__items"));

			if (disabled || layout.disabled) item.attr("aria-disabled", true).attr("tabindex", "-1");

			if (layout.modal) item.get(0).addEventListener("click", function () { $($(this).attr("href")).get(0).open(this, false); });

			let iconCont = $("<span></span>").addClass("mdc-menu-item-icons").appendTo(item);

			for (var i = 0; i < layout.icon.length; i++) {
				$("<i class='material-icons'></i>").text(layout.icon[i]).appendTo(iconCont);
			}

			if (layout.text) {
				$("<span></span>").text(layout.text.replace("<br />", " ")).appendTo(item);
			}
		}

		return item;
	}

	addDivider () {
		$("<hr />").addClass("mdc-list-divider").appendTo($(this).find(".mdc-menu__items"));
	}

	open () {
		this.initOptions();
		this.api.show();
	}

	refreshList () {
		let buttonList = null;
		let tbType = null;
		if (folderView == "faces" || folderType == "person" || folderType == "personroot") {
			buttonList = ToolBar.facesTBButtons;
			tbType = "faces";
		} else {
			buttonList = ToolBar.standardTBButtons;
			tbType = "standard";
		}
		if ($(this).attr("data-type") == tbType) return;

		if (this.id == "optionsList") {
			for (i in selButtons) {
				this.addOption(selButtons[i]);
			}
			$("<hr class='mdc-list-divider'>").appendTo($(this).find(".mdc-menu__items"));
		}

		for (var i = 0; i < buttonList.length; i++) {
			if (folderType != "album" && buttonList[i].id == "albumRemButton") continue;
			if (buttonList[i].top && buttonList[i].bottom) {
				this.addOption(buttonList[i].top);
				this.addOption(buttonList[i].bottom);
			} else this.addOption(buttonList[i]);
		}
		$(this).attr("data-type", tbType);
	}
}

window.customElements.define("mdc-menu", MDCMenu);

class MDCTabs extends HTMLElement {
	resetAPI () {
		if (this.api) {
			this.api.unlisten("MDCTabBar:change", MDCTabs.changeEvent);
			this.api.tabs.forEach(function (tab) { tab.destroy(); });
			this.api.destroy();
		}
		this.api = new mdc.tabs.MDCTabBar($(this).find(".mdc-tab-bar").get(0));

		if ($(this).attr("data-nochange") != "true") this.change();

		this.api.listen("MDCTabBar:change", MDCTabs.changeEvent);
	}

	change () {
		let id = this.id + "-" + $(this.api.activeTab.root_).attr("value");
		$(this).find(".mdc-tab-contents").css("display", "none");
		$(this).find("#" + id).css("display", "");

		if (this.onchange) this.onchange();
	}

	getTabName () {
		return $(this.api.activeTab.root_).attr("value");
	}

	getTab () {
		return $(this).find("#" + this.id + "-" + this.getTabName());
	}
}

MDCTabs.changeEvent = function () {
	this.parentElement.change();
};

window.customElements.define("mdc-tabs", MDCTabs);

//Collapsible class
class Collapsible extends HTMLElement {
	init () {
		var header;
		if ($(this).find(".collapsible-header").length > 0) {
			header = $(this).find(".collapsible-header");
		} else {
			header = $("<div></div>").addClass("collapsible-header").text($(this).attr("header")).prependTo(this);
		}

		if ($(this).attr("icon") == "true") $("<i></i>").addClass("material-icons collapsible-header-icon").text("keyboard_arrow_right").prependTo(header);

		let parent = this;
		header.click(function () {
			parent.toggle();
		});

		if ($(this).find(".collapsible-body").length == 0) $("<nav></nav>").addClass("collapsible-body").appendTo(this);

		if ($(this).attr("data-open") == "true") this.open();
		else this.close();
	}

	open () {
		$(this).find(".collapsible-body").css("max-height", "200vh");
		$(this).find(".collapsible-header-icon").css("transform", "rotate(90deg)");
		this.isOpen = true;
		let parent = this;
		setTimeout(function () { $(parent).find(".collapsible-body").css("transition", "max-height 0.2s ease-out"); }, 200);
	}

	close () {
		$(this).find(".collapsible-body").css("max-height", "0");
		$(this).find(".collapsible-header-icon").css("transform", "none");
		this.isOpen = false;
		let parent = this;
		setTimeout(function () { $(parent).find(".collapsible-body").css("transition", "max-height 0.2s ease-in"); }, 200);
	}

	toggle () {
		if (this.isOpen) this.close();
		else this.open();
		if (this.ontoggle) this.ontoggle();
	}
}

window.customElements.define("extension-panel", Collapsible);

//Toggled bar class (to be extended)
class ToggleBar extends HTMLElement {
	show (auto) {
		$(this).css("visibility", "visible");
		$(this).css($(this).attr("data-axis"), $(this).attr("data-size"));
		//$(this).css("padding", "");
		$("#" + this.id + "-show").addClass("toggle-on");
		if (!auto) pageLoader.config.set("show_" + this.id, true);
		this.open = true;

		if (this.onshow) this.onshow();

		setTimeout(function () {
			$("#files").css("height", "calc(100vh - " + (128 + $("#bars").height()) + "px)");
		}, 100);
	}

	hide (auto) {
		$(this).css($(this).attr("data-axis"), "0");
		//$(this).css("padding", "0");
		$("#" + this.id + "-show").removeClass("toggle-on");
		if (!auto) pageLoader.config.set("show_" + this.id, false);
		this.open = false;

		if (this.onhide) this.onhide();

		let parent = this;
		setTimeout(function () {
			$(parent).css("visibility", "hidden");
			$("#files").css("height", "calc(100vh - " + (128 + $("#bars").height()) + "px)");
		}, 100);
	}

	toggle () {
		if (this.open) {
			this.hide();
		} else {
			this.show();
		}
	}

	get open () { return $(this).attr("data-shown") == "true"; }

	set open (value) { $(this).attr("data-shown", value); }
}

// Hover icon button
class HoverIconButton extends HTMLElement {
	connectedCallback () {
		$(this).addClass("mdc-icon-toggle material-icons");

		if (!$(this).parent().attr("data-hib-events")) {
			$(this).parent().get(0).addEventListener("mouseover", function () { $(this).find("hover-icon-button").css("opacity", 1); });
			$(this).parent().get(0).addEventListener("mouseout", function () { $(this).find("hover-icon-button").css("opacity", 0); });
			$(this).parent().attr("data-hib-events", true);
		}

		/* this.onmouseover = function () {
			this.style.setProperty("--mdc-ripple-fg-scale", 1.6);
		}; */
	}
}

window.customElements.define("hover-icon-button", HoverIconButton);

// File input custom element
class FileInput extends HTMLElement {
	// TODO add one of these to cordova sync page
	// NOTE will need to add a thing to move imports into document when copying to cordova
	//	because no imports with file://
	// may need Platform-specific stuff
	connectedCallback () {
		$($("#template-mdc-file-input").html().trim()).clone().appendTo(this);

		// Add multiple and directory attributes
		$(this).find("input[type=file]").attr("multiple", $(this).attr("multiple"));
		if ($(this).attr("directory") !== undefined) {
			$(this).find("input[type=file]").attr({"webkitdirectory": true, "mozdirectory": true, "msdirectory": true, "odirectory": true, "directory": true, "multiple": true});
		}

		$(this).find(".mdc-button").text($(this).attr("label") || (($(this).attr("directory") !== undefined) ? "Select Folder" : (($(this).attr("multiple") !== undefined) ? "Select Files" : "Select File")));

		$(this).find(".mdc-button").get(0).onclick = function () {
			$(this).closest("mdc-file-input").find("input[type=file]").trigger("click");
		};

		$(this).find("input[type=file]").get(0).onchange = function () {
			if (this.files.length > 1) $(this).closest("mdc-file-input").find("mdc-text").val(this.files.length + " files");
			else if (this.files.length == 1) $(this).closest("mdc-file-input").find("mdc-text").val(this.files[0].name);
			else $(this).closest("mdc-file-input").find("mdc-text").val("No File Chosen");
		};

		mdcSetupRipples(this);
	}
}

window.customElements.define("mdc-file-input", FileInput);

// Set up MDC ripple effect for element and children
function mdcSetupRipples (element, overwrite) {
	if ($(element).hasClass("mdc-ripple-surface")) element.rippleAPI = new mdc.ripple.MDCRipple(element);
	$(element).find(".mdc-icon-toggle").each(function () { $(this).addClass("mdc-ripple-surface").attr("data-mdc-ripple-is-unbounded", true); });
	$(element).find(".mdc-ripple-surface").each(function () {
		if (!this.rippleAPI) this.rippleAPI = new mdc.ripple.MDCRipple(this);
		else if (overwrite) {
			this.rippleAPI.destroy();
			this.rippleAPI = new mdc.ripple.MDCRipple(this);
		}
	});
}

// Change MDC Ripple scale constant
mdc.ripple.MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE = 0.5;

// TODO use slots https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots






// TODO main problem is images
// on web they work through sessionid
// on mobile no sessionid so no work
// need to use JWT auth - either:
// a) use ?= query param for token
// b) load ALL images through ajax requests
// investigate options with Django/etc.
// if server-side has built in option for query param, use it
// otherwise try to load each with ajax

