import { BaseImageFile } from "../../../../models/BaseImageFile";

/** Shared editor data stored in ImageModal state */
export interface EditorSharedData<M extends BaseImageFile> {
	model: M;
	cursor: number;
	loading: boolean;
	bounds: number[];
}

/** EditorSharedData with all properties optional */
export type ESDOptional = { [P in keyof EditorSharedData<BaseImageFile>]?: EditorSharedData<BaseImageFile>[P] };

/** Canvas functionality required by Editor classes */
export interface EditorCanvasFunctions {
	/** Clear the canvas */
	clear: () => void;

	/** Draw a line to the canvas (with options) */
	drawLine: (x1: number, y1: number, x2: number, y2: number, width: number, color: string, dash: number[]) => void;

	/** Draw margins for a rectangle (margin as proportion of dimensions) */
	drawMargins: (x1: number, y1: number, x2: number, y2: number, margins: number[], color: string) => void;
}

/** Base class for image editor */
export default abstract class BaseEditor<M extends BaseImageFile> {
	/** EditorCanvas functions for drawing to canvas */
	canvasFunctions: EditorCanvasFunctions;

	/** Shared data (in ImageModal state) */
	get publicData() {
		return this.getPublicData();
	}

	/** Getter for public data */
	getPublicData: () => EditorSharedData<M>;

	/** Update function for public data (setState on ImageModal) */
	setPublicData: (data: ESDOptional) => void;

	/** Run any EditorMenu action */
	abstract async menuAction(action: string, ...args: any[]): Promise<void>;

	/** Mouse move event handler */
	abstract onMouseMove(x: number, y: number): void;

	/** Mouse click event handler */
	abstract onClick(x: number, y: number): void;

	/** Reset canvas and re-render editor data */
	abstract renderCanvas(): void;

	/** Reset local data when current image changes */
	abstract resetData(): void;

	constructor(canvasFunctions: EditorCanvasFunctions, getData: () => EditorSharedData<M>, setData: (data: ESDOptional) => void) {
		this.canvasFunctions = canvasFunctions;
		this.getPublicData = getData;
		this.setPublicData = setData;
	}
}
