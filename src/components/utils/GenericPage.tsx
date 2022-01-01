import { Grid, Icon, IconButton, Paper, Theme, Typography, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import React, { Fragment } from "react";
import LocationManager from "./LocationManager";

/** Generic separate page */
class GenericPage extends React.Component<{
	classes: { center: string; paper: string; mainGridItem: string; background: string; backArrow: string; };
	width: Breakpoint;
	title: string;
	introText?: string;
	showBackArrow?: boolean;
}> {
	static styles = (theme: Theme) => ({
		background: {
			[theme.breakpoints.down("xs")]: {
				backgroundColor: "white"
			},
			height: "100vh",
			overflowX: "hidden" as "hidden",
			paddingTop: "20px"
		},
		backArrow: {
			top: "10px",
			left: "10px"
		},
		center: {
			margin: "auto",
			textAlign: "center" as "center"
		},
		mainGridItem: {
			width: "600px"
		},
		paper: {
			padding: 50,
			boxSizing: "border-box" as "border-box"
		}
	});

	render() {
		const contents = (
			<Fragment>
				<Typography variant={isWidthUp("sm", this.props.width) ? "h4" : "h5"} component="h3">
					{this.props.title}
				</Typography>

				<Typography component="p">{this.props.introText}</Typography>

				{this.props.children}
			</Fragment>
		);

		return (
			<div className={this.props.classes.background}>
				{/* TODO style this */}
				{this.props.showBackArrow && <IconButton className={this.props.classes.backArrow} title="Back" onClick={() => LocationManager.instance.props.history.goBack()}>
							<Icon>arrow_back</Icon>
						</IconButton>}
				<Grid container spacing={3}>
					<Grid item xs={12} className={this.props.classes.center}>
						<Typography variant={isWidthUp("sm", this.props.width) ? "h3" : "h4"} component="h1">
							Photo Manager/Fileserver
						</Typography>
					</Grid>
					<Grid item className={this.props.classes.center + " " + this.props.classes.mainGridItem}>
						{isWidthUp("sm", this.props.width) ? (
							<Paper elevation={4} className={this.props.classes.paper}>
								{contents}
							</Paper>
						) : (
							contents
						)}
					</Grid>
				</Grid>
			</div>
		);
	}
}

export default withWidth()(withStyles(GenericPage.styles)(GenericPage));
