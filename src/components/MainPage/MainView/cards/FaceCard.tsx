import { Typography, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { FaceImgSizes } from "../../../../controllers/Platform";
import { Face } from "../../../../models";
import { ImageLoader } from "../../../utils";
import BaseGridCard, { GridCardExport, GridCardProps } from "./BaseGridCard";

/** GridCard for Face model */
class FaceCard extends BaseGridCard<Face, { statusIcon: string }> {
	static styles = {
		...BaseGridCard.styles,
		content: {
			padding: 0
		},
		statusIcon: {
			position: "absolute" as "absolute",
			bottom: 0,
			width: "100%",
			textAlign: "center" as "center",
			textShadow: "0 0 20px black",
			color: "white"
		}
	};

	state = {
		model: null as Face,
		data: ""
	};

	constructor(props: GridCardProps & { classes: any }) {
		super(props);

		let face = Face.getById(props.modelId);
		this.state.model = face;
		face.registerInstanceUpdateHandler((face: Face) => this.setStateSafe({ model: face }));
	}

	protected getSize() {
		return meta.getDesiredSize(this.props.scale);
	}

	render() {
		return this.renderBase(
			<Fragment>
				<ImageLoader model={this.state.model} maxSize={FaceImgSizes.Standard} minSize={FaceImgSizes.Standard} style={this.getSize()} />
				{this.state.model.status > 1 && (
					<Typography variant="h2" className={this.props.classes.statusIcon}>
						?
					</Typography>
				)}
			</Fragment>
		);
	}
}

const meta: GridCardExport = {
	component: withStyles(FaceCard.styles)(FaceCard),
	modelType: "face",
	getDesiredSize(scale: number) {
		return { width: scale, height: (scale * 5) / 4 };
	},
	scaleConfig: { max: 160, min: 40, default: 80 }
};
export default meta;
