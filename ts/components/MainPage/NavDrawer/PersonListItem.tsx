import { Icon, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Menu, MenuItem, withStyles } from "@material-ui/core";
import React from "react";
import { Platform } from "../../../controllers/Platform";
import { Person } from "../../../models";
import { HoverIconButton } from "../../utils";


class PersonListItem extends React.Component<{ personId: number, classes: { avatar: string, image: string } }> {
	static style = {
		avatar: {
			marginRight: 10
		},
		image: {
			width: 22,
			height: 28
		}
	}

	state: {
		person: Person
		menuOpen: boolean
		menuAnchorEl?
		thumbnailSrc?: string
	}

	constructor (props: { personId: number, classes: { avatar: string, image: string } }) {
		super(props);

        Person.getById(props.personId).registerUpdateHandler((person: Person) => this.setState({person: person}));
		this.state = { person: Person.getById(props.personId), menuOpen: false };

		if (this.state.person.thumbnail !== null) Platform.getImgSrc({ type: "face", id: this.state.person.thumbnail }, "/40/").then((src) => this.setState({ thumbnailSrc: src }));
	}

	menuClose = () => {
		this.setState({ menuOpen: false});
	}

	menuOpen = (event) => {
		this.setState({ menuAnchorEl: event.currentTarget, menuOpen: true });
	}

	render () {
		return <ListItem button>
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

					<Menu anchorEl={ this.state.menuAnchorEl } open={ this.state.menuOpen } onClick={ this.menuClose } onClose={ this.menuClose }>
						<MenuItem onClick={ () => console.log("Rename") }><ListItemIcon><Icon>edit</Icon></ListItemIcon>Rename</MenuItem>
						<MenuItem onClick={ () => console.log("Move") }><ListItemIcon><Icon>group</Icon></ListItemIcon>Edit Group</MenuItem>
						<MenuItem onClick={ () => console.log("Remove") }><ListItemIcon><Icon>delete</Icon></ListItemIcon>Remove</MenuItem>
						{/* TODO actions for these */}
					</Menu>
				</ListItemSecondaryAction>
			</ListItem>;
	}
}

export default withStyles(PersonListItem.style)(PersonListItem);
