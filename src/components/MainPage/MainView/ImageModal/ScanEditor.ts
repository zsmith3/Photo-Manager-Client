import { Axis, Line, Scan } from "../../../../models/Scan";
import BaseEditor from "./BaseEditor";

/** Actions in ScanEditorMenu */
export type EditorMenuAction = "updateCursor" | "updateOption" | "preview" | "confirm" | "clear";

/** Possible cursors in Scan edit mode */
export enum ScanEditorCursor {
	Move = 0,
	HorizontalLine = 1,
	VerticalLine = 2
}

/** Editor for Scan model */
export default class ScanEditor extends BaseEditor<Scan> {
	/** Local editor data */
	data = { lines: [] as Line[], currentLine: { axis: Axis.Horizontal, pos: 0 } as Line, previewRects: [] as number[][][] };

	/** Render cropping lines and preview rectangles */
	renderCanvas() {
		this.canvasFunctions.clear();
		this.renderMargins();
		this.renderCropLines();
		this.renderPreviewRects();
	}

	/** Get all rectangles formed by current cropping lines */
	getCropRectsFromLines(lines: Line[], width: number, height: number) {
		let divisions = [[0], [0]];
		for (let line of lines) {
			divisions[1 - line.axis].push(line.pos);
		}

		divisions[0].push(width);
		divisions[1].push(height);
		divisions[0] = divisions[0].sort((a, b) => a - b);
		divisions[1] = divisions[1].sort((a, b) => a - b);

		let rects: number[][] = [];
		for (let x = 0; x < divisions[0].length - 1; x++) {
			for (let y = 0; y < divisions[1].length - 1; y++) {
				rects.push([divisions[0][x], divisions[1][y], divisions[0][x + 1], divisions[1][y + 1]]);
			}
		}

		return rects;
	}

	/** Render cropping rectangle margins */
	renderMargins() {
		let rects = this.getCropRectsFromLines(this.data.lines, this.publicData.model.width, this.publicData.model.height);
		for (let rect of rects) {
			this.canvasFunctions.drawMargins(rect[0], rect[1], rect[2], rect[3], this.publicData.bounds, "rgba(255, 0, 0, 0.25)");
		}
	}

	/** Render cropping lines */
	renderCropLines() {
		for (let line of this.data.lines.concat(this.publicData.cursor === ScanEditorCursor.Move ? [] : [this.data.currentLine])) {
			if (line.axis === Axis.Horizontal) {
				this.canvasFunctions.drawLine(0, line.pos, this.publicData.model.width, line.pos, 1, "#FF0000", [10, 10]);
			} else {
				this.canvasFunctions.drawLine(line.pos, 0, line.pos, this.publicData.model.height, 1, "#FF0000", [10, 10]);
			}
		}
	}

	/** Render crop preview rectangles */
	renderPreviewRects() {
		for (let rect of this.data.previewRects) {
			for (let i = 0; i < 4; i++) {
				this.canvasFunctions.drawLine(rect[i][0], rect[i][1], rect[(i + 1) % 4][0], rect[(i + 1) % 4][1], 3, "#0000FF", []);
			}
		}
	}

	/** Run any EditorMenu action */
	async menuAction(action: EditorMenuAction, ...args: any[]) {
		this.setPublicData({ loading: true });
		switch (action) {
			case "updateCursor":
				this.setPublicData({ cursor: args[0] });
				break;
			case "updateOption":
				if (args[1] === null) this.setPublicData({ [args[0]]: args[2] });
				else {
					let data = this.publicData[args[0]];
					data[args[1]] = args[2];
					this.setPublicData({ [args[0]]: data });
				}
				break;
			case "preview":
				this.data.previewRects = await this.publicData.model.getCropPreview(this.data.lines, { bounds: this.publicData.bounds });
				this.renderCanvas();
				break;
			case "confirm":
				await this.publicData.model.confirmCrop(this.data.lines, { bounds: this.publicData.bounds });
				break;
			case "clear":
				this.data.lines = [];
				this.renderCanvas();
				break;
		}
		this.setPublicData({ loading: false });
	}

	/** Update current line position on mouse move */
	onMouseMove(x: number, y: number) {
		this.data.currentLine = { axis: this.publicData.cursor - 1, pos: [y, x][this.publicData.cursor - 1] };
		this.renderCanvas();
	}

	/** Confirm current line on mouse click */
	onClick(x: number, y: number) {
		this.data.lines.push(this.data.currentLine);
		this.renderCanvas();
	}

	/** Reset crop lines for new image */
	resetData() {
		this.data.lines = [{ axis: Axis.Horizontal, pos: this.publicData.model.height / 2 }];
		this.data.previewRects = [];
		this.menuAction("preview");
	}
}
