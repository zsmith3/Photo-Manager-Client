import { isWidthUp, Slider, Theme } from "@material-ui/core";
import React from "react";
import { GridView } from ".";
import { Database } from "../../../../../controllers/Database";
import BaseGridCard from "../../cards/BaseGridCard";

/** Manager for GridCard scaling in GridView */
export default class ScaleManager {
	/** Padding at the far left and right of the main grid */
	static horizontalPadding = 20;

	/** Height of the scaling slider */
	static sliderHeight = 40;

	/** Styling for scaling slider */
	static sliderStyle = (theme: Theme) => ({
		margin: 20,
		marginTop: ScaleManager.sliderHeight / 2,
		marginBottom: 0,
		height: ScaleManager.sliderHeight / 2,
		[theme.breakpoints.up("md")]: {
			width: 200
		},
		[theme.breakpoints.down("sm")]: {
			margin: 0,
			paddingTop: 20
		}
	});

	/** GridView instance which this manager is attached to */
	view: GridView;

	constructor(view: GridView) {
		this.view = view;

		this.view.state.currentScale = this.getScaleFromProp(Database.auth.getConfig("thumb_scale", isWidthUp("md", view.props.width)));
	}

	/** Get the actual width which can be occupied by all GridCards */
	private getAvailableWidth() {
		return this.view.props.totalWidth - ScaleManager.horizontalPadding * 2;
	}

	/** Get default/range for scale, based on the GridCard for the contents model */
	private getScaleConfig(): { max: number; min: number; default: number } {
		return this.view.state.data ? this.view.state.data.contents.card.scaleConfig : this.view.class.rootModelClass.rootModelMeta.contentsCard.scaleConfig;
	}

	/**
	 * Get scale in pixels from proportion (i.e. 0 to 1)
	 * @param prop Scale proportion
	 * @returns Actual scale in pixels
	 */
	getScaleFromProp(prop: number) {
		const config = this.getScaleConfig();
		return config.min + (config.max - config.min) * prop;
	}

	/**
	 * Get scale proportion (0 to 1) from actual scale (pixels)
	 * @param scale Scale in pixels
	 * @returns Scale proportion
	 */
	getPropFromScale(scale: number) {
		const config = this.getScaleConfig();
		return (scale - config.min) / (config.max - config.min);
	}

	/**
	 * Get required scale for an item count
	 * @param count The number of GridCard items which should fit on one row
	 * @returns The required width of each GridCard
	 */
	getScaleFromCount(count: number) {
		let margin = BaseGridCard.margin * 2;
		let width = this.getAvailableWidth();
		return width / count - margin;
	}

	/**
	 * Get count resulting from a scale
	 * @param scale The desired width of each GridCard item
	 * @returns The (rounded down) number of GridCard items which will fit on one row
	 */
	getCountFromScale(scale: number) {
		let margin = BaseGridCard.margin * 2;
		let width = this.getAvailableWidth();
		return Math.max(Math.floor(width / (scale + margin)), 1);
	}

	/** Force the virtualised List to refresh row heights */
	recomputeHeight() {
		this.view.virtualList.current.recomputeRowHeights();
	}

	/**
	 * Render the Slider used for adjusting scale
	 * @param className CSS className for the Slider element
	 */
	render(className: string) {
		const config = this.getScaleConfig();

		let minCount = this.getCountFromScale(config.max);
		let maxCount = this.getCountFromScale(config.min);

		return (
			<Slider
				className={className}
				value={-this.getCountFromScale(this.view.state.currentScale)}
				min={-maxCount}
				max={-minCount}
				step={1}
				onChange={(event, value) => this.view.setState({ currentScale: this.getScaleFromCount(-value) })}
				onChangeCommitted={(event, value) =>
					Database.auth.updateConfig("thumb_scale", isWidthUp("md", this.view.props.width), this.getPropFromScale(this.getScaleFromCount(-value)))
				}
			/>
		);
	}
}
