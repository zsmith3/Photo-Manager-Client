import { Checkbox, Collapse, FormControlLabel, Icon, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader, Menu, MenuItem } from "@material-ui/core";
import React from "react";
import { Person, PersonGroup } from "../../../models/Person";
import { HoverIconButton, ListDialog, MountTrackedComponent, SimpleDialog, TextDialog } from "../../utils";
import PersonList, { SortMethods } from "./PersonList";
import { AuthGroup } from "../../../models";
import { Database } from "../../../controllers/Database";

export default class PersonGroupListItem extends MountTrackedComponent<{
	groupId: number;
	sortMethod: SortMethods;
}> {
	state = {
		group: null as PersonGroup,
		menuAnchorEl: null,
		openCollapse: false,
		openMenu: false,
		openDialogRename: false,
		openDialogNew: false,
		openDialogAccess: false,
		openDialogRemove: false,
		accessGroupPropagate: true
	};

	constructor(props: { groupId: number; sortMethod: SortMethods }) {
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
		return this.props.groupId !== nextProps.groupId || this.props.sortMethod !== nextProps.sortMethod || this.state !== nextState;
	}

	render() {
		let Fragment = React.Fragment;
		return (
			<Fragment>
				<ListItem button onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}>
					<ListItemText primary={this.state.group.name} />

					<ListItemSecondaryAction>
						{Database.auth.isLoggedIn() && <HoverIconButton action={this.menuOpen}>more_vert</HoverIconButton>}

						<HoverIconButton action={() => this.setState({ openCollapse: !this.state.openCollapse })}>{this.state.openCollapse ? "expand_less" : "expand_more"}</HoverIconButton>
					</ListItemSecondaryAction>
				</ListItem>
				<Collapse in={this.state.openCollapse}>
					<PersonList groupId={this.props.groupId} sortMethod={this.props.sortMethod} visible={this.state.openCollapse} />
				</Collapse>

				{/* Linked menu and dialogs for modifying person group */}
				<Fragment>
					{/* Options menu */}
					<Menu
						anchorEl={this.state.menuAnchorEl}
						open={this.state.openMenu}
						onClick={this.menuClose}
						onClose={this.menuClose}
						MenuListProps={{ subheader: <ListSubheader>{this.state.group.name}</ListSubheader> }}
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
							New Person
						</MenuItem>
						<MenuItem onClick={() => this.dialogOpen("Access")}>
							<ListItemIcon>
								<Icon>security</Icon>
							</ListItemIcon>
							Change Access
						</MenuItem>
						<MenuItem onClick={() => this.dialogOpen("Remove")}>
							<ListItemIcon>
								<Icon>delete</Icon>
							</ListItemIcon>
							Remove
						</MenuItem>
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
					<ListDialog
						open={this.state.openDialogNew}
						onClose={() => this.setState({ openDialogNew: false })}
						title="Create Person"
						actionText="Create"
						textLabel="Person Name"
						list={AuthGroup.meta.objects}
						selected={this.state.group.accessGroupIds}
						multiple
						action={(authGroupIds: number[], name: string) => Person.create(name, this.state.group.id, authGroupIds)}
					/>

					{/* Edit access groups dialog */}
					<ListDialog
						open={this.state.openDialogAccess}
						onClose={() => this.dialogClose("Access")}
						title="Edit access groups"
						actionText="Confirm"
						list={AuthGroup.meta.objects}
						selected={this.state.group.accessGroupIds}
						multiple
						action={(authGroupIds: number[]) => this.state.group.updateAccessGroups(authGroupIds, this.state.accessGroupPropagate)}
					>
						<FormControlLabel
							control={<Checkbox checked={this.state.accessGroupPropagate} onChange={event => this.setState({ accessGroupPropagate: event.target.checked })} />}
							label="Propagate to contained people"
						/>
					</ListDialog>

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
