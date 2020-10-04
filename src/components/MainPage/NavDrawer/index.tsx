import { Divider, Drawer, ListItem, ListItemText, Theme, withStyles } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import withWidth, { isWidthDown, isWidthUp } from "@material-ui/core/withWidth";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { LocationManager } from "../../utils";
import AlbumList from "./AlbumList";
import FolderList from "./FolderList";
import PersonGroupList from "./PersonGroupList";

interface NavDrawerStyles {
	toolbar;
	drawer;
	listsContainer;
}

// Navigation drawer class
class NavDrawer extends React.Component<{ classes: NavDrawerStyles; width: Breakpoint }> {
	static drawerWidth = 240;
	static marginTop = 113;

	static styles: (theme: Theme) => NavDrawerStyles = (theme: Theme) => ({
		toolbar: theme.mixins.toolbar,
		drawer: {
			width: NavDrawer.drawerWidth,
			maxHeight: "100vh",
			overflowY: "auto"
		},
		listsContainer: {
			height: "calc(100vh - " + NavDrawer.marginTop + "px)"
		}
	});

	state = {
		mobileOpen: false
	};

	constructor(props) {
		super(props);

		navDrawerInstance = this;
	}

	componentDidMount() {
		this.componentWillUnmount = LocationManager.instance.props.history.listen(loc => isWidthDown("sm", this.props.width) && this.setState({ mobileOpen: false }));
	}

	render() {
		const drawer = (
			<div className={this.props.classes.drawer} tabIndex={0} role="button" onKeyDown={() => this.state.mobileOpen && this.setState({ mobileOpen: false })}>
				<div className={this.props.classes.toolbar} />

				<Divider />

				<ListItem button component={Link} to={LocationManager.getUpdatedLocation(`/scans/`, ["page"])}>
					<ListItemText primary="Scanned Photos" />
				</ListItem>

				<div className={this.props.classes.listsContainer}>
					<Divider />

					<FolderList height="calc(33.3333% - 1px)" />

					<Divider />

					<AlbumList height="calc(33.3333% - 1px)" />

					<Divider />

					<PersonGroupList height="calc(33.3333% - 1px)" />
				</div>
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
