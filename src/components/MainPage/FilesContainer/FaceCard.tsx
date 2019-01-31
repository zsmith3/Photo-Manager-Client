import { Typography, withStyles } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import React, { Fragment } from "react";
import { FaceImgSizes } from "../../../controllers/Platform";
import { Face } from "../../../models";
import { ImageLoader } from "../../utils";
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

		Face.getById(props.modelId).registerInstanceUpdateHandler((face: Face) => this.setStateSafe({ model: face }));
		this.state.model = Face.getById(props.modelId);
	}

	protected getSize() {
		return meta.getSize(this.props.scale, null);
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
	getSize(scale: number, width: Breakpoint) {
		return { width: scale, height: (scale * 5) / 4 };
	}
};
export default meta;
