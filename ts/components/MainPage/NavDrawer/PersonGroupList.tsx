import { List, ListSubheader } from "@material-ui/core";
import React from "react";
import { PersonGroup } from "../../../models";
import PersonGroupListItem from "./PersonGroupListItem";

export default class PersonGroupList extends React.Component {
	state = {
		groupIds: PersonGroup.meta.objects.map(group => group.id)
    }

    constructor (props) {
        super(props);

        PersonGroup.registerUpdateHandler((groups: PersonGroup[]) => this.setState({groupIds: groups.map((group: PersonGroup) => group.id)}));
    }

	render () {
		return <List subheader={<ListSubheader>People</ListSubheader>}>
			{this.state.groupIds.map(groupId => (
				<PersonGroupListItem key={groupId} groupId={groupId} />
			))}
			</List>;
	}
}
