import { CardContent, Typography } from "@material-ui/core";
import React from "react";
import { FileImgSizes } from "../../../../controllers/Platform";
import { Model } from "../../../../models";
import { BaseImageFile } from "../../../../models/BaseImageFile";
import { FileTypes } from "../../../../models/FileObject";
import { ImageLoader } from "../../../utils";
import BaseGridCard, { GridCardProps } from "./BaseGridCard";

/** Base GridCard for File/Scan models */
export default class BaseFileCard<T extends BaseImageFile & { open: () => any }> extends BaseGridCard<T, { img: string }> {
	/** Associated Model class (File or Scan) */
	get fileModel(): typeof BaseImageFile {
		return null;
	}

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
		model: null as T,
		imageData: ""
	};

	constructor(props: GridCardProps & { classes: any }) {
		super(props);

		this.updateHandler = this.fileModel.getById<Model>(props.modelId).updateHandlers.register((file: T) => this.setStateSafe({ model: file }));
	}

	protected getSize() {
		return getDesiredSize(this.props.scale);
	}

	/** Render thumbnail for image files */
	renderImage() {
		return (
			<ImageLoader
				model={this.state.model}
				maxSize={FileImgSizes.Small}
				className={this.props.classes.img}
				style={{
					width: this.props.scale,
					height: (this.props.scale * 2) / 3
				}}
			/>
		);
	}

	/** Render file name */
	renderName() {
		return (
			<CardContent className={this.props.classes.content} style={{ height: this.props.scale / 3 }}>
				<Typography variant="body2" align="center">
					{this.state.model.name}
				</Typography>
			</CardContent>
		);
	}
}

export function getDesiredSize(scale: number) {
	return { width: scale, height: scale };
}

export const scaleConfig = { max: 300, min: 50, default: 150 };
