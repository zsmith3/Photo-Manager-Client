import { AppBar, Hidden, Icon, IconButton, ListItemIcon, ListSubheader, Menu, MenuItem, Toolbar, Typography, withStyles } from "@material-ui/core";
import React from "react";
import { Database } from "../../controllers/Database";
import { navDrawerInstance, navDrawerWidth } from "./NavDrawer";

/** Main title AppBar */
class FSAppBar extends React.Component<{ classes: { rightOfNavDrawer: string; placeholder: string } }> {
	static styles = theme => ({
		rightOfNavDrawer: {
			[theme.breakpoints.up("md")]: {
				marginLeft: navDrawerWidth
			}
		},
		placeholder: {
			flexGrow: 1
		}
	});

	state = {
		menuAnchorEl: null as HTMLElement,
		openMenu: false
	};

	/** Close options menu */
	menuClose = () => this.setState({ openMenu: false });

	render() {
		return (
			<AppBar>
				<Toolbar className={this.props.classes.rightOfNavDrawer}>
					{/* Show/hide navbar (mobile) */}
					<Hidden mdUp implementation="css">
						<IconButton color="inherit" aria-label="Menu" onClick={() => navDrawerInstance.setState({ mobileOpen: true })}>
							<Icon>menu</Icon>
						</IconButton>
					</Hidden>

					{/* Main title */}
					<Typography variant="h6" color="inherit">
						Photo Manager/Fileserver
					</Typography>

					{/* Placeholder to push following to right */}
					<div className={this.props.classes.placeholder} />

					{/* Menu button */}
					<IconButton
						color="inherit"
						onClick={event =>
							this.setState({
								menuAnchorEl: event.currentTarget,
								openMenu: true
							})
						}
					>
						<Icon>more_vert</Icon>
					</IconButton>

					{/* Options menu */}
					<Menu
						anchorEl={this.state.menuAnchorEl}
						open={this.state.openMenu}
						onClick={this.menuClose}
						onClose={this.menuClose}
						MenuListProps={{ subheader: <ListSubheader>Options</ListSubheader> }}
					>
						<MenuItem onClick={() => window.location.reload()}>
							<ListItemIcon>
								<Icon>refresh</Icon>
							</ListItemIcon>
							Refresh
						</MenuItem>
						<MenuItem onClick={() => Database.auth.logOut()}>
							<ListItemIcon>
								<Icon>exit_to_app</Icon>
							</ListItemIcon>
							Log Out
						</MenuItem>
					</Menu>
				</Toolbar>
			</AppBar>
		);
	}
}

export default withStyles(FSAppBar.styles)(FSAppBar);
