import { Collapse, Icon, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader, Menu, MenuItem, MenuList, Radio, TextField } from "@material-ui/core";
import React from "react";
import { Album } from "../../../models";
import { HoverIconButton, SimpleDialog, TextDialog, ListDialog, MountTrackedComponent } from "../../utils";
import AlbumList from "./AlbumList";

export default class AlbumListItem extends MountTrackedComponent<{
	albumId: number;
	indent?: number;
}> {
	state = {
		album: null as Album,
		menuAnchorEl: null,
		openCollapse: true,
		openMenu: false,
		openDialogRename: false,
		openDialogNew: false,
		openDialogParent: false,
		openDialogRemove: false,
		loading: false,
		parentUpdateID: null as number
	};

	updates: {
		subName: string;
		parent: number;
	};

	constructor(props: { albumId: number; indent?: number }) {
		super(props);

		Album.getById(props.albumId).registerInstanceUpdateHandler((album: Album) => this.setStateSafe({ album: album }));
		this.state.album = Album.getById(props.albumId);
		this.state.parentUpdateID = this.state.album.parent !== null ? this.state.album.parent.id : null;

		this.updates = {
			subName: "",
			parent: this.state.album.parent !== null ? this.state.album.parent.id : null
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

	render() {
		let Fragment = React.Fragment;
		return (
			<Fragment>
				{/* Main album list item */}
				<ListItem
					button
					style={{
						padding: 6,
						paddingLeft: 24 + (this.props.indent || 0) * 16
					}}
				>
					<a href="">
						{" "}
						{/* TODO href */}
						<ListItemText primary={`${this.state.album.name} (${this.state.album.file_count})`} />
					</a>

					<ListItemSecondaryAction>
						<HoverIconButton action={this.menuOpen}>more_vert</HoverIconButton>

						{this.state.album.children.length > 0 && (
							<HoverIconButton action={() => this.setState({ openCollapse: !this.state.openCollapse })}>{this.state.openCollapse ? "expand_less" : "expand_more"}</HoverIconButton>
						)}
					</ListItemSecondaryAction>
				</ListItem>

				{/* Nested list of child albums */}
				{this.state.album.children.length > 0 && (
					<Collapse in={this.state.openCollapse}>
						<AlbumList parentAlbumID={this.props.albumId} indent={this.props.indent + 1} />
					</Collapse>
				)}

				{/* Linked menu and dialogs for modifying album */}
				<Fragment>
					{/* Options menu */}
					<Menu anchorEl={this.state.menuAnchorEl} open={this.state.openMenu} onClick={this.menuClose} onClose={this.menuClose}>
						<MenuList subheader={<ListSubheader style={{ lineHeight: "24px" }}>{this.state.album.path}</ListSubheader>}>
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
						</MenuList>
					</Menu>

					{/* Album rename dialog */}
					<TextDialog
						open={this.state.openDialogRename}
						onClose={() => this.dialogClose("Rename")}
						title="Rename Album"
						actionText="Rename"
						label="Album Name"
						defaultValue={this.state.album.name}
						action={(name: string) => Album.getById(this.props.albumId).updateSave({ name: name })}
					/>

					{/* New sub-album dialog */}
					<SimpleDialog
						open={this.state.openDialogNew}
						onClose={() => this.dialogClose("New")}
						title="Create Album"
						actionText="Create"
						action={() => Album.create(this.state.album.id, this.updates.subName)}
					>
						<TextField disabled label="Parent Album" defaultValue={this.state.album.path + "/"} />
						<TextField autoFocus label="New Album" onChange={event => (this.updates.subName = event.currentTarget.value)} />
					</SimpleDialog>

					{/* Change parent album dialog */}
					<ListDialog
						open={this.state.openDialogParent}
						onClose={() => this.dialogClose("Parent")}
						title="Change album parent"
						actionText="Change Parent"
						list={Album.meta.objects.filter(album => album.id !== this.props.albumId).map(album => ({ id: album.id, name: album.path }))}
						selected={this.state.album.parent === null ? null : this.state.album.parent.id}
						nullItem="/"
						action={(parentId: number) =>
							Album.getById(this.props.albumId)
								.updateSave({ parent: parentId })
								.then(() => Album.handleListUpdate())
						}
					/>

					{/* Delete album dialog */}
					<SimpleDialog
						open={this.state.openDialogRemove}
						onClose={() => this.dialogClose("Remove")}
						title="Remove Album"
						text={
							<Fragment>
								Are you sure you want to delete the album <i>{this.state.album.name}</i>?
							</Fragment>
						}
						actionText="Confirm"
						action={() => Album.getById(this.props.albumId).delete()}
					/>
				</Fragment>
			</Fragment>
		);
	}
}
