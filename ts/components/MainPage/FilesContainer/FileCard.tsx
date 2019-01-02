import { CardContent, Icon, Typography, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { FileImgSizes } from "../../../controllers/Platform";
import { FileObject } from "../../../models";
import { FileTypes } from "../../../models/FileObject";
import { ImageLoader } from "../../utils";
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

	/** Icons to display for non-image file types */
	static fileTypeIcons = new Map<FileTypes, string>([
		["file", "insert_drive_file"],
		["image", "photo"],
		["video", "movie"]
	])

	state = {
		model: null as FileObject,
		imageData: ""
	}

	constructor (props: GridCardProps & { classes: any }) {
		super(props);

		FileObject.getById(props.modelId).registerInstanceUpdateHandler((file: FileObject) => this.setStateSafe({ model: file }));
		this.state.model = FileObject.getById(props.modelId);
	}

	protected getSize () { return { width: this.props.scale, height: this.props.scale }; }

	render () {
		return this.renderBase(
			<Fragment>
				{ this.state.model.type === "image" ?
				<ImageLoader model={ this.state.model } maxSize={ FileImgSizes.Small } className={ this.props.classes.img } style={ { width: this.props.scale, height: this.props.scale * 2 / 3 } } />
				:
				<Icon style={ { width: this.props.scale, fontSize: this.props.scale * 2 / 3, lineHeight: (this.props.scale * 2 / 3) + "px", textAlign: "center" } }>{ FileCard.fileTypeIcons.get(this.state.model.type) }</Icon>
				}
				<CardContent className={ this.props.classes.content } style={ { height: this.props.scale / 3 } }>
					<Typography variant="body2" align="center">{ this.state.model.name }</Typography>
				</CardContent>
			</Fragment>
		);
	}
}

export default withStyles(FileCard.styles)(FileCard);
