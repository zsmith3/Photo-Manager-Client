import List from "@material-ui/core/List";
import React, { Fragment } from "react";
import { Person, PersonGroup } from "../../../models";
import { MountTrackedComponent, TextDialog } from "../../utils";
import PersonListItem from "./PersonListItem";

/** List of Person instances (within a PersonGroup) */
export default class PersonList extends MountTrackedComponent<{
	groupId?: number;
}> {
	state = {
		personIds: []
	};

	constructor(props) {
		super(props);

		Person.registerListUpdateHandler((people: Person[]) => {
			this.setStateSafe({
				personIds: people.filter((person: Person) => this.props.groupId === undefined || person.group.id === this.props.groupId).map((person: Person) => person.id)
			});
		});
	}

	render() {
		return (
			<List>
				{this.state.personIds.map(personId => (
					<PersonListItem key={personId} personId={personId} />
				))}
			</List>
		);
	}
}
