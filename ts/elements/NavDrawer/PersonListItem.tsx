import React from "react";
import $ from "jquery";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import App from "../../controllers/App";
import { Person } from "../../models/all_models";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";


export default class PersonListItem extends React.Component<{personId: number}> {
	state: {
		person: Person
	}

	constructor (props: {personId: number}) {
		super(props);

        Person.getById(props.personId).registerUpdateHandler((person: Person) => this.setState({person: person}));
        this.state = { person: Person.getById(props.personId) };
	}

	render () {
		return <ListItem button>
                <ListItemAvatar>
                    <Avatar alt={ this.state.person.name } src="" /> {/* TODO src */}
                </ListItemAvatar>

				<a href=""> {/* TODO href */}
					<ListItemText primary={ this.state.person.name } secondary={ this.state.person.face_count + " faces"} />
				</a>

				<IconButton onClick={() => {let el = this; App.app.els.toolBar.confirmAction("delperson", "delete person " + $(this).parent().find(".personListName > span").text(), null, this).then(function () { Person.getById($(el).parent().attr("data-id")).delete(); });}}>
					<Icon>clear</Icon>
				</IconButton>
			</ListItem>;
	}
}
