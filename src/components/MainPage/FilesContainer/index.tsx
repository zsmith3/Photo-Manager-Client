import { Icon, IconButton, LinearProgress, ListItemIcon, ListSubheader, Menu, MenuItem, MenuList, Theme, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import { Slider } from "@material-ui/lab";
import React, { Fragment } from "react";
import { Grid } from "react-virtualized";
import { Input } from "../../../controllers/Input";
import { Platform } from "../../../controllers/Platform";
import { Album, Face, FileObject, Folder, Person } from "../../../models";
import { promiseChain } from "../../../utils";
import { addressRootTypes } from "../../App";
import { ListDialog, LocationManager, SimpleDialog, MountTrackedComponent } from "../../utils";
import { navDrawerWidth } from "../NavDrawer";
import BaseGridCard, { GridCardExport } from "./BaseGridCard";
import FaceCard from "./FaceCard";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";
import ImageModal from "./ImageModal";

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
	card: GridCardExport,

	/** List of IDs of selected objects */
	selection?: number[],

	/** ID of last selected object */
	lastSelected?: number,

	/** `this.select` bound to this object set, for caching */
	onSelect?: (modelId: number, mode: SelectMode) => void,

	/** `this.menuOpen` bound to this object set, for caching */
	onMenu?: (modelId: number, anchorPos: { top: number, left: number }) => void
}

/** Grid-based container for displaying Files (and other models) */
class FilesContainer extends MountTrackedComponent<{ rootType: addressRootTypes, rootId: number, searchQuery: string, offsetTop: number, classes: { container: string, contextMenuButton: string, scaleSlider: string, subheader: string, grid: string }, width: Breakpoint }> {
	static styles = (theme: Theme) => ({
		container: {
			margin: 5,
			marginBottom: 0,
			overflowY: "auto" as "auto",
			overflowX: "hidden" as "hidden"
		},
		contextMenuButton: {
			float: "right" as "right"
		},
		scaleSlider: {
			margin: 20,
			[theme.breakpoints.up("md")]: {
				width: 200
			},
			[theme.breakpoints.down("sm")]: {
				width: "calc(100% - 40px)"
			}
		},
		subheader: {
			backgroundColor: theme.palette.background.default
		},
		grid: {
			overflowX: "hidden" as "hidden",
			paddingBottom: 10
		}
	})


	state = {
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
		actionSelection: { setId: null as number, objectIds: [] as number[] },

		/** Current user-desired scale (actual scale will be set as a factor of available screen width) */
		currentScale: null as number
	}


	/**
	 * Load all data to be displayed, into `this.state` based on `this.props`
	 * @param props Value of `this.props` to use (defaults to current value of `this.props`)
	 * @returns Promise representing completion
	 */
	private getData (props?: { rootType: addressRootTypes, rootId: number, searchQuery: string }): Promise<void> {
		props = props || this.props;

		return new Promise((resolve, reject) => {
			let complete = (data: dataType[]) => {
				this.setStateSafe({
					data: data.map(set => Object.assign(set, {
						selection: [],
						lastSelected: set.objectIds.length > 0 ? set.objectIds[0] : null,
						onSelect: this.select.bind(this, set.id),
						onMenu: this.menuOpen.bind(this, set.id)
					})),
					dataLoaded: true
				});
				resolve();
			}

			switch (props.rootType) {
				case "folders":
					if (props.rootId === null) {
						Folder.loadFiltered<Folder>({ "parent": null }).then(folders => {
							complete([{ id: 1, name: "Folders", objectIds: folders.map(folder => folder.id), card: FolderCard }]);
						});
					} else {
						Folder.loadObject<Folder>(props.rootId).then(folder => {
							folder.getContents(props.searchQuery).then(data => {
								complete([
									{ id: 1, name: "Folders", objectIds: data.folders.map(folder => folder.id), card: FolderCard },
									{ id: 2, name: "Files", objectIds: data.files.map(file => file.id), card: FileCard }
								]);
							}).catch(reject);
						}).catch(reject);
					}
					break;
				case "people":
					Person.loadObject<Person>(props.rootId).then(person => {
						let fn = (faces: Face[]) => complete([
							{ id: 1, name: "Faces", objectIds: faces.map(face => face.id), card: FaceCard }
						]);
						person.getFaces().then(fn).catch(reject);
						person.faceListUpdateHandlers.push(fn);
					}).catch(reject);
					break;
			}
		});
	}


	// Selection methods

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


	// Menu/dialog methods

	/**
	 * Get menu/dialogs to display based on rootType
	 * @returns Fragment containing menu/dialogs
	 */
	private getPopups (): JSX.Element {
		let selection = this.state.actionSelection;

		switch (this.props.rootType) {
			case "folders":
				return <Fragment>
					{/* Context menu */}
					<Menu anchorReference="anchorPosition" anchorPosition={ this.state.menuAnchorPos } open={ this.state.openContextMenu } onClick={ this.menuClose } onClose={ this.menuClose }>
						<MenuList subheader={
							<ListSubheader style={ { lineHeight: "24px" } }>
								{ `${ selection.objectIds.length } ${ selection.setId === 1 ? "folder" : "file" }(s)` }
							</ListSubheader>
						}>
							{/*  selection.setId === 2 &&
							<MenuItem onClick={ () => this.dialogOpen("album") }><ListItemIcon><Icon>photo_album</Icon></ListItemIcon>Add to Album</MenuItem>
							 */}
						</MenuList>
					</Menu>

					{/* Add to album dialog */}
					<ListDialog
						open={ this.state.openDialogs.album } onClose={ () => this.dialogClose("album") }
						title="Add file(s) to album" actionText="Add"
						list={ Album.meta.objects.map(album => ({ id: album.id, name: album.path })) }
						action={ (albumId: number) => Album.getById(albumId).addFiles(selection.objectIds) }
					/>
				</Fragment>;
			case "people":
				return <Fragment>
					{/* Context menu */}
					<Menu anchorReference="anchorPosition" anchorPosition={ this.state.menuAnchorPos } open={ this.state.openContextMenu } onClick={ this.menuClose } onClose={ this.menuClose }>
						<MenuList subheader={
							<ListSubheader style={ { lineHeight: "24px" } }>
								{ `${ selection.objectIds.length } faces` }
							</ListSubheader>
						}>
							<MenuItem onClick={ () => this.dialogOpen("person_confirm") } disabled={ selection.objectIds.find(id => { let face = Face.getById(id); return face.personID !== 0 && face.status > 1; }) === undefined }>
								<ListItemIcon><Icon>check</Icon></ListItemIcon>
								Confirm Identification
							</MenuItem>

							<MenuItem onClick={ () => this.dialogOpen("person_edit") }>
								<ListItemIcon><Icon>edit</Icon></ListItemIcon>
								Set/Edit Identification
							</MenuItem>
						</MenuList>
					</Menu>

					{/* Confirm person dialog */}
					<SimpleDialog
						open={ this.state.openDialogs.person_confirm } onClose={ () => this.dialogClose("person_confirm") }
						title="Confirm identification of face(s)" actionText="Confirm"
						text={ `Are you sure you want to confirm identification of ${ selection.objectIds.length } faces?` }
						action={ () => promiseChain(selection.objectIds, (resolve, reject, id) => Face.getById(id).setStatus(1).then(resolve).catch(reject)) }
					/>

					{/* Change person dialog */}
					<ListDialog
						open={ this.state.openDialogs.person_edit } onClose={ () => this.dialogClose("person_edit") }
						title="Edit identification of face(s)" actionText="Change Person"
						list={ Person.meta.objects.map(person => ({ id: person.id, name: person.full_name })) }
						action={ (personId: number) =>  promiseChain(selection.objectIds, (resolve, reject, id) => Face.getById(id).setPerson(personId).then(resolve).catch(reject)) }
					/>
				</Fragment>;
		}
	}

	/**
	 * Open the context menu
	 * @param setId ID of selected object set
	 * @param modelId ID of model which was right-clicked
	 * @param anchorPos Anchor position for the menu (right-click event location)
	 */
	private menuOpen (setId: number, modelId: number, anchorPos: { top: number, left: number }) {
		let selection = this.state.data.find(set => set.id === setId).selection;

		if (modelId !== null && !selection.includes(modelId)) {
			this.select(setId, modelId, SelectMode.Replace);
			selection = [ modelId ];
		}

		this.setState({
			openContextMenu: true,
			menuAnchorPos: anchorPos,
			actionSelection: { setId: setId, objectIds: selection }
		});
	}

	/** Close context menu */
	private menuClose = () => { this.setState({ openContextMenu: false}) }

	/** Open a dialog from its name */
	private dialogOpen = (type) => this.setState({ openDialogs: { ...this.state.openDialogs, [type]: true } });

	/** Close a dialog from its name */
	private dialogClose = (type) => this.setState({ openDialogs: { ...this.state.openDialogs, [type]: false } }) // loading: false })


	// ImageModal (item selection) methods

	/**
	 * Get the next/previous object in one of the sets
	 * @param setId The set of objects to search
	 * @param currentId The ID of the current object
	 * @param direction +1 for next object, -1 for previous object
	 * @param filter Function to filter valid objects
	 * @returns The ID of the chosen adjacent object
	 */
	getAdjacentItem (setId: number, currentId: number, direction: (-1 | 1), filter?: (id: number) => boolean): number {
		let set = this.state.data.find(set => set.id === setId);
		if (!set) return null;

		let objectIds = set.objectIds;
		if (filter) objectIds = objectIds.filter(filter);

		let currentIndex = objectIds.indexOf(currentId);
		let nextIndex = currentIndex + direction;
		if (nextIndex < 0 || nextIndex >= objectIds.length) return null;
		else return objectIds[nextIndex];
	}

	/**
	 * Get the ID of the currently open item (file or face)
	 * @returns ID of item, or `null` if none is open
	 */
	getOpenItemId (): number {
		switch (this.props.rootType) {
			case "folders":
				let fileId = parseInt(LocationManager.currentQuery.get("file"));
				if (FileObject.getById(fileId)) return fileId;
				else return null;
			case "people":
				let faceId = parseInt(LocationManager.currentQuery.get("face"));
				if (Face.getById(faceId)) return faceId;
				else return null;
		}
	}

	/**
	 * Get the next/previous object to the currently open file
	 * @param direction +1 for next object, -1 for previous object
	 * @returns ID of chosen object
	 */
	getAdjacentFileId (direction: (-1 | 1)): number {
		switch (this.props.rootType) {
			case "folders":
				let fileId = parseInt(LocationManager.currentQuery.get("file"));
				return this.getAdjacentItem(2, fileId, direction, id => FileObject.getById(id).type === "image");
			case "people":
				let faceId = parseInt(LocationManager.currentQuery.get("face"));
				let faceFileId = Face.getById(faceId).fileID;
				return this.getAdjacentItem(1, faceId, direction, id => id === faceId || Face.getById(id).fileID !== faceFileId);
		}
	}


	// Scaling methods

	/** Get the total available display width for container */
	getTotalWidth (): number {
		const margin = 10;
		return window.innerWidth - (isWidthUp("md", this.props.width) ? navDrawerWidth : 0) - margin;
	}

	/** Get the total available display height for container */
	getTotalHeight (): number {
		const sliderHeight = 20;
		return window.innerHeight - this.props.offsetTop - sliderHeight;
	}

	/** Get default/range for scale, based on root type */
	getScaleConfig (): { max: number, min: number, default: number } {
		switch (this.props.rootType) {
			case "folders":
				return { max: 300, min: 50, default: 150 };
			case "people":
				return { max: 160, min: 40, default: 80 };
		}
	}

	/**
	 * Get required scale for an item count
	 * @param count The number of GridCard items which should fit on one row
	 * @returns The required width of each GridCard
	 */
	getScaleFromCount (count: number) {
		let margin = BaseGridCard.margin * 2;
		let width = this.getTotalWidth();
		return width / count - margin;
	}

	/**
	 * Get count resulting from a scale
	 * @param scale The desired width of each GridCard item
	 * @returns The (rounded) number of GridCard items which will fit on one row
	 */
	getCountFromScale (scale: number) {
		let margin = BaseGridCard.margin * 2;
		let width = this.getTotalWidth();
		return Math.max(Math.floor(width / (scale + margin)), 1);
	}

	/** Get the current display scale (based on the current user-desired scale) */
	getCurrentScale () {
		let count = this.getCountFromScale(this.state.currentScale);
		let newScale = this.getScaleFromCount(count);
		return newScale;
	}

	/** The Slider (range input) element to modify scale */
	getScaleSlider () {
		const config = this.getScaleConfig();

		let minCount = this.getCountFromScale(config.max);
		let maxCount = this.getCountFromScale(config.min);
		let defaultCount = this.getCountFromScale(config.default);

		if (this.state.currentScale === null) this.state.currentScale = config.default;

		return <Slider
			className={ this.props.classes.scaleSlider }
			value={ -this.getCountFromScale(this.state.currentScale) }
			min={ -maxCount }
			max={ -minCount }
			step={ 1 }
			onChange={ (event, value) => this.setState({ currentScale: this.getScaleFromCount(-value) }) }
			onDoubleClick={ event => this.setState({ currentScale: this.getScaleFromCount(defaultCount) }) } />;
	}


	// Component methods

	constructor (props: { rootType: addressRootTypes, rootId: number, searchQuery: string, offsetTop: number, classes: any, width: Breakpoint }) {
		super(props);

		// TODO this should not be needed as FilesContainer should not be re-constructed
		Platform.mediaQueue.reset();

		// Update scaling on resize
		window.addEventListener("resize", () => { if (this.mounted) this.forceUpdate(); });

		this.getData(props);
	}

	shouldComponentUpdate(nextProps: { rootType: addressRootTypes, rootId: number, searchQuery: string }) {
		// If the view has changed, load new view
		if (nextProps.rootType !== this.props.rootType || nextProps.rootId !== this.props.rootId || nextProps.searchQuery !== this.props.searchQuery) {
			// Reset state
			this.state.dataLoaded = false;
			this.state.currentScale = null;
			Platform.mediaQueue.reset();

			// Fetch new data
			this.getData(nextProps);
		}

		return true;
	}

	render () {
		// ID of item open in ImageModal
		let openItemId = this.getOpenItemId();

		// Whether in selection mode (touch only)
		let selectOnTap = Input.isTouching && this.state.data.filter(set => set.selection.length > 0).length > 0;

		if (this.state.dataLoaded) {
			return <Fragment>
					{/* Scaling slider */}
					{ this.getScaleSlider() }

					{/* Main display grid */}
					<div className={ this.props.classes.container } style={ { height: this.getTotalHeight() } } onClick={ () => this.selectAll(false) }>
						{ this.state.data.map(objectSet => {
							// Actual item GridCards to display
							let allCards = objectSet.objectIds.map(objectId => (
								<objectSet.card.component key={ `${ objectSet.id }_${ objectId }` }
									modelId={ objectId }
									selected={ objectSet.selection.includes(objectId) }
									selectOnTap={ selectOnTap }
									onSelect={ objectSet.onSelect }
									onMenu={ objectSet.onMenu }
									scale={ this.getCurrentScale() } />
							));

							// Sizing calculations
							let cardSize = objectSet.card.getSize(this.getCurrentScale(), this.props.width);
							let cellSize = { width: cardSize.width + BaseGridCard.margin * 2, height: cardSize.height + BaseGridCard.margin * 2 };
							let columnCount = this.getCountFromScale(cardSize.width);
							let rowCount = Math.ceil(allCards.length / columnCount);
							let contentHeight = rowCount * cellSize.height + 10;
							let gridHeight = isWidthUp("md", this.props.width) ? contentHeight : Math.min(contentHeight, this.getTotalHeight() - 48);

							return objectSet.objectIds.length > 0 &&
								<Fragment key={ objectSet.id }>
									{/* Object set title */}
									<ListSubheader component="div" className={ this.props.classes.subheader }>
										{ objectSet.name }
										{ selectOnTap && <span className={ this.props.classes.contextMenuButton }>
											<IconButton onClick={ event => { event.stopPropagation(); objectSet.onMenu(null, { left: event.clientX, top: event.clientY }); } }>
												<Icon>more_vert</Icon>
											</IconButton>
										</span> }
									</ListSubheader>

									{/* Card Grid */}
									<Grid
										className={ this.props.classes.grid }
										width={ this.getTotalWidth() }
										height={ gridHeight }
										rowCount={ rowCount }
										rowHeight={ cellSize.height }
										columnCount={ columnCount }
										columnWidth={ cellSize.width }
										cellRenderer={ (props: { columnIndex, isScrolling, isVisible, key, parent, rowIndex, style }) => (
											<div key={ props.key } style={ props.style }>
												{ allCards[ props.rowIndex * columnCount + props.columnIndex ] }
											</div>
										) }
									/>
								</Fragment>;
						}) }
					</div>

					{/* Context menu and dialogs */}
					{ this.getPopups() }

					{/* ImageModal to display individual image files */}
					{ (openItemId !== null) &&
						<ImageModal type={ this.props.rootType === "people" ? "face" : "file" } itemId={ openItemId } lastItemId={ this.getAdjacentFileId(-1) } nextItemId={ this.getAdjacentFileId(1) } />
					}
				</Fragment>;
		} else {
			// Loading bar when data for current view not yet loaded
			return <LinearProgress />;
		}
	}
}

export default withWidth()(withStyles(FilesContainer.styles)(FilesContainer));
