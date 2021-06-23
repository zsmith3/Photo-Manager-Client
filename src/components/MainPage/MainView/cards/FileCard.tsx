import { Icon, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { FileObject } from "../../../../models";
import { FileTypes } from "../../../../models/FileObject";
import BaseFileCard, { getDesiredSize, scaleConfig } from "./BaseFileCard";
import { GridCardExport } from "./BaseGridCard";

/** GridCard for File model */
class FileCard extends BaseFileCard<FileObject> {
	get fileModel() {
		return FileObject;
	}

	/** Icons to display for non-image file types */
	static fileTypeIcons = new Map<FileTypes, string>([
		["file", "insert_drive_file"],
		["image", "photo"],
		["video", "movie"]
	]);

	render() {
		return this.renderBase(
			<Fragment>
				{this.state.model.type === "image" ? (
					this.renderImage()
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
				{this.state.model.is_deleted && (
					<Icon className={this.props.classes.icon} style={{ fontSize: Math.max(16, this.props.scale / 4) }}>
						delete
					</Icon>
				)}
				{this.renderName()}
			</Fragment>,
			`${this.state.model.name}\nGeotag: ${this.state.model.geotagAreaName}\nDate: ${this.state.model.timestamp}\nNotes: ${this.state.model.notes || "None"}\n${
				this.state.model.is_deleted ? "🗑" : ""
			}`
		);
	}
}

const meta: GridCardExport = {
	component: withStyles(FileCard.styles)(FileCard),
	modelType: "file",
	getDesiredSize: getDesiredSize,
	scaleConfig: scaleConfig
};
export default meta;
