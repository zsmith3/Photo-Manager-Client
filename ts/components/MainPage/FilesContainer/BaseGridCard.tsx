import { Card, CardActionArea, GridListTile } from "@material-ui/core";
import React from "react";
import { SelectMode } from ".";
import { Model } from "../../../models";
import { MountTrackedComponent } from "../../utils";
import { Input } from "../../../controllers/Input";
import Hammer from "react-hammerjs";

/** Type for BaseGridCard props  */
export interface GridCardProps {
	/** ID of the associated model instance */
	modelId: number,

	/** Scale of the card */
	scale: number,

	/** Whether the card is selected */
	selected: boolean,

	/** (Touch only) Whether to select on tap (rather than opening) */
	selectOnTap: boolean,

	/** Handler function to select item */
	onSelect: (modelId: number, mode: SelectMode) => void,

	/** Handler function to open the context menu */
	onMenu: (modelId: number, anchorPos: { top: number, left: number }) => void,
}

/**
 * Base class for all GridTile/Card displays
 * @template M The Model displayed
 * @template P Additional props
 * @template S Additional styling classes
 */
export default abstract class BaseGridCard<M extends (Model & { open: () => any }), S={}> extends MountTrackedComponent<GridCardProps & { classes: ({ border: string, card: string, action: string, content?: string } & S) }> {
	/** Default styles */
	static styles = {
		border: {
			position: "absolute" as "absolute",
			width: "100%",
			height: "100%",
			border: "2px solid blue",
			boxSizing: "border-box" as "border-box",
			zIndex: 1
		},
		card: {
			position: "relative" as "relative",
			margin: 5
		},
		action: {
			cursor: "default"
		}
	}


	state = {
		model: null as M
	}

	/** (Touch only) The timestamp at which this item was last selected (used to ignore extraneous click events) */
	selectResetTime: number = 0


	/**
	 * Get the size of this Card
	 * @returns The width and height styles of the Card
	 */
	protected abstract getSize (): { width: number | string, height: number | string }

	/** Select this item on click */
	onClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		// Ignore onClick on touchscreen if Hammer.onPress has recently been fired
		if (Input.isTouching && Date.now() - this.selectResetTime < 500) return;

		if (Input.isTouching) {
			if (this.props.selectOnTap) this.props.onSelect(this.props.modelId, SelectMode.Toggle);
			else this.state.model.open();
		} else this.props.onSelect(this.props.modelId, event.shiftKey ? SelectMode.Extend : (event.ctrlKey ? SelectMode.Toggle : SelectMode.Replace));
	}

	/** Open context menu on right-click */
	onContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		// Ignore onContextMenu on touchscreen as Hammer.onPress will already have fired
		if (event.type == "contextmenu" && Input.isTouching) return;

		if (Input.isTouching) {
			this.props.onSelect(this.props.modelId, SelectMode.Replace);
			this.selectResetTime = Date.now();
		} else this.props.onMenu(this.props.modelId, { top: event.clientY, left: event.clientX });
	}


	shouldComponentUpdate(nextProps, nextState) {
		return nextState !== this.state || nextProps.modelId !== this.props.modelId || nextProps.selected !== this.props.selected || nextProps.scale !== this.props.scale;
	}

	/**
	 * Render the base tile/card
	 * @param content The inner content to render
	 * @returns The fully rendered Card
	 */
	renderBase (content: JSX.Element) {
		return <GridListTile>
				<Hammer onPress={ this.onContextMenu }>
					<div> {/* This <div> is needed for Hammer to bind event listeners */}
						<Card className={ this.props.classes.card }
							style={ { ...(this.getSize()), backgroundColor: this.props.selected ? "lightblue" : "white" } }
							onClick={ this.onClick }
							onDoubleClick={ () => this.state.model.open() }
							onContextMenu={ this.onContextMenu }>
							<div style={ { display: this.props.selected ? "block" : "none" } } className={ this.props.classes.border } />
							<CardActionArea className={ this.props.classes.action }>
								{ content }
							</CardActionArea>
						</Card>
					</div>
				</Hammer>
			</GridListTile>;
	}
}
