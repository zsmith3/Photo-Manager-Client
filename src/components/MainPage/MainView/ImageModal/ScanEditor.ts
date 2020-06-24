import { Axis, Line, Scan } from "../../../../models/Scan";
import BaseEditor from "./BaseEditor";

/** Actions in ScanEditorMenu */
export type EditorMenuAction = "updateCursor" | "preview" | "confirm";

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
		this.renderCropLines();
		this.renderPreviewRects();
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
		switch (action) {
			case "updateCursor":
				this.setPublicData({ cursor: args[0] });
				break;
			case "preview":
				this.data.previewRects = await this.publicData.model.getCropPreview(this.data.lines);
				this.renderCanvas();
				break;
			case "confirm":
				this.publicData.model.confirmCrop(this.data.lines);
				break;
		}
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
	}
}
