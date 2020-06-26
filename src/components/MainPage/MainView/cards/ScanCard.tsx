import { withStyles } from "@material-ui/core";
import React, { Fragment } from "react";
import { Scan } from "../../../../models/Scan";
import BaseFileCard, { getDesiredSize, scaleConfig } from "./BaseFileCard";
import { GridCardExport } from "./BaseGridCard";

/** GridCard for Scan model */
class ScanCard extends BaseFileCard<Scan> {
	get fileModel() {
		return Scan;
	}

	render() {
		return this.renderBase(
			<Fragment>
				{this.renderImage()}

				{this.renderName()}
			</Fragment>
		);
	}
}

const meta: GridCardExport = {
	component: withStyles(ScanCard.styles)(ScanCard),
	modelType: "scan",
	getDesiredSize: getDesiredSize,
	scaleConfig: scaleConfig
};
export default meta;
