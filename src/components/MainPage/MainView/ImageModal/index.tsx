import { AppBar, Icon, IconButton, Modal, Theme, Toolbar, Typography, withStyles } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import React from "react";
import Hammer from "react-hammerjs";
import { Input } from "../../../../controllers/Input";
import { FileImgSizes, Platform } from "../../../../controllers/Platform";
import { Face, FileObject, Scan } from "../../../../models";
import { BaseImageFile, ImageModelType } from "../../../../models/BaseImageFile";
import { UpdateHandler } from "../../../../utils";
import { ImageLoader, LocationManager } from "../../../utils";
import { EditorSharedData } from "./BaseEditor";
import EditorCanvas from "./EditorCanvas";
import ScanEditorMenu from "./ScanEditorMenu";

/** Props type for ImageModal */
interface Props {
	type: ImageModelType;
	itemId: number;
	nextItemId: number;
	lastItemId: number;
	classes: {
		title: string;
		img: string;
		arrows: string;
		arrowsLandscape: string;
		arrowsPortrait: string;
		arrowIcon: string;
		arrowLeft: string;
		arrowRight: string;
		closeIcon: string;
		editIcon: string;
	};
	width: Breakpoint;
}

/** Dialog to display and modify image file */
class ImageModal extends React.Component<Props> {
	static styles = (theme: Theme) => ({
		title: {
			width: "60%",
			margin: "auto"
		},
		img: {
			position: "absolute" as "absolute",
			transition: "all 0.1s ease-out"
		},
		arrows: {
			position: "absolute" as "absolute",
			[theme.breakpoints.up("md")]: {
				width: 100,
				height: 100
			},
			[theme.breakpoints.down("sm")]: {
				width: 50,
				height: 50
			}
		},
		arrowsLandscape: {
			top: "calc(50vh - 20px)"
		},
		arrowsPortrait: {
			bottom: 20
		},
		arrowIcon: {
			color: "white",
			[theme.breakpoints.up("md")]: {
				fontSize: 88
			},
			[theme.breakpoints.down("sm")]: {
				fontSize: 44
			}
		},
		arrowLeft: {
			left: "calc(10px + 2%)"
		},
		arrowRight: {
			right: "calc(10px + 2%)"
		},
		closeIcon: {
			color: "white",
			fontSize: 40,
			position: "absolute" as "absolute",
			right: 5
		},
		editIcon: {
			color: "white"
		}
	});

	/** Data about the current state of image drag/zoom */
	dragging = { doneX: 0, doneY: 0, scaleDone: 1, resetTimeout: -1 };

	/** Storage of the zoom/position state of previously opened files */
	fileZoomStates = new Map<
		number,
		{
			maxW: "min" | "max" | number;
			maxH: "min" | "max" | number;
			xPos: "c" | number;
			yPos: "c" | number;
		}
	>();

	state = {
		/** Current open file */
		file: null as BaseImageFile,

		/** Size styling for the image element */
		imgZoomStyle: {
			width: 0,
			height: 0,
			left: 0,
			top: 0
		},

		/** Whether editing mode is enabled */
		editMode: false,

		/** Shared editing data */
		editData: { cursor: 0 } as EditorSharedData<BaseImageFile>
	};

	/** Ref to EditorCanvas (to pass actions from EditorMenu) */
	editorRef: React.RefObject<EditorCanvas>;

	/** Update handler to register changes to file (i.e. to switch file when deleted) */
	fileUpdateHandler: UpdateHandler = null

	/**
	 * Load an item into `this.state` to display
	 * @param type The item type
	 * @param itemId The item ID
	 */
	loadFile(type: ImageModelType, itemId: number) {
		if (this.fileUpdateHandler !== null) this.fileUpdateHandler.unregister();
		let setFile = (file: BaseImageFile) => {
			this.setState({file: file});
			this.fileUpdateHandler = file.updateHandlers.register(obj => {
				if (obj.deleted) {
					if (this.props.nextItemId !== null) this.switchFile("next");
					else if (this.props.lastItemId !== null) this.switchFile("last");
					else this.close();
				}
			});
		}
		switch (type) {
			case "file":
				FileObject.loadObject<FileObject>(itemId).then(file => setFile(file));
				break;
			case "face":
				Face.loadObject<Face>(itemId).then(face => setFile(face.file));
				break;
			case "scan":
				Scan.loadObject<Scan>(itemId).then(scan => setFile(scan));
				break;
		}
	}

	/** Close the modal */
	close() {
		Platform.mediaQueue.resume();
		LocationManager.updateQuery({ file: "", face: "", scan: "" });
		if (this.fileUpdateHandler !== null) this.fileUpdateHandler.unregister();
	}

	/**
	 * Move forwards or backwards by one file
	 * @param direction The direction to move
	 */
	switchFile(direction: "last" | "next") {
		if (direction === "last") {
			LocationManager.updateQuery({
				[this.props.type]: this.props.lastItemId.toString()
			});
		} else {
			LocationManager.updateQuery({
				[this.props.type]: this.props.nextItemId.toString()
			});
		}
	}

	/**
	 * Set the zoom and position of the image
	 * @param maxW Maximum width of the image ("min" fits image to screen size, "max" shows it at original size)
	 * @param maxH Maximum height of the image ("min" fits image to screen size, "max" shows it at original size)
	 * @param xPos X position of the left edge of the image ("c" to horizontally centre the image)
	 * @param yPos Y position of the top edge of the image	("c" to vertically centre the image)
	 */
	setZoom(maxW: "min" | "max" | number, maxH: "min" | "max" | number, xPos: "c" | number, yPos: "c" | number) {
		let previousZoomState = this.fileZoomStates.get(this.state.file.id);
		let toolBarHeight = 64; // TODO height of the top imagemodal bar
		let verticalMargin = 20;

		// Calculate bounding box
		maxW = maxW || previousZoomState.maxW || "min";
		maxH = maxH || previousZoomState.maxH || "min";
		if (maxW == "max") maxW = this.state.file.width;
		else if (maxW == "min") maxW = window.innerWidth - (isWidthUp("md", this.props.width) ? 300 : window.innerWidth > window.innerHeight ? 150 : 0);
		if (maxH == "max") maxH = this.state.file.height;
		else if (maxH == "min") maxH = window.innerHeight - toolBarHeight - verticalMargin;

		// Calculate new size
		let newWidth: number, newHeight: number;
		if (maxW / maxH > this.state.file.width / this.state.file.height) {
			newWidth = (maxH * this.state.file.width) / this.state.file.height;
			newHeight = maxH;
		} else {
			newWidth = maxW;
			newHeight = (maxW * this.state.file.height) / this.state.file.width;
		}

		// Calculate new position
		if (xPos !== 0) xPos = xPos || previousZoomState.xPos || "c";
		if (yPos !== 0) yPos = yPos || previousZoomState.yPos || "c";
		if (xPos === "c") xPos = (window.innerWidth - newWidth) / 2;
		if (yPos === "c") yPos = (window.innerHeight - newHeight + toolBarHeight) / 2;

		// Update state
		this.setState({
			imgZoomStyle: {
				width: newWidth,
				height: newHeight,
				left: xPos,
				top: yPos
			}
		});

		// Store persistent zoom state for this file
		this.fileZoomStates.set(this.state.file.id, {
			maxW: maxW,
			maxH: maxH,
			xPos: xPos,
			yPos: yPos
		});
	}

	/**
	 * Enlarge the image about a point
	 * @param scale The scale factor of enlargement
	 * @param xPoint X co-ordinate of the centre of enlargement
	 * @param yPoint Y co-ordinate of the centre of enlargement
	 */
	zoom(scale: number, xPoint: number, yPoint: number) {
		let oldX = this.state.imgZoomStyle.left;
		let oldY = this.state.imgZoomStyle.top;
		let newX = xPoint - (xPoint - oldX) * scale;
		let newY = yPoint - (yPoint - oldY) * scale;

		let newW = this.state.imgZoomStyle.width * scale;
		let newH = this.state.imgZoomStyle.height * scale;

		this.setZoom(newW, newH, newX, newY);
	}

	/**
	 * Drag the image (called many times during pan with increasing delta values)
	 * @param deltaX Total X distance dragged so far
	 * @param deltaY Total Y distance dragged so far
	 */
	drag(deltaX: number, deltaY: number) {
		if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;

		let newX = this.state.imgZoomStyle.left + deltaX - this.dragging.doneX;
		let newY = this.state.imgZoomStyle.top + deltaY - this.dragging.doneY;

		this.setState({
			imgZoomStyle: { ...this.state.imgZoomStyle, left: newX, top: newY }
		});

		this.dragging.doneX = deltaX;
		this.dragging.doneY = deltaY;

		this.fileZoomStates.get(this.state.file.id).xPos = newX;
		this.fileZoomStates.get(this.state.file.id).yPos = newY;
	}

	/** Set a timeout to auto-reset the position/scale of the image if no new events are received */
	setResetTimeout() {
		window.clearTimeout(this.dragging.resetTimeout);

		if (Input.isTouching) {
			this.dragging.resetTimeout = window.setTimeout(() => {
				if (Input.touchesDown == 0) this.setZoom("min", "min", "c", "c");
			}, 100);
		}
	}

	/** Change the displayed image on mobile swipe events */
	onSwipe = event => {
		if (this.state.editMode && this.state.editData.cursor !== 0) return;
		if (Input.isTouching && Math.abs(event.deltaX) > 300) {
			let direction = event.deltaX > 0 ? "last" : "next";
			if ((direction === "last" && this.props.lastItemId !== null) || (direction === "next" && this.props.nextItemId !== null)) {
				this.switchFile(direction);
			}

			Input.touchesDown = 0;
		}
	};

	/** Reset scaling on the start of pinch events */
	onPinchStart = event => {
		if (this.state.editMode && this.state.editData.cursor !== 0) return;
		this.dragging.scaleDone = 1;
	};

	/** Zoom in/out on pinch events */
	onPinch = event => {
		if (this.state.editMode && this.state.editData.cursor !== 0) return;
		this.zoom(event.scale / this.dragging.scaleDone, event.center.x, event.center.y);
		this.dragging.scaleDone = event.scale;

		this.setResetTimeout();
	};

	/** Move the image on pan events */
	onPan = event => {
		if (this.state.editMode && this.state.editData.cursor !== 0) return;
		this.drag(event.deltaX, event.deltaY);

		// Run on pan end
		if (event.eventType === 4) {
			this.dragging.doneX = 0;
			this.dragging.doneY = 0;
		}

		this.setResetTimeout();
	};

	/** Toggle image editing mode */
	toggleEditMode = () => this.setState({ editMode: !this.state.editMode });

	/** Fetch editing state data to pass to children (since current file not stored in this.state.editData) */
	getEditData<M extends BaseImageFile>() {
		return { model: this.state.file, ...this.state.editData } as EditorSharedData<M>;
	}

	/** Update editing state data */
	updateEditData = (newData: EditorSharedData<BaseImageFile>) => {
		let data = this.state.editData;
		for (let key in newData) data[key] = newData[key];
		this.setState({ editData: data });
	};

	constructor(props: Props) {
		super(props);

		Platform.mediaQueue.pause();

		this.loadFile(props.type, props.itemId);

		this.editorRef = React.createRef();
	}

	shouldComponentUpdate(nextProps: Props) {
		if (this.props === nextProps) {
			// If props are unchanged, then state must have changed, so re-render
			return true;
		} else {
			// If props have changed, fetch the new file, which will update the state
			this.loadFile(nextProps.type, nextProps.itemId);
			return false;
		}
	}

	render() {
		let arrowPosClass = window.innerWidth > window.innerHeight ? this.props.classes.arrowsLandscape : this.props.classes.arrowsPortrait;

		return (
			<Modal open={true}>
				<div>
					{/* Top bar */}
					<AppBar style={{ background: "rgba(0, 0, 0, 0.8)" }}>
						<Toolbar>
							{this.props.type === "scan" && (
								<IconButton onClick={this.toggleEditMode} title={this.state.editMode ? "Save Edits" : "Enter edit mode"}>
									<Icon className={this.props.classes.editIcon}>{this.state.editMode ? "check" : "create"}</Icon>
								</IconButton>
							)}

							<Typography variant="h4" color="inherit" align="center" className={this.props.classes.title}>
								{this.state.file && this.state.file.name}
							</Typography>

							<IconButton onClick={() => this.close()}>
								<Icon className={this.props.classes.closeIcon}>clear</Icon>
							</IconButton>
						</Toolbar>
					</AppBar>

					{/* Main image */}
					<Hammer onSwipe={this.onSwipe} onPinchStart={this.onPinchStart} onPinch={this.onPinch} onPan={this.onPan} options={{ recognizers: { pinch: { enable: true } } }}>
						<div
							onDoubleClick={() => (!this.state.editMode || this.state.editData.cursor === 0) && this.setZoom("min", "min", "c", "c")}
							onWheel={event => (!this.state.editMode || this.state.editData.cursor === 0) && this.zoom(1 - event.deltaY / 500, event.clientX, event.clientY)}
						>
							{this.state.file && (
								<ImageLoader
									model={this.state.file}
									maxSize={FileImgSizes.Original}
									maxFirstSize={FileImgSizes.Large}
									noQueue={true}
									className={this.props.classes.img}
									style={{ cursor: !this.state.editMode || this.state.editData.cursor === 0 ? "move" : "default", ...this.state.imgZoomStyle }}
									onFirstLoad={() => this.setZoom("min", "min", "c", "c")}
								/>
							)}
							<EditorCanvas
								ref={this.editorRef}
								style={{ pointerEvents: !this.state.editMode || this.state.editData.cursor === 0 ? "none" : "auto", ...this.state.imgZoomStyle }}
								enabled={this.state.editMode}
								type={this.props.type}
								data={this.getEditData()}
								updateData={this.updateEditData}
							/>
						</div>
					</Hammer>

					{/* Arrows */}
					{this.props.lastItemId !== null && (
						<IconButton className={[this.props.classes.arrows, arrowPosClass, this.props.classes.arrowLeft].join(" ")} onClick={() => this.switchFile("last")}>
							<Icon className={this.props.classes.arrowIcon}>keyboard_arrow_left</Icon>
						</IconButton>
					)}
					{this.props.nextItemId !== null && (
						<IconButton className={[this.props.classes.arrows, arrowPosClass, this.props.classes.arrowRight].join(" ")} onClick={() => this.switchFile("next")}>
							<Icon className={this.props.classes.arrowIcon}>keyboard_arrow_right</Icon>
						</IconButton>
					)}

					{this.state.editMode && this.props.type === "scan" && (
						<ScanEditorMenu data={this.getEditData<Scan>()} action={(action, ...args) => this.editorRef.current.menuAction(action, ...args)} />
					)}
				</div>
			</Modal>
		);
	}
}

export default withWidth()(withStyles(ImageModal.styles)(ImageModal));
