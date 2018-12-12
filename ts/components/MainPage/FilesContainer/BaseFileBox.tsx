import React from "react";
import { GridListTile, Card, CardActionArea } from "@material-ui/core";
import { Model } from "../../../models";
import { MountTrackedComponent } from "../../utils";

export default class BaseFileBox<M extends (Model & { open: () => any }), P = {}> extends MountTrackedComponent<{ modelId: number, selected: boolean, onSelect: (event) => void } & P> {
	state = {
		model: null as M
	}

	style: {
		width: number,
		height: number
	}

	renderBase (content) {
		return <GridListTile>
				<Card style={ { margin: 5, backgroundColor: this.props.selected ? "lightblue" : "white", width: this.style.width, height: this.style.height } } onClick={ this.props.onSelect } onDoubleClick={ () => this.state.model.open() }>
					<CardActionArea style={ { cursor: "default" } }>
                        { content }
					</CardActionArea>
				</Card>
			</GridListTile>;
	}
}
