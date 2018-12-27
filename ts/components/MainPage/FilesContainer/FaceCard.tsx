import { Typography, withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { Face } from "../../../models";
import { mediaRequest } from "../../../utils";
import BaseGridCard, { GridCardProps } from "./BaseGridCard";

/** GridCard for Face model */
class FaceCard extends BaseGridCard<Face, { img: string, statusIcon: string }> {
	static styles = {
		...BaseGridCard.styles,
		content: {
			padding: 0
        },
        img: {
            width: "100%",
            height: "100%"
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

	protected getSize () { return { width: this.props.scale * 8 / 15, height: this.props.scale * 2 / 3 }; }

	render () {
		if (!this.state.data) mediaRequest("api/images/faces/" + this.state.model.id + "/200/").then(data => this.setStateSafe({ data: data }));

		return this.renderBase(
			<Fragment>
				<img src={ this.state.data } className={ this.props.classes.img } />
				{ this.state.model.status > 1 && 
				<Typography variant="h2" className={ this.props.classes.statusIcon }>?</Typography>
				}
			</Fragment>
		);
	}
}

export default withStyles(FaceCard.styles)(FaceCard);
