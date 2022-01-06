import { Checkbox, FormControlLabel, Icon, ListItemIcon, ListSubheader, Menu, MenuItem, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import React, { Fragment } from "react";
import { AuthGroup, Folder } from "../../../../models";
import { ListDialog } from "../../../utils";
import BaseFolderCard from "./BaseFolderCard";
import { GridCardExport, GridCardProps } from "./BaseGridCard";

/** GridCard for Folder model */
class FolderCard extends BaseFolderCard<Folder> {
	state: {
		model: Folder;
		menuAnchorPos: { top: number; left: number };
		menuOpen: boolean;
		accessDialogOpen: boolean;
		accessGroupPropagate: boolean;
	};

	get folderModel() {
		return Folder;
	}

	// Initialise overriden state
	constructor(props: GridCardProps & { width: Breakpoint; classes: any }) {
		super(props);

		this.state = { ...this.state, menuAnchorPos: { top: 0, left: 0 }, menuOpen: false, accessDialogOpen: false, accessGroupPropagate: true };
	}

	/** Open menu (called on right click) */
	onMenu = (anchorPos: { top: number; left: number }) => this.setState({ menuOpen: true, menuAnchorPos: anchorPos });

	closeMenu = () => this.setState({ menuOpen: false });

	renderExtra = () => {
		return (
			<Fragment>
				<Menu
					anchorReference="anchorPosition"
					anchorPosition={this.state.menuAnchorPos}
					open={this.state.menuOpen}
					onClick={this.closeMenu}
					onClose={this.closeMenu}
					MenuListProps={{ subheader: <ListSubheader>{this.state.model.name}</ListSubheader> }}
				>
					<MenuItem key="access_edit" onClick={() => this.setState({ accessDialogOpen: true })}>
						<ListItemIcon>
							<Icon>security</Icon>
						</ListItemIcon>
						Change access
					</MenuItem>
				</Menu>

				{/* Edit access permissions */}
				<ListDialog
					open={this.state.accessDialogOpen}
					onClose={() => this.setState({ accessDialogOpen: false })}
					title="Edit access to folder"
					actionText="Confirm"
					list={AuthGroup.meta.objects}
					selected={this.state.model.accessGroupIds}
					multiple
					action={(authGroupIds: number[]) => this.state.model.updateAccessGroups(authGroupIds, this.state.accessGroupPropagate)}
				>
					<FormControlLabel
						control={<Checkbox checked={this.state.accessGroupPropagate} onChange={event => this.setState({ accessGroupPropagate: event.target.checked })} />}
						label="Propagate to children"
					/>
				</ListDialog>
			</Fragment>
		);
	};
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
