import { CardContent, Grid, Icon, Theme, Typography, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthDown, isWidthUp } from "@material-ui/core/withWidth";
import React from "react";
import { Folder } from "../../../../models";
import BaseGridCard, { GridCardExport, GridCardProps } from "./BaseGridCard";

/** GridCard for Folder model */
class FolderCard extends BaseGridCard<Folder, { icon: string; smallIcon: string; largeIcon: string; title: string }, { width: Breakpoint }> {
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
	});

	constructor(props: GridCardProps & { width: Breakpoint; classes: any }) {
		super(props);

		this.updateHandler = Folder.getById(props.modelId).updateHandlers.register((folder: Folder) => this.setStateSafe({ model: folder }));
	}

	protected getSize() {
		return { width: this.props.scale, height: isWidthUp("md", this.props.width) ? 73 : 60 };
	}

	render() {
		let hasLongName = this.state.model.name.length > 16;

		return this.renderBase(
			<CardContent className={this.props.classes.content}>
				<Grid container spacing={8}>
					{/* Folder icon */}
					<Grid item xs={hasLongName && isWidthDown("sm", this.props.width) ? 2 : 4}>
						<Icon
							color="action"
							className={this.props.classes.icon + " " + (hasLongName && isWidthDown("sm", this.props.width) ? this.props.classes.smallIcon : this.props.classes.largeIcon)}
						>
							folder
						</Icon>
					</Grid>

					<Grid item xs={8}>
						{/* Folder name */}
						<Typography variant={hasLongName ? "body2" : "subtitle1"} className={this.props.classes.title} style={{ lineHeight: hasLongName ? 1.1 : "36px" }}>
							{this.state.model.name}
						</Typography>

						{/* File count */}
						<Typography variant="caption" color="textSecondary">
							{this.state.model.file_count} files
						</Typography>
					</Grid>
				</Grid>
			</CardContent>
		);
	}
}

const meta: GridCardExport = {
	component: withWidth()(withStyles(FolderCard.styles)(FolderCard)),
	getDesiredSize(scale: number, screenWidth: Breakpoint) {
		let lg = isWidthUp("md", screenWidth);
		return { width: lg ? 200 : 150, height: lg ? 73 : 60 };
	},
	scaleConfig: null
};
export default meta;
