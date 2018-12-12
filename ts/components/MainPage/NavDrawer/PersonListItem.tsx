import { Icon, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Menu, MenuItem, withStyles, TextField, List, Radio, MenuList, ListSubheader } from "@material-ui/core";
import React, { Fragment } from "react";
import { Platform } from "../../../controllers/Platform";
import { Person, PersonGroup } from "../../../models";
import { HoverIconButton, SimpleDialog, ListDialog, TextDialog, MountTrackedComponent } from "../../utils";


class PersonListItem extends MountTrackedComponent<{ personId: number, classes: { avatar: string, image: string } }> {
	static style = {
		avatar: {
			marginRight: 10
		},
		image: {
			width: 22,
			height: 28
		}
	}

	state = {
		person: null as Person,
		menuAnchorEl: null,
		openCollapse: true,
		openMenu: false,
		openDialogRename: false,
		openDialogGroup: false,
		openDialogRemove: false,
		loading: false,
		thumbnailSrc: null as string
	}

	constructor (props: { personId: number, classes: { avatar: string, image: string } }) {
		super(props);

		Person.getById(props.personId).registerUpdateHandler((person: Person) => this.setState({person: person}));
		this.state.person = Person.getById(props.personId);

		if (this.state.person.thumbnail !== null) Platform.getImgSrc({ type: "face", id: this.state.person.thumbnail }, "/40/").then(src => this.setState({ thumbnailSrc: src }));
	}

	menuClose = () => { this.setState({ openMenu: false}) }

	menuOpen = (event) => { this.setState({ menuAnchorEl: event.currentTarget, openMenu: true }) }

	dialogOpen = (type) => this.setState({ ["openDialog" + type]: true })

	dialogClose = (type) => this.setStateSafe({ ["openDialog" + type]: false, loading: false })

	render () {
		return <Fragment>
				{/* Main Person list item */}
				<ListItem button>
					<span className={ this.props.classes.avatar }>
						{ this.state.thumbnailSrc ?
							<img className={ this.props.classes.image } src={ this.state.thumbnailSrc } />
							:
							<Icon>face</Icon>
						}
					</span>

					<a href=""> {/* TODO href */}
						<ListItemText primary={ `${this.state.person.full_name} (${this.state.person.face_count})` } />
					</a>

					<ListItemSecondaryAction>
						<HoverIconButton action={ this.menuOpen }>
							more_vert
						</HoverIconButton>
					</ListItemSecondaryAction>
				</ListItem>

				{/* Linked menu and dialogs for modifying person */}
				<Fragment>
					{/* Options menu */}
					<Menu anchorEl={ this.state.menuAnchorEl } open={ this.state.openMenu } onClick={ this.menuClose } onClose={ this.menuClose }>
						<MenuList subheader={ <ListSubheader style={ { lineHeight: "24px" } }>{ this.state.person.full_name }</ListSubheader> }>
							<MenuItem onClick={ () => this.dialogOpen("Rename") }><ListItemIcon><Icon>edit</Icon></ListItemIcon>Rename</MenuItem>
							<MenuItem onClick={ () => this.dialogOpen("Group") }><ListItemIcon><Icon>group</Icon></ListItemIcon>Edit Group</MenuItem>
							<MenuItem onClick={ () => this.dialogOpen("Remove") }><ListItemIcon><Icon>delete</Icon></ListItemIcon>Remove</MenuItem>
						</MenuList>
					</Menu>

					{/* Person rename dialog */}
					<TextDialog
						open={ this.state.openDialogRename } onClose={ () => this.dialogClose("Rename") }
						title="Rename Person" actionText="Rename"
						label="Full Name" defaultValue={ this.state.person.full_name }
						action={ (name: string) => Person.getById(this.props.personId).updateSave({ full_name: name }) }
					/>

					{/* Change group dialog */}
					<ListDialog
						open={ this.state.openDialogGroup } onClose={ () => this.dialogClose("Group") }
						title="Change person group" actionText="Change Group"
						list={ PersonGroup.meta.objects } selected={ this.state.person.group.id }
						action={ (groupId: number) => Person.getById(this.props.personId).updateSave({ group: groupId }).then(() => Person.handleListUpdate()) }
					/>

					{/* Delete person dialog */}
					<SimpleDialog
						open={ this.state.openDialogRemove } onClose={ () => this.dialogClose("Remove") }
						title="Remove Person" text={ <Fragment>Are you sure you want to delete the person <i>{ this.state.person.full_name }</i>?</Fragment> } actionText="Confirm"
						action={ () => Person.getById(this.props.personId).delete() }
					/>
				</Fragment>
			</Fragment>;
	}
}

export default withStyles(PersonListItem.style)(PersonListItem);
