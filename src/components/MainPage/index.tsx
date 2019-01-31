import { Theme, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import { Location } from "history";
import React, { Fragment } from "react";
import { trimStr } from "../../utils";
import { addressRootTypes } from "../App";
import { LocationManager } from "../utils";
import AddressBar, { addressBarHeight } from "./AddressBar";
import AppBar from "./AppBar";
import FilesContainer from "./FilesContainer";
import NavDrawer, { navDrawerWidth } from "./NavDrawer";

interface MainPageStyles {
	rightOfNavDrawer;
	toolbar;
	mainContent;
}

/** The Main (file browser) page */
class MainPage extends React.Component<{
	classes: MainPageStyles;
	width: Breakpoint;
	location: Location<any>;
}> {
	static styles: (theme: Theme) => MainPageStyles = (theme: Theme) => ({
		rightOfNavDrawer: {
			[theme.breakpoints.up("md")]: {
				marginLeft: navDrawerWidth
			}
		},
		toolbar: theme.mixins.toolbar,
		mainContent: {
			overflowX: "hidden"
		}
	});

	render() {
		// Extract data from URL
		let addressParts = trimStr(this.props.location.pathname, "/").split("/");
		let addressRootType = addressParts[0] as addressRootTypes;
		let addressRootId: number;
		if (addressParts.length > 1) {
			addressRootId = parseInt(addressParts[1]);
			if (addressRootId === NaN) {
			} // TODO
		} else addressRootId = null;

		// Sizing
		let toolbarHeight: number;
		if (isWidthUp("md", this.props.width)) toolbarHeight = 64;
		else if (window.innerWidth > window.innerHeight) toolbarHeight = 48;
		else toolbarHeight = 56;
		let fcOffsetTop = toolbarHeight + addressBarHeight;

		return (
			<Fragment>
				{/* NavDrawer (floated left) */}
				<NavDrawer />

				{/* Main body of the page */}
				<div className={this.props.classes.rightOfNavDrawer}>
					{/* AppBar (fixed top) */}
					<AppBar />

					{/* Main content of the page */}
					<div className={this.props.classes.mainContent}>
						{/* Placeholder of AppBar height */}
						<div className={this.props.classes.toolbar} />

						<AddressBar rootType={addressRootType} rootId={addressRootId} />

						<FilesContainer rootType={addressRootType} rootId={addressRootId} searchQuery={LocationManager.currentQuery.get("search")} offsetTop={fcOffsetTop} />
					</div>
				</div>
			</Fragment>
		);
	}
}

export default withWidth()(withStyles(MainPage.styles)(MainPage));
