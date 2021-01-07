import { Theme, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import { Location } from "history";
import React, { Fragment } from "react";
import { Database } from "../../controllers/Database";
import { trimStr } from "../../utils";
import { addressRootTypes } from "../App";
import { LocationManager } from "../utils";
import AddressBar, { addressBarHeight } from "./AddressBar";
import AppBar from "./AppBar";
import MainView from "./MainView";
import NavDrawer, { navDrawerWidth } from "./NavDrawer";

/** The Main (file browser) page */
class MainPage extends React.Component<{ classes: { rightOfNavDrawer: string; toolbar: string; mainContent: string }; width: Breakpoint; location: Location<any> }> {
	static styles = (theme: Theme) => ({
		rightOfNavDrawer: {
			[theme.breakpoints.up("md")]: {
				marginLeft: navDrawerWidth
			}
		},
		toolbar: theme.mixins.toolbar,
		mainContent: {
			overflowX: "hidden" as "hidden"
		}
	});

	onResize = () => this.forceUpdate();

	componentDidMount() {
		window.addEventListener("resize", this.onResize);
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.onResize);
	}

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
		let addressPage = parseInt(LocationManager.currentQuery.get("page")) || 1;
		let addressPageSize = parseInt(LocationManager.currentQuery.get("page_size")) || Database.auth.getConfig("page_size", isWidthUp("md", this.props.width));

		// Sizing
		let toolbarHeight: number;
		if (isWidthUp("md", this.props.width)) toolbarHeight = 64;
		else if (window.innerWidth > window.innerHeight) toolbarHeight = 48;
		else toolbarHeight = 56;
		let mainViewHeight = window.innerHeight - toolbarHeight - addressBarHeight;
		let mainViewWidth = window.innerWidth - (isWidthUp("md", this.props.width) ? navDrawerWidth : 0);

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

						{/* Address bar (with navigation and searching) */}
						<AddressBar rootType={addressRootType} rootId={addressRootId} />

						{/* Main content of the page */}
						<MainView
							rootType={addressRootType}
							rootId={addressRootId}
							page={addressPage}
							pageSize={addressPageSize}
							searchQuery={LocationManager.currentQuery.get("search")}
							includeSubfolders={["true", "1"].includes(LocationManager.currentQuery.get("isf"))}
							totalWidth={mainViewWidth}
							totalHeight={mainViewHeight}
						/>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default withWidth()(withStyles(MainPage.styles)(MainPage));
