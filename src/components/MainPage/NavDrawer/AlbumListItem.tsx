import { Checkbox, FormControlLabel, Icon, ListItemIcon, ListSubheader, Menu, MenuItem, TextField } from "@material-ui/core";
import React, { Fragment } from "react";
import { Album, AuthGroup } from "../../../models";
import { HoverIconButton, ListDialog, SimpleDialog, TextDialog } from "../../utils";
import AlbumList from "./AlbumList";
import HierarchyListItem from "./HierarchyListItem";

/** ListItem to display a single album, with children as collapsible sub-list */
export default class AlbumListItem extends HierarchyListItem<Album> {
	static get modelType() {
		return Album;
	}

	static get listComponent() {
		return AlbumList;
	}

	static modelTypeName = "Album";

	state = {
		...this.state,
		openCollapse: true,
		menuAnchorEl: null,
		openMenu: false,
		openDialogRename: false,
		openDialogNew: false,
		openDialogAccess: false,
		openDialogParent: false,
		openDialogRemove: false,
		loading: false,
		accessGroupPropagate: true
	};

	/** Current values of Dialog inputs */
	updates: {
		subName: string;
		parent: number;
	};

	constructor(props: { modelId: number; indent?: number }) {
		super(props);

		this.updates = {
			subName: "",
			parent: this.state.model.parent ? this.state.model.parent.id : null
		};
	}

	menuClose = () => {
		this.setState({ openMenu: false });
	};

	menuOpen = event => {
		this.setState({ menuAnchorEl: event.currentTarget, openMenu: true });
	};

	dialogOpen = type => this.setState({ ["openDialog" + type]: true });

	dialogClose = type => this.setStateSafe({ ["openDialog" + type]: false, loading: false });

	renderMenuButton() {
		return <HoverIconButton action={this.menuOpen}>more_vert</HoverIconButton>;
	}

	renderPopups() {
		return (
			<Fragment>
				{/* Options menu */}
				<Menu
					anchorEl={this.state.menuAnchorEl}
					open={this.state.openMenu}
					onClick={this.menuClose}
					onClose={this.menuClose}
					MenuListProps={{ subheader: <ListSubheader>{this.state.model.path}</ListSubheader> }}
				>
					<MenuItem onClick={() => this.dialogOpen("Rename")}>
						<ListItemIcon>
							<Icon>edit</Icon>
						</ListItemIcon>
						Rename
					</MenuItem>
					<MenuItem onClick={() => this.dialogOpen("New")}>
						<ListItemIcon>
							<Icon>add</Icon>
						</ListItemIcon>
						Create
					</MenuItem>
					<MenuItem onClick={() => this.dialogOpen("Parent")}>
						<ListItemIcon>
							<Icon>folder</Icon>
						</ListItemIcon>
						Change Parent
					</MenuItem>
					<MenuItem onClick={() => this.dialogOpen("Access")}>
						<ListItemIcon>
							<Icon>security</Icon>
						</ListItemIcon>
						Change Access
					</MenuItem>
					<MenuItem onClick={() => this.dialogOpen("Remove")}>
						<ListItemIcon>
							<Icon>delete</Icon>
						</ListItemIcon>
						Remove
					</MenuItem>
				</Menu>

				{/* Album rename dialog */}
				<TextDialog
					open={this.state.openDialogRename}
					onClose={() => this.dialogClose("Rename")}
					title="Rename Album"
					actionText="Rename"
					label="Album Name"
					defaultValue={this.state.model.name}
					action={(name: string) => Album.getById(this.props.modelId).updateSave({ name: name })}
				/>

				{/* New sub-album dialog */}
				<ListDialog
					open={this.state.openDialogNew}
					onClose={() => this.dialogClose("New")}
					title="Create Album"
					actionText="Create"
					textLabel="New Album"
					list={AuthGroup.meta.objects}
					selected={AuthGroup.meta.objects.map(group => group.id)}
					multiple
					action={(authGroupIds: number[], name: string) => Album.create(this.state.model.id, name, authGroupIds)}
					childrenBefore
				>
					<TextField disabled label="Parent Album" defaultValue={this.state.model.path + "/"} />
				</ListDialog>

				{/* Edit access groups dialog */}
				<ListDialog
					open={this.state.openDialogAccess}
					onClose={() => this.dialogClose("Access")}
					title="Edit access groups"
					text="Note this will add any new access groups to all contained files"
					actionText="Confirm"
					list={AuthGroup.meta.objects}
					selected={this.state.model.accessGroupIds}
					multiple
					action={(authGroupIds: number[]) => this.state.model.updateAccessGroups(authGroupIds, this.state.accessGroupPropagate)}
				>
					<FormControlLabel
						control={<Checkbox checked={this.state.accessGroupPropagate} onChange={event => this.setState({ accessGroupPropagate: event.target.checked })} />}
						label="Propagate to child albums"
					/>
				</ListDialog>

				{/* Change parent album dialog */}
				<ListDialog
					open={this.state.openDialogParent}
					onClose={() => this.dialogClose("Parent")}
					title="Change album parent"
					actionText="Change Parent"
					list={[{ id: null, name: "/", children: Album.rootAlbums }]}
					selected={this.state.model.parent ? [this.state.model.parent.id] : []}
					selectableFilter={id =>
						id === null ||
						!Album.getById(id)
							.allParents.map(album => album.id)
							.concat([id])
							.includes(this.state.model.id)
					}
					openByDefault={true}
					action={(parentId: number[]) => Album.getById(this.props.modelId).changeParent(parentId[0])}
				/>

				{/* Delete album dialog */}
				<SimpleDialog
					open={this.state.openDialogRemove}
					onClose={() => this.dialogClose("Remove")}
					title="Remove Album"
					text={
						<Fragment>
							Are you sure you want to delete the album <i>{this.state.model.name}</i>?
						</Fragment>
					}
					actionText="Confirm"
					action={() => Album.getById(this.props.modelId).delete()}
				/>
			</Fragment>
		);
	}
}
