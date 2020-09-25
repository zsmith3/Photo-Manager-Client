import { Collapse, ListItem, ListItemSecondaryAction, ListItemText } from "@material-ui/core";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { Model } from "../../../models";
import { HoverIconButton, LocationManager, MountTrackedComponent } from "../../utils";

/** Base class for Album and Folder ListItem */
export default abstract class HierarchyListItem<M extends Model & { name: string; path: string; file_count: number; children: M[] }> extends MountTrackedComponent<{
	modelId: number;
	indent?: number;
}> {
	/** Hack to access subclass */
	class: typeof HierarchyListItem;

	/** Model subclass */
	static modelType: typeof Model;

	/** Component to use for children list */
	static listComponent: React.ComponentType<{ parentID?: number; indent?: number }>;

	/** Display name for model type */
	static modelTypeName: string;

	state = {
		model: null as M,
		openCollapse: false
	};

	constructor(props: { modelId: number; indent?: number }) {
		super(props);

		this.class = this.constructor as typeof HierarchyListItem;
		this.updateHandler = this.class.modelType.getById(props.modelId).updateHandlers.register((model: M) => this.setStateSafe({ model: model }));
	}

	/** Render an additional button in the right of the ListItem */
	renderMenuButton() {}

	/** Render popup menu/dialogs */
	renderPopups() {}

	render() {
		return (
			<Fragment>
				{/* Main list item */}
				<ListItem button style={{ padding: 6, paddingLeft: 24 + (this.props.indent || 0) * 16 }}>
					<Link to={LocationManager.getUpdatedLocation(`/${this.class.modelTypeName.toLowerCase()}s/${this.state.model.id}/`, ["page"])}>
						<ListItemText primary={`${this.state.model.name} (${this.state.model.file_count})`} />
					</Link>

					<ListItemSecondaryAction>
						{this.renderMenuButton()}

						{this.state.model.children.length > 0 && (
							<HoverIconButton action={() => this.setState({ openCollapse: !this.state.openCollapse })}>{this.state.openCollapse ? "expand_less" : "expand_more"}</HoverIconButton>
						)}
					</ListItemSecondaryAction>
				</ListItem>

				{/* Nested list of children */}
				{this.state.model.children.length > 0 && (
					<Collapse in={this.state.openCollapse}>
						<this.class.listComponent parentID={this.props.modelId} indent={this.props.indent + 1} />
					</Collapse>
				)}

				{this.renderPopups()}
			</Fragment>
		);
	}
}
