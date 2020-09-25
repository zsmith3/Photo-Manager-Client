import React, { Fragment } from "react";
import { Album } from "../../../models";
import { HoverIconButton, TextDialog } from "../../utils";
import AlbumListItem from "./AlbumListItem";
import HierarchyList from "./HierarchyList";

/** List of Album instances (for root or child albums) */
export default class AlbumList extends HierarchyList<Album> {
	static get modelType() {
		return Album;
	}

	static get listItemComponent() {
		return AlbumListItem;
	}

	static modelTypeName = "Album";

	state = {
		...this.state,
		openDialogNew: false
	};

	renderHeaderButton() {
		return (
			<Fragment>
				<HoverIconButton action={() => this.setState({ openDialogNew: true })} layers={1} style={{ float: "right" }}>
					add
				</HoverIconButton>

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
