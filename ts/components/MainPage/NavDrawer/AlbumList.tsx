import React from "react";
import { List, ListSubheader }  from "@material-ui/core";
import AlbumListItem from "./AlbumListItem";
import { Album } from "../../../models/all_models";

export default class AlbumList extends React.Component {
	state = {
		albumIds: Album.objects.map(album => album.id)
	}

	constructor (props) {
        super(props);

		Album.registerUpdateHandler((albums: Album[]) => this.setState({albumIds: albums.map((album: Album) => album.id)}));
    }

	render () {
		return <List subheader={<ListSubheader>Albums</ListSubheader>}>
			{this.state.albumIds.map(albumId => (
				<AlbumListItem key={albumId} albumId={albumId} />
			))}
			</List>;
	}
}
