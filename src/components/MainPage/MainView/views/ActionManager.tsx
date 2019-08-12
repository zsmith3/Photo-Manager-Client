import { Icon, ListItemIcon, ListSubheader, Menu, MenuItem, MenuList } from "@material-ui/core";
import React, { Fragment } from "react";
import { Album, Face, Person } from "../../../../models";
import { promiseChain } from "../../../../utils";
import { addressRootTypes } from "../../../App";
import { ListDialog, SimpleDialog } from "../../../utils";
import SelectionManager from "./SelectionManager";
import { ViewState } from "./View";

interface ActionManagerProps<S extends ViewState> {
	rootType: addressRootTypes;
	selectionManager: SelectionManager<S>;
}

interface ActionManagerState {
	openContextMenu: boolean;
	menuAnchorPos: { top: number; left: number };
	/** Open state of all dialogs */
	openDialogs: {
		album: boolean;
		person_confirm: boolean;
		person_edit: boolean;
	};
}

// NOTE may or may not need View in props
export default class ActionManager<S extends ViewState> extends React.Component<ActionManagerProps<S>, ActionManagerState> {
	state = {
		openContextMenu: false,
		menuAnchorPos: null,
		openDialogs: {
			album: false,
			person_confirm: false,
			person_edit: false
		}
	};

	// TODO call this from within view
	menuOpen = (anchorPos: { top: number; left: number }) => this.setState({ openContextMenu: true, menuAnchorPos: anchorPos });

	menuClose = () => this.setState({ openContextMenu: false });

	shouldComponentUpdate(nextProps: ActionManagerProps<S>, nextState: ActionManagerState) {
		return nextState !== this.state;
	}

	/** Open a dialog from its name */
	private dialogOpen = (name: keyof ActionManagerState["openDialogs"]) => this.setState({ openDialogs: { ...this.state.openDialogs, [name]: true } });

	/** Close a dialog from its name */
	private dialogClose = (name: keyof ActionManagerState["openDialogs"]) => this.setState({ openDialogs: { ...this.state.openDialogs, [name]: false } });

	render() {
		let selection = this.props.selectionManager.view.state.selection;

		return (
			<Fragment>
				<Menu anchorReference="anchorPosition" anchorPosition={this.state.menuAnchorPos} open={this.state.openContextMenu} onClick={this.menuClose} onClose={this.menuClose}>
					<MenuList subheader={<ListSubheader style={{ lineHeight: "24px" }}>{`${selection.length} ${this.props.selectionManager.modelType}(s)`}</ListSubheader>}>
						{this.props.selectionManager.modelType === "file" && (
							<MenuItem onClick={() => this.dialogOpen("album")}>
								<ListItemIcon>
									<Icon>photo_album</Icon>
								</ListItemIcon>
								Add to Album
							</MenuItem>
						)}

						{this.props.selectionManager.modelType === "face" && [
							<MenuItem
								key="confirm_id"
								onClick={() => this.dialogOpen("person_confirm")}
								disabled={
									selection.find(id => {
										let face = Face.getById(id);
										return face.personID !== 0 && face.status > 1;
									}) === undefined
								}
							>
								<ListItemIcon>
									<Icon>check</Icon>
								</ListItemIcon>
								Confirm Identification
							</MenuItem>,

							<MenuItem key="edit_id" onClick={() => this.dialogOpen("person_edit")}>
								<ListItemIcon>
									<Icon>edit</Icon>
								</ListItemIcon>
								Set/Edit Identification
							</MenuItem>
						]}
					</MenuList>
				</Menu>

				{this.props.selectionManager.modelType === "file" && (
					<Fragment>
						{/* Add to album dialog */}
						<ListDialog
							open={this.state.openDialogs.album}
							onClose={() => this.dialogClose("album")}
							title="Add file(s) to album"
							actionText="Add"
							list={Album.meta.objects.map(album => ({
								id: album.id,
								name: album.path
							}))}
							action={(albumId: number) => Album.getById(albumId).addFiles(selection)}
						/>
					</Fragment>
				)}

				{this.props.selectionManager.modelType === "face" && (
					<Fragment>
						{/* Confirm person dialog */}
						<SimpleDialog
							open={this.state.openDialogs.person_confirm}
							onClose={() => this.dialogClose("person_confirm")}
							title="Confirm identification of face(s)"
							actionText="Confirm"
							text={`Are you sure you want to confirm identification of ${selection.length} face(s)?`}
							action={() =>
								promiseChain(selection, (resolve, reject, id) =>
									Face.getById(id)
										.setStatus(1)
										.then(resolve)
										.catch(reject)
								)
							}
						/>

						{/* Change person dialog */}
						<ListDialog
							open={this.state.openDialogs.person_edit}
							onClose={() => this.dialogClose("person_edit")}
							title="Edit identification of face(s)"
							actionText="Change Person"
							list={Person.meta.objects.map(person => ({
								id: person.id,
								name: person.full_name
							}))}
							action={(personId: number) =>
								promiseChain(selection, (resolve, reject, id) =>
									Face.getById(id)
										.setPerson(personId)
										.then(resolve)
										.catch(reject)
								).then(() => Person.getById(personId).resetData())
							}
						/>
					</Fragment>
				)}
			</Fragment>
		);
	}
}
