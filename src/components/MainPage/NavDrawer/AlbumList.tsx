import { List, ListSubheader, ListItemSecondaryAction, ListItem, Typography } from "@material-ui/core";
import React, { Fragment } from "react";
import { Album } from "../../../models";
import { MountTrackedComponent, HoverIconButton, TextDialog } from "../../utils";
import AlbumListItem from "./AlbumListItem";

/** List of Album instances (for root or child albums) */
export default class AlbumList extends MountTrackedComponent<{
	parentAlbumID?: number;
	indent?: number;
}> {
	state = {
		albumIds: [],
		openDialogNew: false
	};

	constructor(props) {
		super(props);

		Album.registerListUpdateHandler((albums: Album[]) => {
			this.setStateSafe({
				albumIds: albums
					.filter((album: Album) => (album.parent === null ? this.props.parentAlbumID === undefined : album.parent.id === this.props.parentAlbumID))
					.map((album: Album) => album.id)
			});
		});
	}

	render() {
		return (
			<Fragment>
				<List
					style={this.props.indent ? { padding: 0 } : null}
					subheader={
						this.props.parentAlbumID === undefined ? (
							<ListSubheader>
								Albums
								<HoverIconButton action={() => this.setState({ openDialogNew: true })} layers={1} style={{ float: "right" }}>
									add
								</HoverIconButton>
							</ListSubheader>
						) : null
					}
				>
					<Fragment>
						{this.state.albumIds.map(albumId => (
							<AlbumListItem key={albumId} albumId={albumId} indent={this.props.indent || 0} />
						))}
						{this.state.albumIds.length > 0 || (
							<Typography variant="body2" style={{ marginLeft: 40 }}>
								No albums here.
							</Typography>
						)}
					</Fragment>
				</List>

				{/* New root album dialog */}
				<TextDialog
					open={this.state.openDialogNew}
					onClose={() => this.setState({ openDialogNew: false })}
					title="Create Album"
					actionText="Create"
					label="Album Name"
					action={(name: string) => Album.create(null, name)}
				/>
			</Fragment>
		);
	}
}
