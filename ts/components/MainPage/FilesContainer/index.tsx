import { GridList, GridListTile, Icon, LinearProgress, ListItemIcon, ListSubheader, Menu, MenuItem, MenuList } from "@material-ui/core";
import React, { ComponentType, Fragment } from "react";
import { Album, Face, Folder, Person } from "../../../models";
import { promiseChain } from "../../../utils";
import { addressRootTypes } from "../../App";
import { ListDialog, SimpleDialog } from "../../utils";
import { GridCardProps } from "./BaseGridCard";
import FaceCard from "./FaceCard";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";

/** Different object selection modes */
export enum SelectMode {
	/** Replace the existing selection with the clicked item (default) */
	Replace = 0,

	/** Toggle whether the clicked item is selected (Ctrl) */
	Toggle = 1,

	/** Select all items between the clicked item and the last item selected (Shift) */
	Extend = 2
}

/** Type for stored data in FilesContainer */
type dataType = {
	/** ID to identify this set of objects */
	id: number,

	/** Display name for object set */
	name: string,

	/** IDs of Model instances to display */
	objectIds: number[],

	/** GridCard component to display for each instance */
	card: ComponentType<GridCardProps>,

	/** List of IDs of selected objects */
	selection?: number[],

	/** ID of last selected object */
	lastSelected?: number
}

/** Grid-based container for displaying Files (and other models) */
export default class FilesContainer extends React.Component<{ rootType: addressRootTypes, rootId: number }> {
	state = {
		/** Storage of this.props to determine when they have been updated */
		props: { rootType: null as addressRootTypes, rootId: null as number },

		/** Data to be displayed, as a list of object sets */
		data: [] as dataType[],

		/** Whether data for the current set of props has been loaded */
		dataLoaded: false,
		
		/** Whether the context menu is open */
		openContextMenu: false,

		/** Current anchor position for the context menu */
		menuAnchorPos: { top: 0, left: 0 },

		/** Open state of all dialogs */
		openDialogs: {
			album: false,

			person_confirm: false,
			person_edit: false
		},

		/** Model selection upon which dialogs should act */
		actionSelection: { setId: null as number, objectIds: [] as number[] }
	}

	constructor (props: { rootType: addressRootTypes, rootId: number }) {
		super(props);

		this.state.props = props;
	}


	/**
	 * Load all data to be displayed, into `this.state` based on `this.props`
	 * @returns Promise representing completion
	 */
	private getData (): Promise<void> {
		return new Promise((resolve, reject) => {
			let complete = (data: dataType[]) => {
				this.setState({ data: data.map(set => Object.assign(set, { selection: [], lastSelected: set.objectIds.length > 0 ? set.objectIds[0] : null })), dataLoaded: true });
				resolve();
			}
	
			switch (this.props.rootType) {
				case "folders":
					if (this.props.rootId === null) {
						Folder.loadFiltered<Folder>({ parent: null }).then(folders => {
							complete([{ id: 1, name: "Folders", objectIds: folders.map(folder => folder.id), card: FolderCard }]);
						});
					} else {
						Folder.loadObject<Folder>(this.props.rootId).then(folder => {
							folder.getContents().then(data => {
								complete([{ id: 1, name: "Folders", objectIds: data.folders.map(folder => folder.id), card: FolderCard }, { id: 2, name: "Files", objectIds: data.files.map(file => file.id), card: FileCard }]);
							}).catch(reject);
						}).catch(reject);
					}
					break;
				case "people":
					Person.loadObject<Person>(this.props.rootId).then(person => {
						let fn = (faces: Face[]) => complete([{ id: 1, name: "Faces", objectIds: faces.map(face => face.id), card: FaceCard }]);
						person.getFaces().then(fn).catch(reject);
						person.faceListUpdateHandlers.push(fn);
					}).catch(reject);
					break;
			}	
		});
	}

	/**
	 * Get menu/dialogs to display based on rootType
	 * @returns Fragment containing menu/dialogs
	 */
	private getPopups (): JSX.Element {
		switch (this.props.rootType) {
			case "folders":
				return <Fragment>
					{/* Context menu */}
					<Menu anchorReference="anchorPosition" anchorPosition={ this.state.menuAnchorPos } open={ this.state.openContextMenu } onClick={ this.menuClose } onClose={ this.menuClose }>
						<MenuList subheader={
							<ListSubheader style={ { lineHeight: "24px" } }>
								{ `${ this.state.actionSelection.objectIds.length } ${ this.state.actionSelection.setId === 1 ? "folder" : "file" }(s)` }
							</ListSubheader>
						}>
							{ this.state.actionSelection.setId === 2 &&
							<MenuItem onClick={ () => this.dialogOpen("album") }><ListItemIcon><Icon>photo_album</Icon></ListItemIcon>Add to Album</MenuItem>
							}
						</MenuList>
					</Menu>

					{/* Add to album dialog */}
					<ListDialog
						open={ this.state.openDialogs.album } onClose={ () => this.dialogClose("album") }
						title="Add file(s) to album" actionText="Add"
						list={ Album.meta.objects.map(album => ({ id: album.id, name: album.path })) }
						action={ (albumId: number) => Album.getById(albumId).addFiles(this.state.actionSelection.objectIds) }
					/>
				</Fragment>;
			case "people":
				return <Fragment>
					{/* Context menu */}
					<Menu anchorReference="anchorPosition" anchorPosition={ this.state.menuAnchorPos } open={ this.state.openContextMenu } onClick={ this.menuClose } onClose={ this.menuClose }>
						<MenuList subheader={
							<ListSubheader style={ { lineHeight: "24px" } }>
								{ `${ this.state.actionSelection.objectIds.length } faces` }
							</ListSubheader>
						}>
							<MenuItem onClick={ () => this.dialogOpen("person_confirm") }><ListItemIcon><Icon>check</Icon></ListItemIcon>Confirm Identification</MenuItem>
							<MenuItem onClick={ () => this.dialogOpen("person_edit") }><ListItemIcon><Icon>edit</Icon></ListItemIcon>Edit Identification</MenuItem>
						</MenuList>
					</Menu>

					{/* Confirm person dialog */}
					<SimpleDialog
						open={ this.state.openDialogs.person_confirm } onClose={ () => this.dialogClose("person_confirm") }
						title="Confirm identification of face(s)" actionText="Confirm"
						text={ `Are you sure you want to confirm identification of ${ this.state.actionSelection.objectIds.length } faces?` }
						action={ () => promiseChain(this.state.actionSelection.objectIds, (resolve, reject, id) => Face.getById(id).setStatus(1).then(resolve).catch(reject)) }
					/>

					{/* Change person dialog */}
					<ListDialog
						open={ this.state.openDialogs.person_edit } onClose={ () => this.dialogClose("person_edit") }
						title="Edit identification of face(s)" actionText="Change Person"
						list={ Person.meta.objects.map(person => ({ id: person.id, name: person.full_name })) }
						action={ (personId: number) =>  promiseChain(this.state.actionSelection.objectIds, (resolve, reject, id) => Face.getById(id).setPerson(personId).then(resolve).catch(reject)) }
					/>
				</Fragment>;
		}
	}

	/**
	 * Select or deselect a single object
	 * @param setId ID of the set to which the object belongs
	 * @param modelId ID of the object to select
	 * @param mode Selection mode to use (replace, toggle or extend)
	 */
	private select (setId: number, modelId: number, mode: SelectMode) {
		let data = this.state.data.map(set => {
			let resolve = (selection: number[]) => Object.assign(set, { selection: selection, lastSelected: modelId });
			if (set.id === setId) {
				switch (mode) {
					case SelectMode.Replace:
						return resolve([ modelId ]);
					case SelectMode.Toggle:
						if (set.selection.includes(modelId)) return resolve(set.selection.filter(id => id !== modelId));
						else return resolve(set.selection.concat([ modelId ]));
					case SelectMode.Extend:
						let first = set.objectIds.indexOf(set.lastSelected);
						let second = set.objectIds.indexOf(modelId);
						let selection = [];
						for (let i = Math.min(first, second); i <= Math.max(first, second); i++) selection.push(set.objectIds[i]);
						return resolve(selection);
				}
			} else return Object.assign(set, { selection: [] });
		});
		this.setState({ data: data });
	}

	/**
	 * Select or deselect all objects
	 * @param value Whether to select or deselect all objects (true => select)
	 */
	private selectAll (value: boolean) {
		let data = this.state.data.map(set => {
			if (value) return Object.assign(set, { selection: set.objectIds });
			else return Object.assign(set, { selection: [] });
		});
		this.setState({ data: data });
	}

	/**
	 * Open the context menu
	 * @param setId ID of selected object set
	 * @param modelId ID of model which was right-clicked
	 * @param anchorPos Anchor position for the menu (right-click event location)
	 */
	private menuOpen (setId: number, modelId: number, anchorPos: { top: number, left: number }) {
		let selection = this.state.data.find(set => set.id === setId).selection;
		this.setState({
			openContextMenu: true,
			menuAnchorPos: anchorPos,
			actionSelection: { setId: setId, objectIds: selection.length > 0 ? selection : [ modelId ] }
		});
	}

	/** Close context menu */
	private menuClose = () => { this.setState({ openContextMenu: false}) }

	/** Open a dialog from its name */
	private dialogOpen = (type) => this.setState({ openDialogs: { ...this.state.openDialogs, [type]: true } });

	/** Close a dialog from its name */
	private dialogClose = (type) => this.setState({ openDialogs: { ...this.state.openDialogs, [type]: false } }) // loading: false })


	render () {
		let scale = 150;

		if (this.state.props != this.props) {
			this.state.dataLoaded = false;
			this.state.props = this.props;
		}

		if (this.state.dataLoaded) {
			return <Fragment>
					<GridList cols={ 1 } cellHeight={ 100 /* TODO */ } spacing={ 10 } style={ { margin: 0, padding: 10 } } onClick={ () => this.selectAll(false) }>
						{ this.state.data.map(objectSet => {
							let title = objectSet.objectIds.length > 0 && <GridListTile key="childrenSubheader" cols={ 1 } style={ { height: "auto" } }>
								<ListSubheader component="div">{ objectSet.name }</ListSubheader>
							</GridListTile>;

							let cards = objectSet.objectIds.map(objectId => (
								<objectSet.card key={ `${ objectSet.id }_${ objectId }` }
									modelId={ objectId }
									selected={ objectSet.selection.includes(objectId) }
									onSelect={ this.select.bind(this, objectSet.id, objectId) }
									onMenu={ this.menuOpen.bind(this, objectSet.id, objectId) }
									scale={ scale } />
							));

							return [title].concat(cards);
						}) }
					</GridList>

					{ this.getPopups() }
				</Fragment>;
		} else {
			this.getData();
			return <LinearProgress />;
		}
	}
}
