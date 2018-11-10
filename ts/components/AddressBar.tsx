import React from "react";
import $ from "jquery";
import { TextField, IconButton, Icon, withStyles, Theme } from "@material-ui/core"
import { CSSProperties } from "@material-ui/core/styles/withStyles";
import App from "./App";
import { Platform } from "../controllers/Platform";


interface AddressBarStyles {
	addressBar,
	address
}


/** Address bar element */
class AddressBar extends React.Component<{ classes: AddressBarStyles }> {
	static styles: ((theme: Theme) => AddressBarStyles) = (theme: Theme) => ({
		addressBar: {
			backgroundColor: theme.palette.background.paper
		},
		address: {
			display: "inline"
		}
	});


	backUrls: string[]
	forwardUrls: string[]


	/** Refresh all address bar elements */
	refresh (): void {
		this.refreshArrows();
		this.refreshAddress();
		// mdcSetupRipples(this);
	}

	render () {
		return <div className={this.props.classes.addressBar}>
			<span id="addressBar-nav-icons">
				<a id="addressBar-arrow-left" title="Back" data-rel="back"><IconButton><Icon>arrow_back</Icon></IconButton></a>

				<a id="addressBar-arrow-right" title="Forward" data-rel="forward"><IconButton><Icon>arrow_forward</Icon></IconButton></a>

				<a id="addressBar-arrow-up" title="Up"><IconButton><Icon>arrow_upward</Icon></IconButton></a>

				<a href="/" title="Return to root folders"><IconButton><Icon>home</Icon></IconButton></a>
			</span>

			<span id="addressBar-address-box"> {/*  className="mdc-chip" */}
				<p className={this.props.classes.address}>/</p>
			</span>
			<span id="search" onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {if (event.key == 'Enter') App.app.refreshFilesData(null, null, {"search": $(event.currentTarget).find('#searchinput').val().toString() })}}>
				<TextField id="searchinput" label="Search" title="Search the current view for files" onSubmit={() => App.app.refreshFilesData(null, null, {"search": $(event.currentTarget).val().toString() })}></TextField>
			</span>
		</div>;
		//<MDCText id="searchinput" placeholder="Search" data-icon-after="search" data-icon-before="arrow_back" title="Search the current view for files" onsubmit="App.app.refreshFilesData(null, null, {'search': $(this).val()});"></MDCText>
	}

	/** Hide search bar (for mobile) */
	hideSearch (): void {
		$("#search .mdc-text-field").addClass("mdc-text-field--with-leading-icon");

		$("#search .mdc-text-field__icon-after").get(0).onclick = () => {
			$(this).css({"width": "32px", "height": "32px", "font-size": "24px"});
			// mdcSetupRipples(this);
			if ($("#searchinput").width() > 0) {
				// refreshGetData(addGet({"search": $("#searchinput").val()}));
				// TODO
			} else {
				$("#search").css("transition", "width .4s").css({"width": "calc(100vw - 16px)", "padding": "2px"});
				$("#search .mdc-text-field__input, #search .mdc-text-field__icon-before").css("transition", "opacity .4s").css("opacity", 1);
				$("#searchinput").focus();
			}
		};

		$("#search .mdc-text-field__icon-before").get(0).onclick = () => {
			$("#search .mdc-text-field__icon-after").css({"width": "", "height": "", "font-size": ""});
			// mdcSetupRipples($("#search .mdc-text-field__icon-after").get(0));
			$("#search").css("transition", "width .1s").css({"width": "0px", "padding": 0});
			$("#search .mdc-text-field__input, #search .mdc-text-field__icon-before").css("transition", "opacity .05s").css("opacity", 0);
		};
	}

	/** Show search bar (for desktop) */
	showSearch (): void {
		$("#search").removeClass(".mdc-text-field--with-leading-icon");
		$("#search .mdc-text-field__icon-after").get(0).onclick = null;
		$("#search .mdc-text-field__icon-before").get(0).onclick = null;
	}

	/** Refresh stored history (for forward/back arrows) upon following link */
	refreshUrls (type: ("back" | "forward" | "initial")): void {
		let currentUrl = Platform.urls.getCurrentAddress() + Platform.urls.getCurrentQuery();
		switch (type) {
		case "back":
			this.backUrls.pop();
			this.forwardUrls.push(currentUrl);
			break
		case "forward":
			this.backUrls.push(currentUrl);
			this.forwardUrls.pop();
			break
		case "initial":
			this.backUrls.push(currentUrl);
			this.forwardUrls = [];
			break
		}
	}

	/** Refresh navigation (back, forward, up) arrows */
	refreshArrows (): void {
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

		let titleArray = App.app.data.address.split("/").filter((entry) => entry.trim() != "");
		$("#addressBar-arrow-up").attr("href", "/" + [App.app.data.folderType, titleArray.slice(0, titleArray.length - 1).join("/"), Platform.urls.getCurrentQuery()].filter((entry) => entry.trim() != "").join("/"));
	}

	/** Refresh folder address */
	refreshAddress () {
		let addressPara = $("#addressBar-address");
		addressPara.text("/");

		let titleArray = App.app.data.address.split("/").filter((entry) => entry.trim() != "");

		for (let i = 0; i < titleArray.length; i++) {
			let pathItem = titleArray[i];

			let newItem;
			if (i < titleArray.length - 1) {
				newItem = $("<a class='link'></a>")
					.attr("href", "/" + [App.app.data.folderType, titleArray.slice(0, i + 1).join("/"), Platform.urls.getCurrentQuery()].join("/"))
					.attr("title", pathItem);
			} else {
				newItem = $("<span></span>")
					.attr("title", pathItem + " (current page)");
			}

			newItem.text(pathItem);

			newItem.appendTo(addressPara);
			addressPara.append("/");
		}
	}
}

export default withStyles(AddressBar.styles)(AddressBar);
