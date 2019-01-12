import { Typography, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { FaceImgSizes } from "../../../controllers/Platform";
import { Face } from "../../../models";
import { ImageLoader } from "../../utils";
import BaseGridCard, { GridCardProps } from "./BaseGridCard";

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
	}

	state = {
		model: null as Face,
		data: ""
	}

	constructor (props: GridCardProps & { classes: any }) {
		super(props);

		Face.getById(props.modelId).registerInstanceUpdateHandler((face: Face) => this.setStateSafe({ model: face }));
		this.state.model = Face.getById(props.modelId);
	}

	protected getSize () { return { width: this.props.scale, height: this.props.scale * 5 / 4 }; }


	render () {
		return this.renderBase(
			<Fragment>
				<ImageLoader model={ this.state.model } maxSize={ FaceImgSizes.Standard } minSize={ FaceImgSizes.Standard } style={ this.getSize() } />
				{ this.state.model.status > 1 &&
				<Typography variant="h2" className={ this.props.classes.statusIcon }>?</Typography>
				}
			</Fragment>
		);
	}
}

export default withStyles(FaceCard.styles)(FaceCard);
