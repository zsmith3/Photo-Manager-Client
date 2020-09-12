import { List, ListItemIcon, ListSubheader, Menu, MenuItem, Radio } from "@material-ui/core";
import React, { Fragment } from "react";
import { PersonGroup } from "../../../models";
import { HoverIconButton, MountTrackedComponent, TextDialog } from "../../utils";
import PersonGroupListItem from "./PersonGroupListItem";
import { SortMethods } from "./PersonList";

/** List of PersonGroup instances, with modification options */
export default class PersonGroupList extends MountTrackedComponent<{}> {
	state = {
		groupIds: PersonGroup.meta.objects.map(group => group.id),
		openDialogNew: false,
		openMenu: false,
		menuAnchorEl: null,
		sortMethod: SortMethods.Count
	};

	constructor(props) {
		super(props);

		PersonGroup.registerListUpdateHandler((groups: PersonGroup[]) =>
			this.setStateSafe({
				groupIds: groups.map((group: PersonGroup) => group.id)
			})
		);
	}

	menuClose = () => {
		this.setState({ openMenu: false });
	};

	menuOpen = event => {
		this.setState({ menuAnchorEl: event.currentTarget, openMenu: true });
	};

	render() {
		return (
			<Fragment>
				<List
					subheader={
						<ListSubheader>
							People
							<HoverIconButton action={this.menuOpen} layers={1} style={{ float: "right" }}>
								more_vert
							</HoverIconButton>
							<HoverIconButton action={() => this.setState({ openDialogNew: true })} layers={1} style={{ float: "right" }}>
								add
							</HoverIconButton>
						</ListSubheader>
					}
				>
					{this.state.groupIds.map(groupId => (
						<PersonGroupListItem key={groupId} groupId={groupId} sortMethod={this.state.sortMethod} />
					))}
				</List>

				{/* New root album dialog */}
				<TextDialog
					open={this.state.openDialogNew}
					onClose={() => this.setState({ openDialogNew: false })}
					title="Create Group"
					actionText="Create"
					label="Group Name"
					action={(name: string) => PersonGroup.create(name)}
				/>

				{/* Options (sorting) menu */}
				<Menu
					anchorEl={this.state.menuAnchorEl}
					open={this.state.openMenu}
					onClick={this.menuClose}
					onClose={this.menuClose}
					MenuListProps={{ subheader: <ListSubheader style={{ lineHeight: "24px" }}>Options</ListSubheader> }}
				>
					<MenuItem onClick={() => this.setState({ sortMethod: SortMethods.Alphabetical })}>
						<ListItemIcon>
							<Radio checked={this.state.sortMethod == SortMethods.Alphabetical} />
						</ListItemIcon>
						Sort alphabetically
					</MenuItem>
					<MenuItem onClick={() => this.setState({ sortMethod: SortMethods.Count })}>
						<ListItemIcon>
							<Radio checked={this.state.sortMethod == SortMethods.Count} />
						</ListItemIcon>
						Sort by face count
					</MenuItem>
				</Menu>
			</Fragment>
		);
	}
}
