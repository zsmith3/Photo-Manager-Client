import React from "react";
import AddressBar from "./AddressBar";
import NavDrawer, { navDrawerWidth } from "./NavDrawer/NavDrawer";
import AppBar from "./AppBar";
import { Theme, withStyles } from "@material-ui/core";


interface MainPageStyles {
	rightOfNavDrawer
	toolbar
}


class MainPage extends React.Component<{ classes: MainPageStyles }> {
	static styles: ((theme: Theme) => MainPageStyles) = (theme: Theme) => ({
		rightOfNavDrawer: {
			[theme.breakpoints.up("sm")]: {
				marginLeft: navDrawerWidth
			}
		},
		toolbar: theme.mixins.toolbar
	});

	render () {
		let Fragment = React.Fragment;
		return <Fragment>
				<NavDrawer />

				<div className={this.props.classes.rightOfNavDrawer}>
					<AppBar />

					<div>
						<div className={this.props.classes.toolbar} />

						<AddressBar />
					</div>
				</div>
			</Fragment>
	}
}

export default withStyles(MainPage.styles)(MainPage);
