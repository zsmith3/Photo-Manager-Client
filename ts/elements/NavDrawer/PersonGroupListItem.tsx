import React from "react";
import { ListItem, ListItemText, Icon, Collapse } from "@material-ui/core";
import PersonList from "./PersonList";
import { Person, PersonGroup } from "../../models/Person";


export default class PersonGroupListItem extends React.Component<{ groupId: number }> {
	state: {
		group: PersonGroup
		open: boolean
	}

	constructor (props: { groupId: number }) {
		super(props);

		PersonGroup.getById(props.groupId).registerUpdateHandler((group: PersonGroup) => this.setState({ group: group }));
		this.state = { group: PersonGroup.getById(props.groupId), open: false };
	}

	render () {
		let Fragment = React.Fragment;
		return <Fragment>
			<ListItem button onClick={ () => this.setState({open: !this.state.open}) }>
				<ListItemText inset primary={ this.state.group.name } />
				<Icon>
					{ this.state.open ? "expand_less" : "expand_more" }
				</Icon>
			</ListItem>
			<Collapse in={ this.state.open }>
				<PersonList personIds={ this.state.group.people.map((person: Person) => person.id) } />
			</Collapse>
		</Fragment>;
	}
}
