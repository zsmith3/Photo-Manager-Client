import { Collapse, Icon, ListItem, ListItemText } from "@material-ui/core";
import React from "react";
import { PersonGroup } from "../../../models/Person";
import PersonList from "./PersonList";


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
				<ListItemText primary={ this.state.group.name } />
				<Icon>
					{ this.state.open ? "expand_less" : "expand_more" }
				</Icon>
			</ListItem>
			<Collapse in={ this.state.open }>
				<PersonList groupId={ this.props.groupId } />
			</Collapse>
		</Fragment>;
	}
}
