import { AppBar, Icon, IconButton, Modal, Toolbar, Typography, withStyles, Theme } from "@material-ui/core";
import React from "react";
import Hammer from "react-hammerjs";
import { Input } from "../../../controllers/Input";
import { FileImgSizes, Platform } from "../../../controllers/Platform";
import { FileObject, Face } from "../../../models";
import { ImageLoader, LocationManager } from "../../utils";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";

const platform: ("desktop" | "mobile") = "desktop";
// TODO set platform properly

type modelType = ("file" | "face");

/** Dialog to display and modify image file */
class ImageModal extends React.Component<{ type: modelType, itemId: number, nextItemId: number, lastItemId: number, classes: { title: string, img: string, arrows: string, arrowsLandscape: string, arrowsPortrait: string, arrowIcon:string, arrowLeft: string, arrowRight: string, closeIcon: string }, width: Breakpoint }> {
	static styles = (theme: Theme) => ({
		title: {
			width: "60%",
			margin: "auto"
		},
		img: {
			position: "absolute" as "absolute",
			cursor: "move",
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
			top: "calc(50vh - 20px)",
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
		}
	})


	/** Data about the current state of image drag/zoom */
	dragging = { doneX: 0, doneY: 0, scaleDone: 1, resetTimeout: -1 };

	/** Storage of the zoom/position state of previously opened files */
	fileZoomStates = new Map<number, { maxW: ("min" | "max" | number), maxH: ("min" | "max" | number), xPos: ("c" | number), yPos: ("c" | number) }>()

	state = {
		/** Current open file */
		file: null as FileObject,

		/** Size styling for the image element */
		imgZoomStyle: null as { width: number, height: number, left: number, top: number }
	}


	/**
	 * Load an item into `this.state` to display
	 * @param type The item type
	 * @param itemId The item ID
	 */
	loadFile (type: modelType, itemId: number) {
		switch (type) {
			case "file":
				FileObject.loadObject(itemId).then(file => this.setState({ file: file }));
				break;
			case "face":
				Face.loadObject<Face>(itemId).then(face => this.setState({ file: face.file }));
				break;
		}
	}

	/** Close the modal */
	close () {
		Platform.mediaQueue.resume();
		LocationManager.updateQuery({ file: "", face: "" });
	}

	/**
	 * Move forwards or backwards by one file
	 * @param direction The direction to move
	 */
	switchFile (direction: ("last" | "next")) {
		if (direction === "last") {
			LocationManager.updateQuery({ [this.props.type]: this.props.lastItemId.toString() });
		} else {
			LocationManager.updateQuery({ [this.props.type]: this.props.nextItemId.toString() });
		}
	}

	/**
	 * Set the zoom and position of the image
	 * @param maxW Maximum width of the image ("min" fits image to screen size, "max" shows it at original size)
	 * @param maxH Maximum height of the image ("min" fits image to screen size, "max" shows it at original size)
	 * @param xPos X position of the left edge of the image ("c" to horizontally centre the image)
	 * @param yPos Y position of the top edge of the image	("c" to vertically centre the image)
	 */
	setZoom (maxW: ("min" | "max" | number), maxH: ("min" | "max" | number), xPos: ("c" | number), yPos: ("c" | number)) {
		// TODO need to get App.app.config.platform before this will work

		let previousZoomState = this.fileZoomStates.get(this.state.file.id);
		let toolBarHeight = 64; // TODO height of the top imagemodal bar
		let verticalMargin = 20;

		// Calculate bounding box
		maxW = (maxW || previousZoomState.maxW) || "min";
		maxH = (maxH || previousZoomState.maxH) || "min";
		if (maxW == "max") maxW = this.state.file.width;
		else if (maxW == "min") maxW = window.innerWidth - (isWidthUp("md", this.props.width) ? 300 : (window.innerWidth > window.innerHeight ? 150 : 0));
		if (maxH == "max") maxH = this.state.file.height;
		else if (maxH == "min") maxH = window.innerHeight - toolBarHeight - verticalMargin;

		// Calculate new size
		let newWidth: number, newHeight: number;
		if (maxW / maxH > this.state.file.width / this.state.file.height) {
			newWidth = maxH * this.state.file.width / this.state.file.height;
			newHeight = maxH;
		} else {
			newWidth = maxW;
			newHeight = maxW * this.state.file.height / this.state.file.width;
		}

		// Calculate new position
		if (xPos !== 0) xPos = (xPos || previousZoomState.xPos) || "c";
		if (yPos !== 0) yPos = (yPos || previousZoomState.yPos) || "c";
		if (xPos === "c") xPos = (window.innerWidth - newWidth) / 2;
		if (yPos === "c") yPos = (window.innerHeight - newHeight + toolBarHeight) / 2;

		// Update state
		this.setState({ imgZoomStyle: { width: newWidth, height: newHeight, left: xPos, top: yPos } });

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
	zoom (scale: number, xPoint: number, yPoint: number) {
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
	drag (deltaX: number, deltaY: number) {
		if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;

		let newX = this.state.imgZoomStyle.left + deltaX - this.dragging.doneX;
		let newY = this.state.imgZoomStyle.top + deltaY - this.dragging.doneY;

		this.setState({ imgZoomStyle: { ...this.state.imgZoomStyle, left: newX, top: newY } });

		this.dragging.doneX = deltaX;
		this.dragging.doneY = deltaY;

		this.fileZoomStates.get(this.state.file.id).xPos = newX;
		this.fileZoomStates.get(this.state.file.id).yPos = newY;
	}

	/** Set a timeout to auto-reset the position/scale of the image if no new events are received */
	setResetTimeout () {
		window.clearTimeout(this.dragging.resetTimeout);

		if (Input.isTouching) {
			this.dragging.resetTimeout = window.setTimeout(() => { if (Input.touchesDown == 0) this.setZoom("min", "min", "c", "c"); }, 100);
		}
	}


	/** Change the displayed image on mobile swipe events */
	onSwipe = event => {
		if (Input.isTouching && Math.abs(event.deltaX) > 300) {
			let direction = event.deltaX > 0 ? "last" : "next";
			if (direction === "last" && this.props.lastItemId !== null || direction === "next" && this.props.nextItemId !== null) {
				this.switchFile(direction);
			}

			Input.touchesDown = 0;
		}
	}

	/** Reset scaling on the start of pinch events */
	onPinchStart = event => {
		this.dragging.scaleDone = 1;
	}

	/** Zoom in/out on pinch events */
	onPinch = event => {
		this.zoom(event.scale / this.dragging.scaleDone, event.center.x, event.center.y);
		this.dragging.scaleDone = event.scale;

		this.setResetTimeout();
	}

	/** Move the image on pan events */
	onPan = event => {
		this.drag(event.deltaX, event.deltaY);

		// Run on pan end
		if (event.eventType === 4) {
			this.dragging.doneX = 0;
			this.dragging.doneY = 0;
		}

		this.setResetTimeout();
	}


	constructor (props) {
		super(props);

		Platform.mediaQueue.pause();

		this.loadFile(props.type, props.itemId);
	}

	shouldComponentUpdate (nextProps: { type: modelType, itemId: number }) {
		if (this.props === nextProps) {
			// If props are unchanged, then state must have changed, so re-render
			return true;
		} else {
			// If props have changed, fetch the new file, which will update the state
			this.loadFile(nextProps.type, nextProps.itemId);
			return false;
		}
	}

	render () {
		let arrowPosClass = window.innerWidth > window.innerHeight ? this.props.classes.arrowsLandscape : this.props.classes.arrowsPortrait;

		return <Modal open={ true }>
				<div>
					{/* Top bar */}
					<AppBar style={ { background: "rgba(0, 0, 0, 0.8)" } }>
						<Toolbar>
							<Typography variant="h4" color="inherit" align="center" className={ this.props.classes.title }>{ this.state.file && this.state.file.name }</Typography>

							<IconButton onClick={ () => this.close() }>
								<Icon className={ this.props.classes.closeIcon }>clear</Icon>
							</IconButton>
						</Toolbar>
					</AppBar>

					{/* Main image */}
					<Hammer onSwipe={ this.onSwipe } onPinchStart={ this.onPinchStart } onPinch={ this.onPinch } onPan={ this.onPan } options={ { recognizers: { pinch: { enable: true } } } }>
						<div onDoubleClick={ () => this.setZoom("min", "min", "c", "c") } onWheel={ event => this.zoom(1 - event.deltaY / 500, event.clientX, event.clientY) }>
							{ this.state.file && <ImageLoader
								model={ this.state.file }
								maxSize={ FileImgSizes.Original }
								maxFirstSize={ FileImgSizes.Large }
								noQueue={ true }
								className={ this.props.classes.img }
								style={ this.state.imgZoomStyle }
								onFirstLoad={ () => this.setZoom("min", "min", "c", "c") } /> }
						</div>
					</Hammer>

					{/* Arrows */}
					{ this.props.lastItemId !== null && <IconButton className={ [this.props.classes.arrows, arrowPosClass, this.props.classes.arrowLeft].join(" ") } onClick={ () => this.switchFile("last") }>
						<Icon className={ this.props.classes.arrowIcon }>keyboard_arrow_left</Icon>
					</IconButton> }
					{ this.props.nextItemId !== null && <IconButton className={ [this.props.classes.arrows, arrowPosClass, this.props.classes.arrowRight].join(" ") } onClick={ () => this.switchFile("next") }>
						<Icon className={ this.props.classes.arrowIcon }>keyboard_arrow_right</Icon>
					</IconButton> }
				</div>
			</Modal>;
	}


	/* clearToolbarButtons () {
		$(this).find("#im-icons-left").html("");
		$(this).find("#im-icons-right").html("");
	}

	addToolbarButton (layout, toolBar) {
		if ("top" in layout && "bottom" in layout) {
			this.addToolbarButton(layout.top, toolBar);
			this.addToolbarButton(layout.bottom, toolBar);
			return;
		}

		let button = $("<button></button>").addClass("im-button").appendTo($(this).find("#im-icons-left"));

		let _this = this;
		toolBar.setOnClick(button.get(0), layout, function () {
			_this.selectCurrentFile();
		});

		button.attr("title", layout.title);

		for (var i = 0; i < layout.icon.length; i++) {
			$("<i class='material-icons'></i>").text(layout.icon[i]).appendTo(button);
		}
	}

	updateButtonPositions () {
		let allButtons = $(this).find("#im-icons-left .im-button, #im-icons-left .im-button");

		for (var i = 0; i <= allButtons.length / 2; i++) $(allButtons.get(i)).appendTo($(this).find("#im-icons-left"));
		for (; i < allButtons.length; i++) $(allButtons.get(i)).appendTo($(this).find("#im-icons-right"));

		let maxWidth = Math.max($(this).find("#im-icons-left").width(), $(this).find("#im-icons-right").width() + 80);
		$(this).find("#im-icons-left").css("width", maxWidth + "px");
		$(this).find("#im-icons-right").css("width", (maxWidth - 80) + "px");

		let totalUsed = $(this).find("#im-icons-left").width() + $(this).find("#im-icons-right").width() + 140;
		let maxLeft = window.innerWidth - totalUsed;

		$(this).find("#im-title").css("max-width", maxLeft);
	} */
}

export default withWidth()(withStyles(ImageModal.styles)(ImageModal));
