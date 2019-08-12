import { Model } from ".";
import { GridCardExport } from "../components/MainPage/MainView/cards/BaseGridCard";
import { ModelMeta } from "./Model";
import { UpdateHandlerList } from "../utils";

/** Data type for roots/contents object sets */
export type objectSetType = { name?: string; card?: GridCardExport; count?: number; objectIds: number[] };

export default class RootModel extends Model {
	// Typescript hacks
	class: typeof RootModel;
	static meta: ModelMeta<RootModel>;

	/** Metadata for behaviour as a root */
	static rootModelMeta: {
		hasRoots: boolean;
		rootsName?: string;
		rootsCard?: GridCardExport;
		rootsFilterParam?: string;

		contentsName: string;
		contentsCard: GridCardExport;
		contentsFilterParam: string;
		contentsClass: typeof Model;
	};

	/** List of base root objects */
	private static absoluteRoots: number[] = null;

	/**
	 * Retrieve or load base root objects
	 * @returns ObjectSets for roots and empty contents
	 */
	static async getAbsoluteRoots(): Promise<{ roots: objectSetType; contents: objectSetType }> {
		let roots: objectSetType;
		if (this.absoluteRoots === null) {
			const rootsData = await this.loadFiltered({ [this.rootModelMeta.rootsFilterParam]: null });
			roots = { count: rootsData.count, objectIds: rootsData.objects.map(root => root.id) };
			this.absoluteRoots = roots.objectIds;
		} else roots = { count: this.absoluteRoots.length, objectIds: this.absoluteRoots };

		roots.name = this.rootModelMeta.rootsName;
		roots.card = this.rootModelMeta.rootsCard;

		return { roots: roots, contents: { count: 0, objectIds: [], name: this.rootModelMeta.contentsName, card: this.rootModelMeta.contentsCard } };
	}

	/** List of root objects for each search term (`null` key for no search) */
	private roots = new Map<string, number[]>();

	/** List of contents objects for each search term (`null` key for no search) */
	private contents = new Map<string, { count: number; objectIds: number[] }>();

	/** Handler functions to run when the roots/contents are updated */
	private contentsUpdateHandlers: UpdateHandlerList = new UpdateHandlerList(null, async (contentData: any, success: (data: any) => void, error: (error: any) => void) => {
		try {
			const data = await this.getContents(contentData.page, contentData.pageSize, contentData.searchQuery);
			success(data);
		} catch (err) {
			error(err);
		}
	});

	/**
	 * Retrieve or load child root objects
	 * @param searchQuery Current search query
	 * @returns IDs of root objects found
	 */
	private async getRoots(searchQuery?: string): Promise<objectSetType | null> {
		if (!this.class.rootModelMeta.hasRoots) return null;
		searchQuery = searchQuery || null;

		// Get from previously loaded roots
		let existingRootIds = this.roots.get(searchQuery);
		if (existingRootIds !== undefined) return { objectIds: existingRootIds };

		// Load from server
		const rootsData = await this.class.loadFiltered({ [this.class.rootModelMeta.rootsFilterParam]: this.id, ...(searchQuery ? { search: searchQuery } : {}) });

		// Save to stored roots
		let objectIds = rootsData.objects.map(object => object.id);
		this.roots.set(searchQuery, objectIds);

		return { objectIds: objectIds };
	}

	/**
	 * Retrieve or load contents objects
	 * @param page Current page number
	 * @param pageSize Page size
	 * @param searchQuery Current search query
	 * @returns Total number of results, and IDs from requested page
	 */
	private async getContentObjects(page: number, pageSize: number, searchQuery?: string): Promise<objectSetType> {
		searchQuery = searchQuery || null;

		// Get from previously loaded content
		let existingContents = this.contents.get(searchQuery);
		if (existingContents !== undefined) {
			if (existingContents.count > 0 && (page - 1) * pageSize >= existingContents.count) throw { detail: "Invalid page." };
			let pageIds = existingContents.objectIds.slice((page - 1) * pageSize, page * pageSize);
			if (pageIds.every(id => id !== null)) return { count: existingContents.count, objectIds: pageIds };
		}

		// Load from server
		const contentsData = await this.class.rootModelMeta.contentsClass.loadFiltered(
			{ [this.class.rootModelMeta.contentsFilterParam]: this.id, ...(searchQuery ? { search: searchQuery } : {}) },
			page,
			pageSize
		);

		// Save to stored content
		let oldIds = existingContents !== undefined ? existingContents.objectIds : new Array(contentsData.count).fill(null);
		let newIds = contentsData.objects.map(object => object.id);
		let allObjectIds = oldIds.slice(0, (page - 1) * pageSize).concat(newIds.concat(oldIds.slice(page * pageSize)));
		this.contents.set(searchQuery, {
			count: contentsData.count,
			objectIds: allObjectIds
		});

		return { count: contentsData.count, objectIds: newIds };
	}

	/**
	 * Get all contents
	 * @param page Current page number
	 * @param pageSize Page size
	 * @param searchQuery Current search query
	 * @returns ObjectSet for roots (may be `null`) and contents
	 */
	async getContents(page: number, pageSize: number, searchQuery?: string): Promise<{ roots: objectSetType | null; contents: objectSetType }> {
		var roots = await this.getRoots(searchQuery);
		if (roots !== null) {
			roots.name = this.class.rootModelMeta.rootsName;
			roots.card = this.class.rootModelMeta.rootsCard;
		}

		var contents = await this.getContentObjects(page, pageSize, searchQuery);
		contents.name = this.class.rootModelMeta.contentsName;
		contents.card = this.class.rootModelMeta.contentsCard;

		return { roots: roots, contents: contents };
	}

	/** Register update handler function for roots/contents */
	registerContentsUpdateHandler(
		page: number,
		pageSize: number,
		searchQuery: string,
		callback: (data: { roots: objectSetType; contents: objectSetType }) => void,
		errorCallback: (error: any) => void
	) {
		return this.contentsUpdateHandlers.register(callback, errorCallback, { page: page, pageSize: pageSize, searchQuery: searchQuery });
	}

	/** Clear (out-of-date) local data (contents and roots) */
	resetData() {
		this.roots = new Map<string, number[]>();
		this.contents = new Map<string, { count: number; objectIds: number[] }>();
		this.contentsUpdateHandlers.handle();
	}

	/**
	 * Remove items from local contents data (after it has been moved/deleted)
	 * @param ids IDs of the objects to remove
	 */
	removeContentsItems(ids: number[]) {
		for (let entry of this.contents) {
			entry[1].count -= entry[1].objectIds.filter(objId => ids.includes(objId)).length;
			entry[1].objectIds = entry[1].objectIds.filter(objId => !ids.includes(objId));
			this.contents.set(entry[0], entry[1]);
		}
		this.contentsUpdateHandlers.handle();
	}
}
