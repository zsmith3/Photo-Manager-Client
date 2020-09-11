import { Card, CardActionArea } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import React from "react";
import Hammer from "react-hammerjs";
import { Input } from "../../../../controllers/Input";
import { Model } from "../../../../models";
import { ImageModelType } from "../../../../models/BaseImageFile";
import { MountTrackedComponent } from "../../../utils";
import { SelectMode } from "../views/SelectionManager";

/** Type for BaseGridCard props  */
export interface GridCardProps {
	/** ID of the associated model instance */
	modelId: number;

	/** Scale of the card */
	scale: number;

	/** Whether the card is selected */
	selected: boolean;

	/** (Touch only) Whether to select on tap (rather than opening) */
	selectOnTap: boolean;

	/** Handler function to select item */
	onSelect: (modelId: number, mode: SelectMode) => void;

	/** Handler function to open the context menu */
	onMenu: (modelId: number, anchorPos: { top: number; left: number }) => void;
}

/** Default GridCard style classes */
interface GridCardClasses {
	[key: string]: string;
	border: string;
	card: string;
	action: string;
	content?: string;
}

/**
 * Base class for all GridTile/Card displays
 * @template M The Model displayed
 * @template C Additional styling classes
 * @template P Additional props
 */
export default abstract class BaseGridCard<M extends Model & { open: () => any }, C = {}, P = {}> extends MountTrackedComponent<
	GridCardProps & P & { classes: GridCardClasses & C }
> {
	/** The margin on all sides of GridCards */
	static margin = 5;

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
	};

	state = {
		model: null as M
	};

	/** (Touch only) The timestamp at which this item was last selected (used to ignore extraneous click events) */
	selectResetTime: number = 0;

	/**
	 * Get the size of this Card
	 * @returns The width and height styles of the Card
	 */
	protected abstract getSize(): {
		width: number | string;
		height: number | string;
	};

	/** Select this item on click */
	onClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		// Ignore onClick on touchscreen if Hammer.onPress has recently been fired
		if (Input.isTouching && Date.now() - this.selectResetTime < 500) return;

		if (Input.isTouching) {
			if (this.props.selectOnTap) this.props.onSelect(this.props.modelId, SelectMode.Toggle);
			else this.state.model.open();
		} else if (this.props.onSelect === null) this.state.model.open();
		else this.props.onSelect(this.props.modelId, event.shiftKey ? SelectMode.Extend : event.ctrlKey ? SelectMode.Toggle : SelectMode.Replace);
	};

	/** Open context menu on right-click */
	onContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		// Ignore onContextMenu on touchscreen as Hammer.onPress will already have fired
		if (event.type == "contextmenu" && Input.isTouching) return;
		// Ignore Hammer.onPress on non-touchscreen, as not relevant
		if (event.type == "press" && !Input.isTouching) return;

		if (!this.props.selected) this.props.onSelect(this.props.modelId, event.shiftKey ? SelectMode.Extend : event.ctrlKey ? SelectMode.Toggle : SelectMode.Replace);
		if (Input.isTouching) this.selectResetTime = Date.now();
		else this.props.onMenu(this.props.modelId, { top: event.clientY, left: event.clientX });
	};

	shouldComponentUpdate(nextProps: GridCardProps & P & { classes: GridCardClasses & C }, nextState: { model: M }) {
		return nextState !== this.state || nextProps.modelId !== this.props.modelId || nextProps.selected !== this.props.selected || nextProps.scale !== this.props.scale;
	}

	/**
	 * Render the base tile/card
	 * @param content The inner content to render
	 * @returns The fully rendered Card
	 */
	renderBase(content: JSX.Element) {
		return (
			<Hammer onPress={this.onContextMenu}>
				{/* This <div> is needed for Hammer to bind event listeners */}
				<div style={{ display: "inline-block" }}>
					{" "}
					<Card
						className={this.props.classes.card}
						style={{
							...this.getSize(),
							backgroundColor: this.props.selected ? "lightblue" : "white"
						}}
						onClick={this.onClick}
						onDoubleClick={() => this.state.model.open()}
						onContextMenu={this.onContextMenu}
					>
						{/* Border to mark as selected */}
						<div style={{ display: this.props.selected ? "block" : "none" }} className={this.props.classes.border} />

						{/* Content from the specific GridCard type */}
						<CardActionArea className={this.props.classes.action}>{content}</CardActionArea>
					</Card>
				</div>
			</Hammer>
		);
	}
}

/** Interface providing GridCard with scaling information */
export interface GridCardExport {
	/** The actual component to render */
	component: React.ComponentType<GridCardProps>;

	/** The model class represented by this card */
	modelType?: ImageModelType;

	/**
	 * Get the sizing of each GridCard in the given context
	 * @param scale Current FilesContainer scale value
	 * @param width Total screen width
	 * @returns The width and height of the cards
	 */
	getDesiredSize(scale: number, screenWidth?: Breakpoint): { width: number; height: number };

	/** Settings for scaling this GridCard type */
	scaleConfig: { max: number; min: number; default: number };
}
