import List from "@material-ui/core/List";
import React, { Fragment } from "react";
import { Person } from "../../../models";
import { MountTrackedComponent, TextDialog } from "../../utils";
import PersonListItem from "./PersonListItem";

export default class PersonList extends MountTrackedComponent<{ groupId?: number }> {
	state = {
		personIds: []
	}

	constructor (props) {
		super(props);

		Person.registerUpdateHandler((people: Person[]) => {
			let personIds = people.filter((person: Person) => this.props.groupId === undefined || person.group.id === this.props.groupId).map((person: Person) => person.id);
			this.setStateSafe({ personIds: personIds });
		});
	}

	render () {
		return <List>
				{this.state.personIds.map(personId => (
					<PersonListItem key={personId} personId={personId} />
				))}
			</List>;
	}
}
