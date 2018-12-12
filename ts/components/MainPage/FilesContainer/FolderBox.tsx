import React from "react";
import {  Typography, CardContent, Icon, Grid } from "@material-ui/core";
import { Folder } from "../../../models";
import BaseFileBox from "./BaseFileBox";

export default class FolderBox extends BaseFileBox<Folder> {
	style = {
		width: 200,
		height: null
	}

	constructor (props: { modelId: number, selected: boolean, onSelect: (event) => void }) {
		super(props);

		Folder.getById(props.modelId).registerUpdateHandler((folder: Folder) => this.setStateSafe({ model: folder }));
		this.state.model = Folder.getById(props.modelId);
	}

	render () {
		return this.renderBase(
			<CardContent style={ { padding: 12 } }>
				<Grid container spacing={ 8 }>
					<Grid item xs={ 4 }>
						<Icon color="action" style={ { width: "100%", height: "100%", fontSize: 32, lineHeight: "42px", textAlign: "center" }}>folder</Icon>
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
