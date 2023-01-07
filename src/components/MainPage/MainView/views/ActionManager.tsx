import { Checkbox, FormControl, FormControlLabel, FormLabel, Icon, ListItemIcon, ListSubheader, Menu, MenuItem, Radio, RadioGroup } from "@material-ui/core";
import React, { Fragment } from "react";
import { Album, AuthGroup, Face, FileObject, Person, PersonGroup } from "../../../../models";
import { RotateDirection } from "../../../../models/FileObject";
import { promiseChain } from "../../../../utils";
import { addressRootTypes } from "../../../App";
import { ListDialog, SimpleDialog } from "../../../utils";
import GMapDialog from "./GMapDialog";
import SelectionManager from "./SelectionManager";
import { ViewState } from "./View";
import { Database } from "../../../../controllers/Database";

interface ActionManagerProps<S extends ViewState> {
	rootType: addressRootTypes;
	rootId: number;
	selectionManager: SelectionManager<S>;
}

interface ActionManagerState {
	openContextMenu: boolean;
	menuAnchorPos: { top: number; left: number };
	/** Open state of all dialogs */
	openDialogs: {
		album: boolean;
		album_remove: boolean;
		geotag_edit: boolean;
		person_confirm: boolean;
		person_edit: boolean;
		person_unknown: boolean;
		person_not: boolean;
		rotate: boolean;
		access_edit: boolean;
		delete: boolean;
	};
	/** Whether a dialog was closed in the last 200ms */
	justClosed: boolean;
	/** State of additional options within dialogs */
	dialogOptions: {
		album_remove_parents: boolean;
		rotate_direction: RotateDirection;
	};
}

// NOTE may or may not need View in props
export default class ActionManager<S extends ViewState> extends React.Component<ActionManagerProps<S>, ActionManagerState> {
	state = {
		openContextMenu: false,
		menuAnchorPos: null,
		openDialogs: {
			album: false,
			album_remove: false,
			geotag_edit: false,
			person_confirm: false,
			person_edit: false,
			person_unknown: false,
			person_not: false,
			rotate: false,
			access_edit: false,
			delete: false
		},
		justClosed: false,
		dialogOptions: {
			album_remove_parents: false,
			rotate_direction: RotateDirection.Clockwise
		}
	};

	menuOpen = (anchorPos: { top: number; left: number }) => this.setState({ openContextMenu: true, menuAnchorPos: anchorPos });

	menuClose = () => this.setState({ openContextMenu: false });

	shouldComponentUpdate(nextProps: ActionManagerProps<S>, nextState: ActionManagerState) {
		return nextState !== this.state;
	}

	/** Open a dialog from its name */
	dialogOpen = (name: keyof ActionManagerState["openDialogs"]) => this.setState({ openDialogs: { ...this.state.openDialogs, [name]: true } });

	/** Close a dialog from its name */
	private dialogClose = (name: keyof ActionManagerState["openDialogs"]) => {
		this.setState({ openDialogs: { ...this.state.openDialogs, [name]: false }, justClosed: true });
		setTimeout(() => this.setState({ justClosed: false }), 200);
	};

	/** Update the state of an additional dialog option */
	private updateOption(name: keyof ActionManagerState["dialogOptions"], value: any) {
		this.setState({
			dialogOptions: {
				...this.state.dialogOptions,
				[name]: value
			}
		});
	}

	render() {
		let selection = this.props.selectionManager.view.state.selection;

		if (!Database.auth.isLoggedIn()) return null;

		return (
			<Fragment>
				<Menu
					anchorReference="anchorPosition"
					anchorPosition={this.state.menuAnchorPos}
					open={this.state.openContextMenu}
					onClick={this.menuClose}
					onClose={this.menuClose}
					MenuListProps={{ subheader: <ListSubheader>{`${selection.length} ${this.props.selectionManager.modelType}(s)`}</ListSubheader> }}
				>
					{this.props.selectionManager.modelType === "file" && [
						<MenuItem key="album_add" onClick={() => this.dialogOpen("album")}>
							<ListItemIcon>
								<Icon>photo_album</Icon>
							</ListItemIcon>
							Add to Album
						</MenuItem>,
						this.props.rootType === "albums" && (
							<MenuItem key="album_remove" onClick={() => this.dialogOpen("album_remove")}>
								<ListItemIcon>
									<Icon>clear</Icon>
								</ListItemIcon>
								Remove from Album
							</MenuItem>
						),
						<MenuItem key="geotag_edit" onClick={() => this.dialogOpen("geotag_edit")} disabled={!selection.every(id => FileObject.getById(id).type === "image")}>
							<ListItemIcon>
								<Icon>my_location</Icon>
							</ListItemIcon>
							Edit Geotag
						</MenuItem>,
						<MenuItem key="rotate" onClick={() => this.dialogOpen("rotate")} disabled={!selection.every(id => FileObject.getById(id).type === "image")}>
							<ListItemIcon>
								<Icon>rotate_90_degrees_ccw</Icon>
							</ListItemIcon>
							Rotate
						</MenuItem>,
						<MenuItem key="access_edit" onClick={() => this.dialogOpen("access_edit")}>
							<ListItemIcon>
								<Icon>security</Icon>
							</ListItemIcon>
							Change access
						</MenuItem>,
						<MenuItem key="delete" onClick={() => this.dialogOpen("delete")}>
							<ListItemIcon>
								<Icon>delete</Icon>
							</ListItemIcon>
							Toggle deletion mark
						</MenuItem>,
						<MenuItem key="download" onClick={() => FileObject.download(selection)}>
							<ListItemIcon>
								<Icon>download</Icon>
							</ListItemIcon>
							Download file(s)
						</MenuItem>
					]}

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
						</MenuItem>,

						<MenuItem key="mark_unknown" onClick={() => this.dialogOpen("person_unknown")}>
							<ListItemIcon>
								<Icon>help</Icon>
							</ListItemIcon>
							Ignore
						</MenuItem>,

						<MenuItem key="mark_nonperson" onClick={() => this.dialogOpen("person_not")}>
							<ListItemIcon>
								<Icon>clear</Icon>
							</ListItemIcon>
							Remove
						</MenuItem>
					]}
				</Menu>

				{this.props.selectionManager.modelType === "file" && (
					<Fragment>
						{/* Add to album dialog */}
						<ListDialog
							open={this.state.openDialogs.album}
							onClose={() => this.dialogClose("album")}
							title="Add file(s) to album"
							actionText="Add"
							list={Album.rootAlbums}
							openByDefault={true}
							action={(albumId: number[]) => Album.getById(albumId[0]).addFiles(selection)}
						/>

						{this.props.rootType === "albums" && (
							/* Remove from album dialog */
							<SimpleDialog
								open={this.state.openDialogs.album_remove}
								onClose={() => this.dialogClose("album_remove")}
								title="Remove file(s) from album"
								actionText="Confirm"
								text={`Are you sure you want to remove ${selection.length} file(s) from the album ${Album.getById(this.props.rootId).name}?`}
								action={() => Album.getById(this.props.rootId).removeFiles(selection, this.state.dialogOptions.album_remove_parents)}
							>
								<FormControlLabel
									control={
										<Checkbox
											color="primary"
											checked={this.state.dialogOptions.album_remove_parents}
											onChange={event => this.updateOption("album_remove_parents", event.target.checked)}
										/>
									}
									label="Remove from parent albums"
									title="If checked, file(s) will be removed entirely from any parent albums (in which they also appear). Otherwise, file(s) will remain in the parent album(s)."
									labelPlacement="end"
								/>
							</SimpleDialog>
						)}

						{/* Edit geotag dialog */}
						<GMapDialog open={this.state.openDialogs.geotag_edit} onClose={() => this.dialogClose("geotag_edit")} fileIds={selection} />

						{/* Rotate image dialog */}
						<SimpleDialog
							open={this.state.openDialogs.rotate}
							onClose={() => this.dialogClose("rotate")}
							title="Rotate image(s)"
							actionText="Confirm"
							text={`Select direction to rotate ${selection.length} file(s).`}
							action={() =>
								promiseChain(selection, (resolve, reject, id) =>
									FileObject.getById(id)
										.rotate(this.state.dialogOptions.rotate_direction)
										.then(resolve)
										.catch(reject)
								)
							}
						>
							<FormControl component="fieldset">
								<FormLabel component="legend">Direction</FormLabel>
								<RadioGroup
									value={this.state.dialogOptions.rotate_direction}
									onChange={event => this.updateOption("rotate_direction", (event.currentTarget as HTMLInputElement).value)}
								>
									<FormControlLabel
										value={RotateDirection.Clockwise}
										control={<Radio />}
										label={
											<Fragment>
												Clockwise<Icon>rotate_right</Icon>
											</Fragment>
										}
									/>
									<FormControlLabel
										value={RotateDirection.Anticlockwise}
										control={<Radio />}
										label={
											<Fragment>
												Anti-clockwise<Icon>rotate_left</Icon>
											</Fragment>
										}
									/>
								</RadioGroup>
							</FormControl>
						</SimpleDialog>

						{/* Edit access permissions */}
						<ListDialog
							open={this.state.openDialogs.access_edit}
							onClose={() => this.dialogClose("access_edit")}
							title="Edit access to file(s)"
							actionText="Confirm"
							list={AuthGroup.meta.objects}
							selected={(() => {
								if (!selection.length) return [];
								let first = FileObject.getById(selection[0]).accessGroupIds;
								let firstString = first.sort().toString();
								let allSame = selection.map(id => FileObject.getById(id).accessGroupIds).every(arr => arr.sort().toString() === firstString);
								if (allSame) return first;
								return [];
							})()}
							multiple
							action={(authGroupIds: number[]) =>
								promiseChain(selection, (resolve, reject, id) =>
									FileObject.getById(id)
										.updateSave({ access_groups: authGroupIds })
										.then(resolve)
										.catch(reject)
								)
							}
						/>

						{/* Mark as deleted */}
						<SimpleDialog
							open={this.state.openDialogs.delete}
							onClose={() => this.dialogClose("delete")}
							title="Toggle file(s) as marked for deletion"
							actionText="Confirm"
							text={`Are you sure you want to toggle whether ${selection.length} file(s) are marked as deleted?`}
							action={() =>
								promiseChain(selection, (resolve, reject, id) =>
									FileObject.getById(id)
										.updateSave({ is_deleted: !FileObject.getById(id).is_deleted })
										.then(resolve)
										.catch(reject)
								)
							}
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
							list={PersonGroup.meta.objects.map(group => ({
								id: group.id,
								name: group.name,
								noSelect: true,
								children: group.people.map(person => ({ id: person.id, name: person.full_name }))
							}))}
							action={(personId: number[]) =>
								promiseChain(selection, (resolve, reject, id) =>
									Face.getById(id)
										.setPerson(personId[0])
										.then(resolve)
										.catch(reject)
								).then(() => Person.getById(personId[0]).resetData())
							}
						/>

						{/* Ignore faces dialog */}
						<SimpleDialog
							open={this.state.openDialogs.person_unknown}
							onClose={() => this.dialogClose("person_unknown")}
							title="Ignore face(s)"
							actionText="Confirm"
							text={`Are you sure you want to mark ${selection.length} face(s) as belonging to stranger(s)? They will no longer be visible.`}
							action={() =>
								promiseChain(selection, (resolve, reject, id) =>
									Face.getById(id)
										.setStatus(4)
										.then(resolve)
										.catch(reject)
								)
							}
						/>

						{/* Remove faces dialog */}
						<SimpleDialog
							open={this.state.openDialogs.person_not}
							onClose={() => this.dialogClose("person_not")}
							title="Remove face(s)"
							actionText="Confirm"
							text={`Are you sure you want to mark ${selection.length} face(s) as being non-human objects? They will no longer be visible.`}
							action={() =>
								promiseChain(selection, (resolve, reject, id) =>
									Face.getById(id)
										.setStatus(5)
										.then(resolve)
										.catch(reject)
								)
							}
						/>
					</Fragment>
				)}
			</Fragment>
		);
	}
}
