import { Collapse, Icon, ListItem, ListItemText, ListItemSecondaryAction, Menu, MenuList, MenuItem, ListSubheader, ListItemIcon } from "@material-ui/core";
import React from "react";
import { PersonGroup, Person } from "../../../models/Person";
import PersonList from "./PersonList";
import { HoverIconButton, MountTrackedComponent, TextDialog, SimpleDialog } from "../../utils";

export default class PersonGroupListItem extends MountTrackedComponent<{
	groupId: number;
}> {
	state = {
		group: null as PersonGroup,
		menuAnchorEl: null,
		openCollapse: false,
		openMenu: false,
		openDialogRename: false,
		openDialogNew: false,
		openDialogRemove: false
	};

	constructor(props: { groupId: number }) {
		super(props);

		this.updateHandler = PersonGroup.getById(props.groupId).updateHandlers.register((group: PersonGroup) => this.setStateSafe({ group: group }));
	}

	menuClose = () => {
		this.setState({ openMenu: false });
	};

	menuOpen = event => {
		this.setState({ menuAnchorEl: event.currentTarget, openMenu: true });
	};

	dialogOpen = type => this.setState({ ["openDialog" + type]: true });

	dialogClose = type => this.setStateSafe({ ["openDialog" + type]: false, loading: false });

	shouldComponentUpdate(nextProps, nextState) {
		return this.props.groupId !== nextProps.groupId || this.state !== nextState;
	}

	render() {
		let Fragment = React.Fragment;
		return (
			<Fragment>
				<ListItem button>
					<ListItemText primary={this.state.group.name} />

					<ListItemSecondaryAction>
						<HoverIconButton action={this.menuOpen}>more_vert</HoverIconButton>

						<HoverIconButton action={() => this.setState({ openCollapse: !this.state.openCollapse })}>{this.state.openCollapse ? "expand_less" : "expand_more"}</HoverIconButton>
					</ListItemSecondaryAction>
				</ListItem>
				<Collapse in={this.state.openCollapse}>
					<PersonList groupId={this.props.groupId} />
				</Collapse>

				{/* Linked menu and dialogs for modifying person group */}
				<Fragment>
					{/* Options menu */}
					<Menu anchorEl={this.state.menuAnchorEl} open={this.state.openMenu} onClick={this.menuClose} onClose={this.menuClose}>
						<MenuList subheader={<ListSubheader style={{ lineHeight: "24px" }}>{this.state.group.name}</ListSubheader>}>
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
								New Person
							</MenuItem>
							<MenuItem onClick={() => this.dialogOpen("Remove")}>
								<ListItemIcon>
									<Icon>delete</Icon>
								</ListItemIcon>
								Remove
							</MenuItem>
						</MenuList>
					</Menu>

					{/* Person group rename dialog */}
					<TextDialog
						open={this.state.openDialogRename}
						onClose={() => this.dialogClose("Rename")}
						title="Rename Group"
						actionText="Rename"
						label="Group Name"
						defaultValue={this.state.group.name}
						action={(name: string) => PersonGroup.getById(this.props.groupId).updateSave({ name: name })}
					/>

					{/* New person dialog */}
					<TextDialog
						open={this.state.openDialogNew}
						onClose={() => this.dialogClose("New")}
						title="Create Person"
						actionText="Create"
						label="Person Name"
						action={(name: string) => Person.create(name, this.state.group.id)}
					/>

					{/* Delete group dialog */}
					<SimpleDialog
						open={this.state.openDialogRemove}
						onClose={() => this.dialogClose("Remove")}
						title="Remove Group"
						text={
							<Fragment>
								Are you sure you want to delete the person <i>{this.state.group.name}</i>?
							</Fragment>
						}
						actionText="Confirm"
						action={() => PersonGroup.getById(this.props.groupId).delete()}
					/>
				</Fragment>
			</Fragment>
		);
	}
}
