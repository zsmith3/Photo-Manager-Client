import { BaseImageFile } from "../../../../models/BaseImageFile";
import { EditorCanvasFunctions } from "./EditorCanvas";

/** Shared editor data stored in ImageModal state */
export interface EditorSharedData<M extends BaseImageFile> {
	model: M;
	cursor: number;
}

/** EditorSharedData with all properties optional */
export type ESDOptional = { [P in keyof EditorSharedData<BaseImageFile>]?: EditorSharedData<BaseImageFile>[P] };

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
