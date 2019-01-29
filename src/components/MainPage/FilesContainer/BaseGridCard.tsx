import { Card, CardActionArea } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import React from "react";
import Hammer from "react-hammerjs";
import { SelectMode } from ".";
import { Input } from "../../../controllers/Input";
import { Model } from "../../../models";
import { MountTrackedComponent } from "../../utils";

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
 * @template S Additional styling classes
 * @template P Additional props
 */
export default abstract class BaseGridCard<M extends (Model & { open: () => any }), S={}, P={}> extends MountTrackedComponent<GridCardProps & P & { classes: ({ border: string, card: string, action: string, content?: string } & S) }> {
	/** The margin on each side of GridCards */
	static margin = 5

	/** Default styles */
	static styles: any = {
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
			margin: BaseGridCard.margin
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
		// Ignore Hammer.onPress on non-touchscreen, as not relevant
		if (event.type == "press" && !Input.isTouching) return;

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
		return <Hammer onPress={ this.onContextMenu }>
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
			</Hammer>;
	}
}

/** Interface providing GridCard with scaling information */
export interface GridCardExport {
	/** The actual component to render */
	component: React.ComponentType<GridCardProps>

	/**
	 * Get the sizing of each GridCard in the given context
	 * @param scale Current FilesContainer scale value
	 * @param width Total screen width
	 * @returns The width and height of the cards
	 */
	getSize (scale: number, width: Breakpoint): { width: number, height: number }
}