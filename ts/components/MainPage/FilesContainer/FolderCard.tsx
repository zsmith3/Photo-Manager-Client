import { CardContent, Grid, Icon, Typography, withStyles } from "@material-ui/core";
import React from "react";
import { Folder } from "../../../models";
import BaseGridCard from "./BaseGridCard";

/** GridCard for Folder model */
class FolderCard extends BaseGridCard<Folder, { icon: string }> {
	static styles = {
		...BaseGridCard.styles,
		content: {
			padding: 12
		},
		icon: {
			width: "100%",
			height: "100%",
			fontSize: 32,
			lineHeight: "42px",
			textAlign: "center" as "center"
		}
	}

	constructor (props: { modelId: number, scale: number, selected: boolean, onSelect: (event) => void, classes: any }) {
		super(props);

		Folder.getById(props.modelId).registerInstanceUpdateHandler((folder: Folder) => this.setStateSafe({ model: folder }));
		this.state.model = Folder.getById(props.modelId);
	}

	protected getSize () { return { width: 200, height: null }; }

	render () {
		return this.renderBase(
			<CardContent className={ this.props.classes.content }>
				<Grid container spacing={ 8 }>
					<Grid item xs={ 4 }>
						<Icon color="action" className={ this.props.classes.icon }>folder</Icon>
					</Grid>

					<Grid item xs={ 8 }>
						<Typography variant="subtitle1">{ this.state.model.name }</Typography>
						<Typography variant="caption" color="textSecondary">{ this.state.model.file_count } files</Typography>
					</Grid>
				</Grid>
			</CardContent>
		);
	}
}

export default withStyles(FolderCard.styles)(FolderCard);
