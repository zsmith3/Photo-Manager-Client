import { CardContent, Grid, Icon, Typography, withStyles, withWidth, Theme } from "@material-ui/core";
import React from "react";
import { Folder } from "../../../models";
import BaseGridCard, { GridCardProps } from "./BaseGridCard";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp, isWidthDown } from "@material-ui/core/withWidth";
import { navDrawerWidth } from "../NavDrawer";

/** GridCard for Folder model */
class FolderCard extends BaseGridCard<Folder, { icon: string, smallIcon: string, largeIcon: string, title: string }, { width: Breakpoint }> {
	static styles = (theme: Theme) => ({
		...BaseGridCard.styles,
		content: {
			[theme.breakpoints.up("md")]: {
				padding: 12
			},
			[theme.breakpoints.down("sm")]: {
				padding: 6
			}
		},
		icon: {
			width: "100%",
			height: "100%",
			textAlign: "center" as "center"
		},
		smallIcon: {
			fontSize: 16,
			lineHeight: "46px"
		},
		largeIcon: {
			fontSize: 32,
			lineHeight: "42px"
		},
		title: {
			height: 30,
			overflow: "hidden"
		}
	})

	constructor (props: GridCardProps & { width: Breakpoint, classes: any }) {
		super(props);

		Folder.getById(props.modelId).registerInstanceUpdateHandler((folder: Folder) => this.setStateSafe({ model: folder }));
		this.state.model = Folder.getById(props.modelId);
	}

	protected getSize () {
		const padding = 10;
		let margin = BaseGridCard.margin * 2;
		let desiredScale = isWidthUp("md", this.props.width) ? 200 : 150;
		let totalWidth = window.innerWidth - (isWidthUp("md", this.props.width) ? navDrawerWidth : 0) - padding;
		let count = Math.max(Math.floor(totalWidth / (desiredScale + margin)), 1);
		let actualScale = totalWidth / count - margin;
		return { width: actualScale, height: isWidthUp("md", this.props.width) ? null : 60 };
	}

	render () {
		let hasLongName = this.state.model.name.length > 16;

		return this.renderBase(
			<CardContent className={ this.props.classes.content }>
				<Grid container spacing={ 8 }>
					<Grid item xs={ (hasLongName && isWidthDown("sm", this.props.width)) ? 2 : 4 }>
						<Icon color="action" className={ this.props.classes.icon + " " + ((hasLongName && isWidthDown("sm", this.props.width)) ? this.props.classes.smallIcon : this.props.classes.largeIcon) }>folder</Icon>
					</Grid>

					<Grid item xs={ 8 }>
						<Typography variant={ hasLongName ? "body2" : "subtitle1" } className={ this.props.classes.title } style={ { lineHeight: hasLongName ? 1.1 : "36px" } }>{ this.state.model.name }</Typography>
						<Typography variant="caption" color="textSecondary">{ this.state.model.file_count } files</Typography>
					</Grid>
				</Grid>
			</CardContent>
		);
	}
}

export default withWidth()(withStyles(FolderCard.styles)(FolderCard));
