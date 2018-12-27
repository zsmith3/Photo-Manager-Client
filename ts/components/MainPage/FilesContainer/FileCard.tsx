import { CardContent, Typography, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { FileObject } from "../../../models";
import { mediaRequest } from "../../../utils";
import BaseGridCard, { GridCardProps } from "./BaseGridCard";

/** GridCard for File model */
class FileCard extends BaseGridCard<FileObject, { img: string }> {
	static styles = {
		...BaseGridCard.styles,
		content: {
			padding: 0
		},
		img: {
			objectFit: "contain" as "contain"
		}
	}

	state = {
		model: null as FileObject,
		data: ""
	}

	constructor (props: GridCardProps & { classes: any }) {
		super(props);

		FileObject.getById(props.modelId).registerInstanceUpdateHandler((file: FileObject) => this.setStateSafe({ model: file }));
		this.state.model = FileObject.getById(props.modelId);
	}

	protected getSize () { return { width: this.props.scale, height: this.props.scale }; }

	render () {
		if (this.state.model.type === "image" && !this.state.data) mediaRequest("api/images/" + this.state.model.id + "/300x200/").then(data => this.setStateSafe({ data: data }));

		return this.renderBase(
			<Fragment>
				<img src={ this.state.data } title={ this.state.model.name } className={ this.props.classes.img } style={ { width: this.props.scale, height: this.props.scale * 2 / 3 } } />
				<CardContent className={ this.props.classes.content } style={ { height: this.props.scale / 3 } }>
					<Typography variant="body2" align="center">{ this.state.model.name }</Typography>
				</CardContent>
			</Fragment>
		);
	}
}

export default withStyles(FileCard.styles)(FileCard);
