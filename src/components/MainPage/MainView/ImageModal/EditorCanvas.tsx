import React from "react";
import { BaseImageFile, ImageModelType } from "../../../../models/BaseImageFile";
import BaseEditor, { EditorCanvasFunctions, EditorSharedData, ESDOptional } from "./BaseEditor";
import ScanEditor from "./ScanEditor";

/** Props type for EditorCanvas */
interface Props {
	enabled: boolean;
	style: any;
	data: EditorSharedData<BaseImageFile>;
	type: ImageModelType;
	updateData: (data: ESDOptional) => void;
}

/** Wrapper for image editor canvas */
export default class EditorCanvas extends React.Component<Props> {
	/** Ref to HTML Canvas element */
	canvasRef: React.RefObject<HTMLCanvasElement>;

	/** Image editor for different model types */
	editor: BaseEditor<BaseImageFile>;

	/** Construct this.editor (re-run when model type changes) */
	createEditor(type: ImageModelType) {
		this.editor = new { scan: ScanEditor }[type](
			this.canvasFunctions,
			() => this.props.data,
			(data: ESDOptional) => this.props.updateData(data)
		);
	}

	/** Get the (x, y) co-ordinates within the image of a mouse event */
	getEventPos = (event: React.MouseEvent) => {
		let canvas = this.canvasRef.current;
		let x = Math.round(((event.clientX - canvas.getBoundingClientRect().left) * this.props.data.model.width) / canvas.width);
		let y = Math.round(((event.clientY - canvas.getBoundingClientRect().top) * this.props.data.model.height) / canvas.height);
		return [x, y];
	};

	/** Run Editor handler for mouse move on canvas */
	onMouseMove = (event: React.MouseEvent) => {
		let pos = this.getEventPos(event);
		this.editor.onMouseMove(pos[0], pos[1]);
	};

	/** Run Editor handler for mouse click on canvas */
	onClick = (event: React.MouseEvent) => {
		let pos = this.getEventPos(event);
		this.editor.onClick(pos[0], pos[1]);
	};

	/** Send EditorMenu actions to the Editor */
	menuAction = (action: string, ...args: any[]) => {
		this.editor.menuAction(action, ...args);
	};

	/** Canvas functionality for use by Editor classes */
	canvasFunctions: EditorCanvasFunctions = {
		clear: () => {
			let canvas = this.canvasRef.current;
			canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
		},

		drawLine: (x1: number, y1: number, x2: number, y2: number, width: number, color: string, dash: number[]) => {
			let canvas = this.canvasRef.current;
			let ctx = canvas.getContext("2d");

			ctx.lineWidth = width;
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.setLineDash(dash);
			ctx.moveTo((x1 * canvas.width) / this.props.data.model.width, (y1 * canvas.height) / this.props.data.model.height);
			ctx.lineTo((x2 * canvas.width) / this.props.data.model.width, (y2 * canvas.height) / this.props.data.model.height);
			ctx.stroke();
		},

		drawMargins: (x1: number, y1: number, x2: number, y2: number, margins: number[], color: string) => {
			let canvas = this.canvasRef.current;
			let ctx = canvas.getContext("2d");

			x1 *= canvas.width / this.props.data.model.width;
			let w = (x2 * canvas.width) / this.props.data.model.width - x1;
			y1 *= canvas.height / this.props.data.model.height;
			let h = (y2 * canvas.width) / this.props.data.model.width - y1;

			let marginX = margins[0] * w;
			let marginY = margins[1] * h;
			ctx.fillStyle = color;
			ctx.fillRect(x1, y1, w, h);
			ctx.clearRect(x1 + marginX, y1 + marginY, w - 2 * marginX, h - 2 * marginY);
		}
	};

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
		this.createEditor(props.type);
	}

	shouldComponentUpdate(nextProps: Props) {
		// Re-construct editor when model type changes
		if (this.props.type !== nextProps.type) this.createEditor(nextProps.type);

		// Reset editor when model changes, or when edit mode opened
		if (
			nextProps.enabled &&
			(!this.props.enabled || (!this.props.data.model && nextProps.data.model) || (this.props.data.model && this.props.data.model.id !== nextProps.data.model.id))
		) {
			this.props.data.model = nextProps.data.model;
			this.editor.resetData();
		}

		return true;
	}

	// Re-render canvas after updates
	componentDidUpdate() {
		if (this.props.enabled) this.editor.renderCanvas();
	}

	render() {
		if (!this.props.enabled) return null;

		return (
			<canvas
				ref={this.canvasRef}
				style={{ position: "absolute", transition: "all 0.1s ease-out", ...this.props.style }}
				onMouseMove={this.onMouseMove}
				onClick={this.onClick}
				width={this.props.style.width}
				height={this.props.style.height}
			></canvas>
		);
	}
}
