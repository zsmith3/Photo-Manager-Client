import { Card, CardActionArea, GridListTile } from "@material-ui/core";
import React from "react";
import { Model } from "../../../models";
import { MountTrackedComponent } from "../../utils";

/**
 * Base class for all GridTile/Card displays
 * @template M The Model displayed
 * @template P Additional props
 * @template S Additional styling classes
 */
export default abstract class BaseGridCard<M extends (Model & { open: () => any }), S={}> extends MountTrackedComponent<{ modelId: number, scale: number, selected: boolean, onSelect: (value: boolean) => void, classes: ({ card: string, action: string, content?: string } & S) }> {
	/** Default styles */
	static styles = {
		card: {
			margin: 5
		},
		action: {
			cursor: "default"
		}
	}

	state = {
		model: null as M
	}

	/**
	 * Get the size of this Card
	 * @returns The width and height styles of the Card
	 */
	protected abstract getSize (): { width: number | string, height: number | string }

	// TODO document
	select = (event: React.MouseEvent) => {
		event.stopPropagation();
		this.props.onSelect(true);
	}

	/**
	 * Render the base tile/card
	 * @param content The inner content to render
	 */
	renderBase (content: JSX.Element) {
		return <GridListTile>
				<Card className={ this.props.classes.card } style={ { ...(this.getSize()), backgroundColor: this.props.selected ? "lightblue" : "white" } } onClick={ this.select } onDoubleClick={ () => this.state.model.open() }>
					<CardActionArea className={ this.props.classes.action }>
                        { content }
					</CardActionArea>
				</Card>
			</GridListTile>;
	}
}
