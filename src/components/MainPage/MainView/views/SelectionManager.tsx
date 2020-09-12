import { Face, FileObject, Model, Scan } from "../../../../models";
import { ImageModelType } from "../../../../models/BaseImageFile";
import { LocationManager } from "../../../utils";
import View, { ViewState } from "./View";

/** Different object selection modes */
export enum SelectMode {
	/** Replace the existing selection with the clicked item (default) */
	Replace = 0,

	/** Toggle whether the clicked item is selected (Ctrl) */
	Toggle = 1,

	/** Select all items between the clicked item and the last item selected (Shift) */
	Extend = 2
}

/** Configuration for each ImageModal model type */
const openModelConfigs = {
	file: { model: FileObject, filter: (currentId, newId) => FileObject.getById(newId).type === "image" },
	face: { model: Face, filter: (currentId, newId) => newId === currentId || Face.getById(newId).fileID !== Face.getById(currentId).fileID },
	scan: { model: Scan, filter: (currentId, newId) => true }
} as {
	[K in ImageModelType]: {
		/** Model type */
		model: typeof Model;

		/** Function to determine whether an adjacent model can/should be opened */
		filter: (currentId: number, newId: number) => boolean;
	};
};

/** Manager for item selection/opening in all Views */
export default class SelectionManager<S extends ViewState> {
	/** View instance which this manager is attached to */
	view: View<S>;

	/** Function (from View) to retrieve current list of selectable objects */
	objectListGetter: () => number[];

	/** Current list of selectable object IDs */
	get objectList() {
		return this.objectListGetter();
	}

	/** Function (from View) to retrieve current model type of selectable objects */
	modelTypeGetter: () => ImageModelType;

	/** Current model type of selectable objects */
	get modelType() {
		return this.modelTypeGetter();
	}

	/** ID of last selected object */
	lastSelected: number;

	constructor(view: View<S>, objectListGetter: () => number[], modelTypeGetter: () => ImageModelType) {
		this.view = view;
		this.objectListGetter = objectListGetter;
		this.modelTypeGetter = modelTypeGetter;
	}

	/**
	 * Select an object
	 * @param modelId ID of the object to select
	 * @param mode Selection mode to use
	 */
	select = (modelId: number, mode: SelectMode) => {
		let newSelection = this.view.state.selection;

		switch (mode) {
			case SelectMode.Replace:
				newSelection = [modelId];
				break;
			case SelectMode.Toggle:
				if (newSelection.includes(modelId)) newSelection = newSelection.filter(id => id !== modelId);
				else newSelection = newSelection.concat([modelId]);
				break;
			case SelectMode.Extend:
				let first = this.objectList.indexOf(this.lastSelected);
				let second = this.objectList.indexOf(modelId);
				newSelection = [];
				for (let i = Math.min(first, second); i <= Math.max(first, second); i++) newSelection.push(this.objectList[i]);
				break;
		}

		this.lastSelected = modelId;
		this.view.setState({ selection: newSelection });
	};

	/**
	 * Select/deselect all objects
	 * @param value True to select, false to deselect
	 */
	selectAll(value: boolean) {
		if (value) this.view.setState({ selection: this.objectList });
		else this.view.setState({ selection: [] });
	}

	/**
	 * Move the current selection left/right/up/down
	 * @param delta The (positive or negative) number of places to move
	 */
	moveSelection(delta: number) {
		let last = this.objectList.indexOf(this.lastSelected);
		let nextIndex = Math.min(Math.max(last + delta, 0), this.objectList.length - 1);
		let nextId = this.objectList[nextIndex];
		this.lastSelected = nextId;
		this.view.setState({ selection: [nextId] });
	}

	/**
	 * Get the ID of the currently open item (e.g. file or face)
	 * @returns Type and ID of item, or `null` if none is open
	 */
	getOpenItem(): { type: ImageModelType; id: number } {
		// TODO consider just using this.modeltypeGetter
		// (i.e. enforcing correct model type)
		let type: ImageModelType;
		for (type in openModelConfigs) {
			let modelId = parseInt(LocationManager.currentQuery.get(type));
			if (openModelConfigs[type].model.getById(modelId)) return { type: type, id: modelId };
		}
		return null;
	}

	/**
	 * Get the next/previous object to the currently open file
	 * @param direction +1 for next object, -1 for previous object
	 * @returns ID of chosen object (or `null` if none available)
	 */
	getAdjacentItemId(direction: -1 | 1): number {
		let { type, id: currentId } = this.getOpenItem();
		if (!this.objectList.includes(currentId)) return null;
		let newIndex = this.objectList.indexOf(currentId);
		while (true) {
			newIndex += direction;
			if (newIndex < 0 || newIndex >= this.objectList.length) return null;
			let newId = this.objectList[newIndex];
			if (openModelConfigs[type].filter(currentId, newId)) return newId;
		}
	}
}
