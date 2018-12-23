import { List, ListSubheader } from "@material-ui/core";
import React, { Fragment } from "react";
import { PersonGroup } from "../../../models";
import PersonGroupListItem from "./PersonGroupListItem";
import { TextDialog, HoverIconButton } from "../../utils";

export default class PersonGroupList extends React.Component {
	state = {
		groupIds: PersonGroup.meta.objects.map(group => group.id),
		openDialogNew: false
    }

    constructor (props) {
        super(props);

        PersonGroup.registerListUpdateHandler((groups: PersonGroup[]) => this.setState({groupIds: groups.map((group: PersonGroup) => group.id)}));
    }

	render () {
		return <Fragment>
				<List subheader={
					<ListSubheader>
						People

						<HoverIconButton action={ () => this.setState({ openDialogNew: true }) } layers={1} style={ { float: "right" } }>
							add
						</HoverIconButton>
					</ListSubheader>
				}>
				{this.state.groupIds.map(groupId => (
					<PersonGroupListItem key={groupId} groupId={groupId} />
				))}
				</List>

				{/* New root album dialog */}
				<TextDialog
					open={ this.state.openDialogNew } onClose={ () => this.setState({ openDialogNew: false }) }
					title="Create Group" actionText="Create"
					label="Group Name"
					action={ (name: string) => PersonGroup.create(name) }
				/>
			</Fragment>;
	}
}
