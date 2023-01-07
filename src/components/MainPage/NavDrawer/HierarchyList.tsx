import { List, ListSubheader, Typography } from "@material-ui/core";
import React, { Fragment } from "react";
import { Model } from "../../../models";
import { MountTrackedComponent } from "../../utils";

/** Base class for Album and Folder lists (for root or child items) */
export default abstract class HierarchyList<M extends Model & { parent: M }> extends MountTrackedComponent<{ parentID?: number; indent?: number; height?: string }> {
	/** Hack to access subclass */
	class: typeof HierarchyList;

	/** Model subclass */
	static modelType: typeof Model;

	/** Component to use for list items */
	static listItemComponent: React.ComponentType<{ modelId: number; indent?: number }>;

	/** Display name for model type */
	static modelTypeName: string;

	state = {
		modelIds: []
	};

	constructor(props) {
		super(props);

		this.class = this.constructor as typeof HierarchyList;
		this.class.modelType.registerListUpdateHandler((items: M[]) => {
			this.setStateSafe({
				modelIds: items
					// Note: in the root list, we include items with a parent which is either null (ie root items)
					// or undefined (ie their parent is not accessible to the user)
					.filter((item: M) => (this.props.parentID === undefined ? !item.parent : item.parent && item.parent.id === this.props.parentID))
					.map((item: M) => item.id)
			});
		});
	}

	/** Render a button in the right of the list header */
	renderHeaderButton() {}

	render() {
		return (
			<Fragment>
				<List
					style={{ ...(this.props.height ? { height: this.props.height, overflowY: "auto" } : {}), ...(this.props.indent ? { padding: 0 } : {}) }}
					subheader={
						this.props.parentID === undefined ? (
							<ListSubheader style={{ backgroundColor: "white" }}>
								{this.class.modelTypeName}s{this.renderHeaderButton()}
							</ListSubheader>
						) : null
					}
				>
					<Fragment>
						{this.state.modelIds.map(modelId => (
							<this.class.listItemComponent key={modelId} modelId={modelId} indent={this.props.indent || 0} />
						))}
						{this.state.modelIds.length > 0 || (
							<Typography variant="body2" style={{ marginLeft: 40 }}>
								No {this.class.modelTypeName.toLowerCase()}s here.
							</Typography>
						)}
					</Fragment>
				</List>
			</Fragment>
		);
	}
}
