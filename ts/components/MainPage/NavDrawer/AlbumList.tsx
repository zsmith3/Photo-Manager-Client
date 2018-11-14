import { List, ListSubheader } from '@material-ui/core';
import React from 'react';
import { Album } from '../../../models';
import { MountTrackedComponent } from '../../utils';
import AlbumListItem from './AlbumListItem';

export default class AlbumList extends MountTrackedComponent<{ parentAlbumID?: number, indent?: number }> {
	state = {
		albumIds: []//Album.meta.objects.map(album => album.id)
	}

	constructor (props) {
		super(props);

		Album.registerUpdateHandler((albums: Album[]) => {
			let albumIds = albums.filter((album: Album) => ((album.parent === null) ? (this.props.parentAlbumID === undefined) : (album.parent.id === this.props.parentAlbumID))).map((album: Album) => album.id);
			this.setStateSafe({ albumIds: albumIds });
		});
	}

	render () {
		return <List style={ this.props.indent ? { padding: 0 } : null } subheader={ this.props.parentAlbumID === undefined ? <ListSubheader>Albums</ListSubheader> : null }>
			{this.state.albumIds.map(albumId => (
				<AlbumListItem key={albumId} albumId={albumId} indent={ this.props.indent || 0 } />
			))}
			</List>;
	}
}

// TODO 1) load people
// 2) maybe make list item styling global
// 3) make icon buttons actually do stuff (will involve model changes)
