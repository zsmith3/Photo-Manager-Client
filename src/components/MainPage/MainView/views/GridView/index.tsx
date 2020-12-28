import { Checkbox, Grid, Icon, IconButton, ListItemIcon, ListSubheader, Menu, MenuItem, Theme, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import React, { Fragment } from "react";
import { List, ListRowProps } from "react-virtualized";
import { Input } from "../../../../../controllers/Input";
import { Face, Model } from "../../../../../models";
import RootModel, { objectSetType } from "../../../../../models/RootModel";
import { LocationManager } from "../../../../utils";
import BaseGridCard, { GridCardExport } from "../../cards/BaseGridCard";
import FileCard from "../../cards/FileCard";
import SelectionManager from "../SelectionManager";
import View, { ViewProps, ViewState } from "../View";
import PaginationDisplay from "./PaginationDisplay";
import ScaleManager from "./ScaleManager";

/** Height of the MUI ListSubheader (used in scaling) */
const listSubHeaderHeight = 48;

/** Data type to store information about GridView rows to be rendered */
interface GridViewRow {
	card: GridCardExport;
	canSelect: boolean;
	scale: number;
	height: number;
	objectIds: number[];
}

/** Data type to store a pre-rendered row (i.e. the top/bottom bars) */
interface StandardRow {
	render: (props: ListRowProps) => JSX.Element;
	height: number;
}

/** Data type for GridView state */
interface GridViewState extends ViewState {
	data: {
		roots: objectSetType | null;
		contents: objectSetType;
	};
	menuOpen: boolean;
	menuAnchorEl: HTMLElement;
	facesUseFileThumbnails: boolean;
}

/** Data type for GridView props */
interface GridViewProps {
	classes: {
		mobileScaleSliderContainer: string;
		scaleSlider: string;
		toolBar: string;
		menuButton: string;
	};
	width: Breakpoint;
}

/** Base View class for standard Grid-based item (e.g. files, faces) display */
export abstract class GridView extends View<GridViewState, GridViewProps> {
	static styles = (theme: Theme) => ({
		mobileScaleSliderContainer: {
			height: 40,
			paddingLeft: "20px"
		},
		scaleSlider: ScaleManager.sliderStyle(theme),
		toolBar: {
			height: 40
		},
		menuButton: {
			float: "right" as "right",
			marginRight: "10px"
		}
	});

	/** The Model to use as a root (the container - e.g. Folder, Person, Album) */
	static rootModelClass: typeof RootModel;

	// Hack to access "this.class"
	class: typeof GridView;

	/** Manager for GridCard scaling */
	scaleManager: ScaleManager;

	/** Ref to virtualised List component */
	virtualList: React.RefObject<List>;

	/** Ref to outer div */
	mainRef: React.RefObject<HTMLDivElement>;

	constructor(props: ViewProps & GridViewProps) {
		super(props);

		this.class = this.constructor as typeof GridView;

		this.state.menuOpen = false;

		this.getData(props);

		this.scaleManager = new ScaleManager(this);
		this.selectionManager = new SelectionManager(
			this,
			() => this.state.data.contents.objectIds,
			() => this.state.data.contents.card.modelType
		);
		this.virtualList = React.createRef<List>();
		this.mainRef = React.createRef<HTMLDivElement>();
	}

	/** Open the display options or selection actions menu */
	menuOpen = event => {
		event.stopPropagation();
		if (Input.isTouching && this.state.selection.length > 0) this.actionManager.current.menuOpen({ left: event.clientX, top: event.clientY });
		else this.setState({ menuAnchorEl: event.currentTarget, menuOpen: true });
	};

	/** Close the display options menu */
	menuClose = () => this.setState({ menuOpen: false });

	/**
	 * Keyboard events (arrow keys to modify selection, ctrl+arrows to change page)
	 * @param event The KeyUp event
	 */
	private onKeyUp = event => {
		if (event.key === "Enter") {
			(this.class.rootModelClass.rootModelMeta.contentsClass.getById(this.selectionManager.lastSelected) as Model & { open: () => any }).open();
		} else if (event.key.substr(0, 5) === "Arrow") {
			if (event.ctrlKey) {
				let maxPage = Math.ceil(this.state.data.contents.count / this.props.pageSize);
				if (event.key == "ArrowLeft") LocationManager.updateQuery({ page: Math.max(this.props.page - 1, 1).toString() });
				else if (event.key == "ArrowRight") LocationManager.updateQuery({ page: Math.min(this.props.page + 1, maxPage).toString() });
			} else {
				let desiredScale = this.state.data.contents.card.getDesiredSize(this.state.currentScale, this.props.width);
				let cardsPerRow = this.scaleManager.getCountFromScale(desiredScale.width);
				let delta = { Left: -1, Right: 1, Up: -cardsPerRow, Down: cardsPerRow }[event.key.substr(5)];
				this.selectionManager.moveSelection(delta);
			}
		}
	};

	private processData(data: { roots: objectSetType | null; contents: objectSetType }): { roots: objectSetType | null; contents: objectSetType } {
		if (this.state.facesUseFileThumbnails && data.contents.card.modelType === "face") {
			data.contents.objectIds = data.contents.objectIds.map(id => Face.getById(id).file.id).filter((v, i, a) => a.indexOf(v) === i);
			data.contents.name = "Files";
			data.contents.card = FileCard;
		}
		return data;
	}

	/**
	 * Load data to be displayed, into `this.state` based on `this.props`
	 * @param props Value of `this.props` to use
	 */
	private async getData(props: ViewProps) {
		if (props.rootId === null) {
			// Load base root objects
			const data = await this.class.rootModelClass.getAbsoluteRoots();
			this.setState({ data: this.processData(data), dataLoaded: true });
		} else {
			// Load children of chosen root object
			const rootObject = await this.class.rootModelClass.loadObject<RootModel>(props.rootId);

			if (this.updateHandler) this.updateHandler.unregister();
			this.updateHandler = rootObject.registerContentsUpdateHandler(
				props.page,
				props.pageSize,
				props.searchQuery,
				this.props.rootType === "folders" ? { isf: this.props.includeSubfolders } : {},
				data => this.setState({ data: this.processData(data), dataLoaded: true }),
				error => {
					if (!(typeof error === "string") && "detail" in error && error.detail === "Invalid page.") LocationManager.updateQuery({ page: "1" });
					else throw error;
				}
			);
		}
	}

	/**
	 * Sort current data into rows, based on scale
	 * @returns List of all rows to render
	 */
	private getRows(): (GridViewRow | string)[] {
		let rows: (GridViewRow | string)[] = [];

		// Function to add rows for a data set
		const addRows = (set: objectSetType | null, select: boolean) => {
			if (set !== null) {
				// Get actual scale for cards in row
				let desiredScale = set.card.getDesiredSize(this.state.currentScale, this.props.width);
				let cardsPerRow = this.scaleManager.getCountFromScale(desiredScale.width);
				let actualWidth = this.scaleManager.getScaleFromCount(cardsPerRow);
				let actualScale = set.card.getDesiredSize(actualWidth, this.props.width);

				if (set.objectIds.length > 0) rows.push(set.name);
				for (let i = 0; i < set.objectIds.length; i += cardsPerRow) {
					rows.push({ card: set.card, canSelect: select, scale: actualScale.width, height: actualScale.height, objectIds: set.objectIds.slice(i, i + cardsPerRow) });
				}
			}
		};

		// Add rows for each data set
		addRows(this.state.data.roots, false);
		addRows(this.state.data.contents, true);

		return rows;
	}

	shouldComponentUpdate(nextProps: ViewProps, nextState: GridViewState) {
		// If scale has changed, recompute grid row heights
		if (nextState.currentScale !== this.state.currentScale) this.scaleManager.recomputeHeight();

		// If the view has changed, load new view
		if (
			nextProps.rootId !== this.props.rootId ||
			nextProps.searchQuery !== this.props.searchQuery ||
			nextProps.includeSubfolders !== this.props.includeSubfolders ||
			nextProps.page !== this.props.page ||
			nextProps.pageSize !== this.props.pageSize ||
			nextState.facesUseFileThumbnails !== this.state.facesUseFileThumbnails
		) {
			this.resetState();

			// Fetch new data
			this.getData(nextProps);

			return false;
		}

		return true;
	}

	componentDidMount() {
		// Set document focus to this on page change
		let interval: NodeJS.Timeout;
		let doFocus = () => {
			if (LocationManager.currentQuery.get("file") || LocationManager.currentQuery.get("face") || LocationManager.currentQuery.get("scan")) {
				// Cancel if ImageModal open
				clearInterval(interval);
			} else if (this.mainRef.current !== null) {
				console.log("refocus");
				this.mainRef.current.focus();
				clearInterval(interval);
			}
		};
		interval = setInterval(doFocus, 100);
		let unlisten = LocationManager.instance.props.history.listen(loc => (interval = setInterval(doFocus, 100)));
		this.componentWillUnmount = () => Boolean(clearInterval(interval)) || unlisten();
	}

	renderContents() {
		const rows: (GridViewRow | string | StandardRow)[] = this.getRows();

		return (
			<div tabIndex={-1} onKeyUp={this.onKeyUp} ref={this.mainRef}>
				{/* Desktop Toolbar */}
				{isWidthUp("md", this.props.width) ? (
					<Grid container className={this.props.classes.toolBar}>
						<Grid item md={3}>
							{/* Scaling slider */}
							{this.scaleManager.render(this.props.classes.scaleSlider)}
						</Grid>
						<Grid item md={this.props.rootType === "folders" || this.props.rootType === "people" ? 8 : 9}>
							{/* Pagination links */}
							<PaginationDisplay page={this.props.page} pageSize={this.props.pageSize} totalCount={this.state.data.contents.count} />
						</Grid>
						{(this.props.rootType === "folders" || this.props.rootType === "people") && (
							<Grid item md={1}>
								<IconButton className={this.props.classes.menuButton} onClick={this.menuOpen}>
									<Icon>more_vert</Icon>
								</IconButton>
							</Grid>
						)}
					</Grid>
				) : (
					<Fragment>
						{/* Mobile toolbars */}
						<Grid container className={this.props.classes.mobileScaleSliderContainer}>
							<Grid item xs={this.state.selection.length > 0 || this.props.rootType === "folders" || this.props.rootType === "people" ? 10 : 12}>
								{this.scaleManager.render(this.props.classes.scaleSlider)}
							</Grid>

							{(this.state.selection.length > 0 || this.props.rootType === "folders" || this.props.rootType === "people") && (
								<Grid item xs={2}>
									<IconButton className={this.props.classes.menuButton} onClick={this.menuOpen}>
										<Icon>more_vert</Icon>
									</IconButton>
								</Grid>
							)}
						</Grid>
						<div className={this.props.classes.toolBar}>
							<PaginationDisplay page={this.props.page} pageSize={this.props.pageSize} totalCount={this.state.data.contents.count} />
						</div>
					</Fragment>
				)}

				{/* Options menu */}
				<Menu
					anchorEl={this.state.menuAnchorEl}
					open={this.state.menuOpen}
					onClick={this.menuClose}
					onClose={this.menuClose}
					MenuListProps={{ subheader: <ListSubheader>Display Options</ListSubheader> }}
				>
					{this.props.rootType === "folders" && (
						<MenuItem onClick={() => LocationManager.updateQuery({ isf: (!this.props.includeSubfolders).toString() })}>
							<ListItemIcon>
								<Checkbox checked={this.props.includeSubfolders} />
							</ListItemIcon>
							Show subfolder contents
						</MenuItem>
					)}

					{this.props.rootType === "people" && (
						<MenuItem onClick={() => this.setState({ facesUseFileThumbnails: !this.state.facesUseFileThumbnails })}>
							<ListItemIcon>
								<Checkbox checked={this.state.facesUseFileThumbnails} />
							</ListItemIcon>
							Show file thumbnails
						</MenuItem>
					)}
				</Menu>

				{/* Main virtualised list */}
				<div onClick={event => !(event.ctrlKey || event.shiftKey) && this.selectionManager.selectAll(false)}>
					<List
						ref={this.virtualList}
						width={this.props.totalWidth}
						height={this.props.totalHeight - (isWidthUp("md", this.props.width) ? 1 : 2) * ScaleManager.sliderHeight}
						style={{ paddingLeft: ScaleManager.horizontalPadding }}
						rowCount={rows.length}
						rowHeight={props => {
							let row = rows[props.index];
							if (typeof row === "string") return listSubHeaderHeight;
							else if ("render" in row) return row.height;
							else return row.height + BaseGridCard.margin * 2;
						}}
						rowRenderer={props => {
							let row = rows[props.index];
							if (typeof row === "string") {
								return (
									<ListSubheader key={props.index} component="div" style={props.style}>
										{row}
									</ListSubheader>
								);
							} else if ("render" in row) {
								return row.render(props);
							} else {
								let { card, canSelect, scale } = row;
								return (
									<div key={props.index} style={props.style}>
										{row.objectIds.map(id => (
											<card.component
												key={id}
												modelId={id}
												scale={scale}
												selected={canSelect && this.state.selection.includes(id)}
												selectOnTap={canSelect && this.state.selection.length > 0}
												onSelect={canSelect ? this.selectionManager.select : null}
												onMenu={(modelId, anchorPos) => this.actionManager.current.menuOpen(anchorPos)}
											/>
										))}
									</div>
								);
							}
						}}
					/>
				</div>
			</div>
		);
	}
}

/**
 * Create a new, styled GridView component
 * @param rootModelClass The Model to use as the root
 */
export function makeGridView(rootModelClass: typeof RootModel): typeof View {
	return withWidth()(
		withStyles(GridView.styles)(
			class extends GridView {
				static rootModelClass = rootModelClass;
			}
		)
	) as any;
	// NOTE "as any" is hacky
}
