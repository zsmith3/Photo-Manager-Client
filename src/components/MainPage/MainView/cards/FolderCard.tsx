import { withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import { Folder } from "../../../../models";
import BaseFolderCard from "./BaseFolderCard";
import { GridCardExport } from "./BaseGridCard";

/** GridCard for Folder model */
class FolderCard extends BaseFolderCard<Folder> {
	get folderModel() {
		return Folder;
	}
}

const meta: GridCardExport = {
	component: withWidth()(withStyles(FolderCard.styles)(FolderCard)),
	getDesiredSize(scale: number, screenWidth: Breakpoint) {
		let lg = isWidthUp("md", screenWidth);
		return { width: lg ? 200 : 150, height: lg ? 73 : 60 };
	},
	scaleConfig: null
};
export default meta;
