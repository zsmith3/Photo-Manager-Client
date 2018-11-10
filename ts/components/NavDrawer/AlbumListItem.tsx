import React from "react";
import $ from "jquery";
import { ListItem, ListItemText, Icon, IconButton } from "@material-ui/core";
import App from "../App";
import { Album } from "../../models/all_models";


export default class AlbumListItem extends React.Component<{albumId: number}> {
	state: {
		album: Album
	}

	constructor (props: { albumId: number }) {
		super(props);

		Album.getById(props.albumId).registerUpdateHandler((album: Album) => this.setState({album: album}));
		this.state = { album: Album.getById(props.albumId) };
	}

	render () {
		return <ListItem button>
				<a href=""> {/* TODO href */}
					<ListItemText primary={ this.state.album.name } secondary={ this.state.album.file_count + " files" } />
				</a>

				<IconButton onClick={() => {App.app.els.toolBar.showAddModal("album", $(this).parent().attr("data-id"), $(this).parent().attr("data-path"), this).then(function (data) { Album.create(data.parent, data.name); });}}>
					<Icon>add</Icon>
				</IconButton>
				<IconButton onClick={() => {let el = this; App.app.els.toolBar.confirmAction("delalb", "delete album " + $(this).parent().attr("data-path"), null, this).then(function () { Album.getById($(el).parent().attr("data-id")).delete(); });}}>
					<Icon>clear</Icon>
				</IconButton>
			</ListItem>;
	}
}
