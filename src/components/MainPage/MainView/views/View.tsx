import { LinearProgress } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import React, { Fragment, RefObject } from "react";
import { Platform } from "../../../../controllers/Platform";
import { addressRootTypes } from "../../../App";
import { MountTrackedComponent } from "../../../utils";
import ImageModal from "../ImageModal";
import ActionManager from "./ActionManager";
import SelectionManager from "./SelectionManager";

/** Props shared between ViewContainer and View */
export interface ViewProps {
	rootType: addressRootTypes;
	rootId: number;
	page: number;
	pageSize: number;
	searchQuery: string;
	includeSubfolders: boolean;
	width: Breakpoint;
	totalWidth: number;
	totalHeight: number;
}

/** State for View component */
export interface ViewState {
	dataLoaded: boolean;
	hasError: boolean;
	selection: number[];
	currentScale: number;
}

/** Base View class to display main page content */
export default abstract class View<S extends ViewState, P extends { classes?: any } = {}> extends MountTrackedComponent<ViewProps & P, S> {
	state = {
		dataLoaded: false,
		hasError: false,
		selection: [],
		currentScale: null
	} as S;

	/** Manager for selection and item opening */
	selectionManager: SelectionManager<S>;

	/** Ref to actionManager */
	actionManager: RefObject<ActionManager<S>>;

	/** Render contents specific to the current View */
	abstract renderContents(): JSX.Element;

	/** Reset `this.state` when the page changes */
	resetState() {
		this.setState({ dataLoaded: false, hasError: false });
		Platform.mediaQueue.reset();
	}

	constructor(props) {
		super(props);
		this.actionManager = React.createRef();
	}

	render() {
		if (this.state.dataLoaded) {
			// ID of item open in ImageModal
			let openItem = this.selectionManager.getOpenItem();

			return (
				<Fragment>
					{this.renderContents()}

					{/* ActionManager to display menus and dialogs */}
					<ActionManager ref={this.actionManager} rootType={this.props.rootType} rootId={this.props.rootId} selectionManager={this.selectionManager} />

					{/* ImageModal to display individual image files */}
					{openItem !== null && (
						<ImageModal
							type={openItem.type}
							itemId={openItem.id}
							lastItemId={this.selectionManager.getAdjacentItemId(-1)}
							nextItemId={this.selectionManager.getAdjacentItemId(1)}
						/>
					)}
				</Fragment>
			);
		} else if (this.state.hasError) return <p>An error occurred.</p>;
		else return <LinearProgress />;
	}
}
