import { AppBar, Icon, IconButton, Modal, Toolbar, Typography, withStyles } from "@material-ui/core";
import React from "react";
import Hammer from "react-hammerjs";
import { Input } from "../../../controllers/Input";
import { FileImgSizes } from "../../../controllers/Platform";
import { FileObject } from "../../../models";
import { ImageLoader, LocationManager } from "../../utils";

const platform: ("desktop" | "mobile") = "desktop";
// TODO set platform properly

/** Dialog to display and modify image file */
class ImageModal extends React.Component<{ fileId: number, nextFileId: number, lastFileId: number, classes: { title: string, img: string, arrows: string, arrowIcon:string, arrowLeft: string, arrowRight: string, closeIcon: string } }> {
	static styles = {
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
			width: 100,
			height: 100,
			top: "calc(50vh - 20px)"
		},
		arrowIcon: {
			fontSize: 88,
			color: "white"
		},
		arrowLeft: {
			left: "calc(10px + 2%)"
		},
		arrowRight: {
			right: "calc(10px + 2%)"
		},
		closeIcon: {
			color: "white",
			fontSize: 40
		}
	}

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
	 * Move forwards or backwards by one file
	 * @param direction The direction to move
	 */
	switchFile (direction: ("last" | "next")) {
		if (direction === "last") {
			LocationManager.updateQuery({ file: this.props.lastFileId.toString() });
		} else {
			LocationManager.updateQuery({ file: this.props.nextFileId.toString() });
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
		let toolBarHeight = 60; // TODO height of the top imagemodal bar

		// Calculate bounding box
		maxW = (maxW || previousZoomState.maxW) || "min";
		maxH = (maxH || previousZoomState.maxH) || "min";
		if (maxW == "max") maxW = this.state.file.width;
		else if (maxW == "min") maxW = window.innerWidth - (platform === "mobile" ? 0 : 300);
		if (maxH == "max") maxH = this.state.file.height;
		else if (maxH == "min") maxH = window.innerHeight - (platform === "mobile" ? 0 : toolBarHeight);

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
		if (yPos === "c") yPos = (window.innerHeight - newHeight + (platform === "mobile" ? 0 : toolBarHeight)) / 2;

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

		if (platform === "mobile") {
			this.dragging.resetTimeout = window.setTimeout(() => { if (Input.touchesDown == 0) this.setZoom("min", "min", "c", "c"); }, 100);
		}
	}


	/** Change the displayed image on mobile swipe events */
	onSwipe = event => {
		// TODO
		if (platform === "mobile") {
			let direction = Math.round(-event.deltaX / 100);
			direction = direction / Math.abs(direction);
			if (direction) this.switchFile(direction);
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

		FileObject.loadObject(props.fileId).then(file => this.setState({ file: file }));
	}

	shouldComponentUpdate (nextProps: { fileId: number }) {
		if (this.props === nextProps) {
			// If props are unchanged, then state must have changed, so re-render
			return true;
		} else {
			// If props have changed, fetch the new file, which will update the state
			FileObject.loadObject(nextProps.fileId).then(file => this.setState({ file: file }));
			return false;
		}
	}

	render () {
		return <Modal open={ true }>
				<div>
					{/* Top bar */}
					<AppBar style={ { background: "rgba(0, 0, 0, 0.8)" } }>
						<Toolbar>
							<Typography variant="h4" color="inherit" align="center" className={ this.props.classes.title }>{ this.state.file && this.state.file.name }</Typography>

							<IconButton onClick={ () => LocationManager.updateQuery({ file: "" })}>
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
								className={ this.props.classes.img }
								style={ this.state.imgZoomStyle }
								onFirstLoad={ () => this.setZoom("min", "min", "c", "c") } /> }
						</div>
					</Hammer>

					{/* Arrows */}
					{ this.props.lastFileId !== null && <IconButton className={ this.props.classes.arrows + " " + this.props.classes.arrowLeft } onClick={ () => this.switchFile("last") }>
						<Icon className={ this.props.classes.arrowIcon }>keyboard_arrow_left</Icon>
					</IconButton> }
					{ this.props.nextFileId !== null && <IconButton className={ this.props.classes.arrows + " " + this.props.classes.arrowRight } onClick={ () => this.switchFile("next") }>
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

export default withStyles(ImageModal.styles)(ImageModal);
