import { Divider, Drawer, Theme, withStyles, ListItem, ListItemIcon, ListItemText, Icon, ListSubheader } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import React, { Fragment } from "react";
import AlbumList from "./AlbumList";
import PersonGroupList from "./PersonGroupList";
import { Link } from "react-router-dom";
import { LocationManager } from "../../utils";

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

				<Link to={LocationManager.getUpdatedLocation(`/scans/`, ["page"])}>
					<ListItem button>
						<ListItemText primary="Scanned Photos" />
					</ListItem>
				</Link>

				<Divider />

				<AlbumList />

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
