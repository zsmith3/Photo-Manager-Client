import { withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import { ScanFolder } from "../../../../models/ScanFolder";
import BaseFolderCard from "./BaseFolderCard";
import { GridCardExport } from "./BaseGridCard";

/** GridCard for ScanFolder model */
class ScanFolderCard extends BaseFolderCard<ScanFolder> {
	get folderModel() {
		return ScanFolder;
	}
}

const meta: GridCardExport = {
	component: withWidth()(withStyles(ScanFolderCard.styles)(ScanFolderCard)),
	getDesiredSize(scale: number, screenWidth: Breakpoint) {
		let lg = isWidthUp("md", screenWidth);
		return { width: lg ? 200 : 150, height: lg ? 73 : 60 };
	},
	scaleConfig: null
};
export default meta;
