import { Theme, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import AddressBar from "./AddressBar";
import AppBar from "./AppBar";
import NavDrawer, { navDrawerWidth } from "./NavDrawer";
import { Location } from "history";
import { trimStr } from "../../utils";
import FilesContainer from "./FilesContainer";
import { addressRootTypes } from "../App";
import { LocationManager } from "../utils";


interface MainPageStyles {
	rightOfNavDrawer
	toolbar
	mainContent
}


class MainPage extends React.Component<{ classes: MainPageStyles, location: Location<any> }> {
	static styles: ((theme: Theme) => MainPageStyles) = (theme: Theme) => ({
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

	render () {
		let addressParts = trimStr(this.props.location.pathname, "/").split("/");

		let addressRootType = addressParts[0] as addressRootTypes;

		let addressRootId: number;
		if (addressParts.length > 1) {
			addressRootId = parseInt(addressParts[1]);
			if (addressRootId === NaN) {} // TODO
		} else addressRootId = null;

		return <Fragment>
				{/* NavDrawer (floated left) */}
				<NavDrawer />

				{/* Main body of the page */}
				<div className={ this.props.classes.rightOfNavDrawer }>
					{/* AppBar (fixed top) */}
					<AppBar />

					{/* Main content of the page */}
					<div className={ this.props.classes.mainContent }>
						{/* Placeholder of AppBar height */}
						<div className={ this.props.classes.toolbar } />

						<AddressBar rootType={ addressRootType } rootId={ addressRootId } />

						<FilesContainer rootType={ addressRootType } rootId={ addressRootId } searchQuery={ LocationManager.currentQuery.get("search") } />
					</div>
				</div>
			</Fragment>
	}
}

export default withStyles(MainPage.styles)(MainPage);
