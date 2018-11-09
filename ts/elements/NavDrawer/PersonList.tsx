import React from "react";
import List from "@material-ui/core/List";
import PersonListItem from "./PersonListItem";

export default class PersonList extends React.Component<{personIds: number[]}> {
	render () {
		return <List>
			{this.props.personIds.map(personId => (
				<PersonListItem key={personId} personId={personId} />
			))}
			</List>;
	}
}
