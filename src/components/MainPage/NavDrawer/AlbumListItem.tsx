import { Icon, ListItemIcon, ListSubheader, Menu, MenuItem, TextField } from "@material-ui/core";
import React, { Fragment } from "react";
import { Album } from "../../../models";
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
		openDialogParent: false,
		openDialogRemove: false,
		loading: false
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
			parent: this.state.model.parent !== null ? this.state.model.parent.id : null
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
				<SimpleDialog
					open={this.state.openDialogNew}
					onClose={() => this.dialogClose("New")}
					title="Create Album"
					actionText="Create"
					action={() => Album.create(this.state.model.id, this.updates.subName)}
				>
					<TextField disabled label="Parent Album" defaultValue={this.state.model.path + "/"} />
					<TextField autoFocus label="New Album" onChange={event => (this.updates.subName = event.currentTarget.value)} />
				</SimpleDialog>

				{/* Change parent album dialog */}
				<ListDialog
					open={this.state.openDialogParent}
					onClose={() => this.dialogClose("Parent")}
					title="Change album parent"
					actionText="Change Parent"
					list={[{ id: null, name: "/", children: Album.rootAlbums }]}
					selected={this.state.model.parent === null ? null : this.state.model.parent.id}
					selectableFilter={id =>
						id === null ||
						!Album.getById(id)
							.allParents.map(album => album.id)
							.concat([id])
							.includes(this.state.model.id)
					}
					openByDefault={true}
					action={(parentId: number) => Album.getById(this.props.modelId).changeParent(parentId)}
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
