import React from "react";
import { AppBar, Toolbar, Icon, IconButton, Typography, Hidden, withStyles } from "@material-ui/core";
import { navDrawerWidth, navDrawerInstance } from "./NavDrawer/NavDrawer";


class FSAppBar extends React.Component<{ classes: { rightOfNavDrawer: any } }> {
	static styles = theme => ({
		rightOfNavDrawer: {
			[theme.breakpoints.up("sm")]: {
				marginLeft: navDrawerWidth
			}
		}
	})

	render () {
		return <AppBar>
				<Toolbar className={this.props.classes.rightOfNavDrawer}>
					<Hidden smUp implementation="css">
						<IconButton color="inherit" aria-label="Menu" onClick={() => navDrawerInstance.setState({ mobileOpen: true })}>
							<Icon>menu</Icon>
						</IconButton>
					</Hidden>
					<Typography variant="h6" color="inherit">
						Photo Manager/Fileserver
					</Typography>
				</Toolbar>
			</AppBar>;
	}
}

export default withStyles(FSAppBar.styles)(FSAppBar);
