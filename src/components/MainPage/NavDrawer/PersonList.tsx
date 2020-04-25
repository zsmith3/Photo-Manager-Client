import List from "@material-ui/core/List";
import React from "react";
import { Person } from "../../../models";
import { MountTrackedComponent } from "../../utils";
import PersonListItem from "./PersonListItem";

/** Different ways of sorting people lists */
export enum SortMethods {
	Alphabetical = 0,
	Count = 1
}

/** Comparator functions for sorting people lists */
const SortFunctions = {
	[SortMethods.Alphabetical]: (a: number, b: number) => {
		let personA = Person.getById(a);
		let personB = Person.getById(b);
		if (personA.full_name < personB.full_name) return -1;
		else return 1;
	},
	[SortMethods.Count]: (a: number, b: number) => {
		let personA = Person.getById(a);
		let personB = Person.getById(b);
		if (personA.face_count > personB.face_count) return -1;
		else return 1;
	}
};

/** List of Person instances (within a PersonGroup) */
export default class PersonList extends MountTrackedComponent<{ groupId?: number; sortMethod: SortMethods; visible: boolean }> {
	state = {
		personIds: [] as number[]
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
		this.state.personIds.sort(SortFunctions[this.props.sortMethod]);
		return (
			<List>
				{this.state.personIds.map(personId => (
					<PersonListItem key={personId} personId={personId} visible={this.props.visible} />
				))}
			</List>
		);
	}
}
