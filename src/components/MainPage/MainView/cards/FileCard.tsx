import { CardContent, Icon, Typography, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { FileImgSizes } from "../../../../controllers/Platform";
import { FileObject } from "../../../../models";
import { FileTypes } from "../../../../models/FileObject";
import { ImageLoader } from "../../../utils";
import BaseGridCard, { GridCardExport, GridCardProps } from "./BaseGridCard";

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
	};

	/** Icons to display for non-image file types */
	static fileTypeIcons = new Map<FileTypes, string>([["file", "insert_drive_file"], ["image", "photo"], ["video", "movie"]]);

	state = {
		model: null as FileObject,
		imageData: ""
	};

	constructor(props: GridCardProps & { classes: any }) {
		super(props);

		let file = FileObject.getById(props.modelId);
		this.state.model = file;
		file.registerInstanceUpdateHandler((file: FileObject) => this.setStateSafe({ model: file }));
	}

	protected getSize() {
		return meta.getDesiredSize(this.props.scale);
	}

	render() {
		return this.renderBase(
			<Fragment>
				{this.state.model.type === "image" ? (
					/* Thumbnail for image files */
					<ImageLoader
						model={this.state.model}
						maxSize={FileImgSizes.Small}
						className={this.props.classes.img}
						style={{
							width: this.props.scale,
							height: (this.props.scale * 2) / 3
						}}
					/>
				) : (
					/* File type icon for other types */
					<Icon
						style={{
							width: this.props.scale,
							fontSize: (this.props.scale * 2) / 3,
							lineHeight: (this.props.scale * 2) / 3 + "px",
							textAlign: "center"
						}}
					>
						{FileCard.fileTypeIcons.get(this.state.model.type)}
					</Icon>
				)}
				{/* File name */}
				<CardContent className={this.props.classes.content} style={{ height: this.props.scale / 3 }}>
					<Typography variant="body2" align="center">
						{this.state.model.name}
					</Typography>
				</CardContent>
			</Fragment>
		);
	}
}

const meta: GridCardExport = {
	component: withStyles(FileCard.styles)(FileCard),
	modelType: "file",
	getDesiredSize(scale: number) {
		return { width: scale, height: scale };
	},
	scaleConfig: { max: 300, min: 50, default: 150 }
};
export default meta;
