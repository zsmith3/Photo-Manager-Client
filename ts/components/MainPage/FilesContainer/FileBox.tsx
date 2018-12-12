import React, { Fragment } from "react";
import { CardContent, Typography } from "@material-ui/core";
import { FileObject } from "../../../models";
import { mediaRequest } from "../../../utils";
import BaseFileBox from "./BaseFileBox";

export default class FileBox extends BaseFileBox<FileObject, { scale: number }> {
	state = {
		model: null as FileObject,
		data: ""
	}

	constructor (props: { modelId: number, selected: boolean, onSelect: (event) => void, scale: number }) {
		super(props);

		FileObject.getById(props.modelId).registerUpdateHandler((file: FileObject) => this.setStateSafe({ file: file }));
		this.state.model = FileObject.getById(props.modelId);

		this.style = {
			width: props.scale,
			height: props.scale
		};
	}

	render () {
		if (this.state.model.type === "image" && !this.state.data) mediaRequest("api/images/" + this.state.model.id + "/300x200/").then(data => this.setState({ data: data }));

		// TODO load folders

		this.style.width = this.props.scale;
		this.style.height = this.props.scale;

		return this.renderBase(
			<Fragment>
				<img src={ this.state.data } title={ this.state.model.name } style={ { width: this.props.scale, height: this.props.scale * 2 / 3, objectFit: "contain" } } />
				<CardContent style={ { height: this.props.scale / 3, padding: 0 } }>
					<Typography variant="body2" align="center">{ this.state.model.name }</Typography>
				</CardContent>
			</Fragment>
		);
	}
}
