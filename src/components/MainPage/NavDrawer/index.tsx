import { Divider, Drawer, Hidden, Theme, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import PersonGroupList from "./PersonGroupList";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";

interface NavDrawerStyles {
	toolbar;
	drawer;
}

// Navigation drawer class
class NavDrawer extends React.Component<{ classes: NavDrawerStyles; width: Breakpoint }> {
	static drawerWidth = 240;

	static styles: (theme: Theme) => NavDrawerStyles = (theme: Theme) => ({
		toolbar: theme.mixins.toolbar,
		drawer: {
			width: NavDrawer.drawerWidth,
			maxHeight: "100vh",
			overflowY: "auto"
		}
	});

	state = {
		mobileOpen: false
	};

	constructor(props) {
		super(props);

		navDrawerInstance = this;
	}

	render() {
		const drawer = (
			<div className={this.props.classes.drawer} tabIndex={0} role="button" onKeyDown={() => this.setState({ mobileOpen: false })}>
				<div className={this.props.classes.toolbar} />

				<Divider />

				{/* <AlbumList /> */}

				<Divider />

				<PersonGroupList />
			</div>
		);

		return (
			<Fragment>
				{isWidthUp("md", this.props.width) ? (
					<Drawer variant="permanent" open>
						{drawer}
					</Drawer>
				) : (
					<Drawer variant="temporary" open={this.state.mobileOpen} onClose={() => this.setState({ mobileOpen: false })} ModalProps={{ keepMounted: true }}>
						{drawer}
					</Drawer>
				)}
			</Fragment>
		);
	}
}

export default withWidth()(withStyles(NavDrawer.styles)(NavDrawer));

export const navDrawerWidth = NavDrawer.drawerWidth;

export var navDrawerInstance: NavDrawer;
