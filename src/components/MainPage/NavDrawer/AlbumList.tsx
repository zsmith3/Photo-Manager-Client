import React, { Fragment } from "react";
import { Album, AuthGroup } from "../../../models";
import { HoverIconButton, ListDialog, TextDialog } from "../../utils";
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
				<ListDialog
					open={this.state.openDialogNew}
					onClose={() => this.setState({ openDialogNew: false })}
					title="Create Album"
					actionText="Create"
					textLabel="Album Name"
					list={AuthGroup.meta.objects}
					selected={AuthGroup.meta.objects.map(group => group.id)}
					multiple
					action={(authGroupIds: number[], name: string) => Album.create(null, name, authGroupIds)}
				/>
			</Fragment>
		);
	}
}
