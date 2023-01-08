import { Model } from ".";
import { AuthGroup } from "./AuthGroup";
import { GridCardExport } from "../components/MainPage/MainView/cards/BaseGridCard";
import { Database } from "../controllers/Database";
import { UpdateHandlerList } from "../utils";
import { ModelMeta } from "./Model";

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

	/**
	 * Encode query options as key for map
	 * @param searchQuery The current search query (null if none)
	 * @param options Other query parameters
	 */
	protected static encodeKey(searchQuery?: string, options?: object) {
		const defaultOptions = { isf: false };
		return JSON.stringify({ search: searchQuery, ...Object.assign(defaultOptions, options) });
	}

	/** List of root objects for each (JSON-encoded) query */
	protected roots = new Map<string, number[]>();

	/** List of contents objects for each (JSON-encoded) query */
	protected contents = new Map<string, { count: number; objectIds: number[] }>();

	/** Handler functions to run when the roots/contents are updated */
	protected contentsUpdateHandlers: UpdateHandlerList = new UpdateHandlerList(null, async (contentData: any, success: (data: any) => void, error: (error: any) => void) => {
		try {
			const data = await this.getContents(contentData.page, contentData.pageSize, contentData.searchQuery, contentData.options);
			success(data);
		} catch (err) {
			error(err);
		}
	});

	/**
	 * Retrieve or load child root objects
	 * @param searchQuery Current search query
	 * @param options Additional options
	 * @returns IDs of root objects found
	 */
	private async getRoots(searchQuery?: string, options?: object): Promise<objectSetType | null> {
		if (!this.class.rootModelMeta.hasRoots) return null;
		searchQuery = searchQuery || null;
		let queryKey = RootModel.encodeKey(searchQuery, options);

		// Get from previously loaded roots
		let existingRootIds = this.roots.get(queryKey);
		if (existingRootIds !== undefined) return { objectIds: existingRootIds };

		// Load from server
		const rootsData = await this.class.loadFiltered({ [this.class.rootModelMeta.rootsFilterParam]: this.id, ...(searchQuery ? { search: searchQuery } : {}), ...options });

		// Save to stored roots
		let objectIds = rootsData.objects.map(object => object.id);
		this.roots.set(queryKey, objectIds);

		return { objectIds: objectIds };
	}

	/**
	 * Retrieve or load contents objects
	 * @param page Current page number
	 * @param pageSize Page size
	 * @param searchQuery Current search query
	 * @param options Additional options
	 * @returns Total number of results, and IDs from requested page
	 */
	private async getContentObjects(page: number, pageSize: number, searchQuery?: string, options?: object): Promise<objectSetType> {
		searchQuery = searchQuery || null;
		let queryKey = RootModel.encodeKey(searchQuery, options);

		// Get from previously loaded content
		let existingContents = this.contents.get(queryKey);
		if (existingContents !== undefined) {
			if (existingContents.count > 0 && (page - 1) * pageSize >= existingContents.count) throw { detail: "Invalid page." };
			let pageIds = existingContents.objectIds.slice((page - 1) * pageSize, page * pageSize);
			if (pageIds.every(id => id !== null)) return { count: existingContents.count, objectIds: pageIds };
		}

		// Load from server
		const contentsData = await this.class.rootModelMeta.contentsClass.loadFiltered(
			{ [this.class.rootModelMeta.contentsFilterParam]: this.id, ...(searchQuery ? { search: searchQuery } : {}), ...options },
			page,
			pageSize
		);

		// Save to stored content
		let oldIds = existingContents !== undefined ? existingContents.objectIds : new Array(contentsData.count).fill(null);
		let newIds = contentsData.objects.map(object => object.id);
		let allObjectIds = oldIds.slice(0, (page - 1) * pageSize).concat(newIds.concat(oldIds.slice(page * pageSize)));
		this.contents.set(queryKey, {
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
	 * @param options Additional options (e.g. isf)
	 * @returns ObjectSet for roots (may be `null`) and contents
	 */
	async getContents(page: number, pageSize: number, searchQuery?: string, options?: object): Promise<{ roots: objectSetType | null; contents: objectSetType }> {
		var roots = await this.getRoots(searchQuery, options);
		if (roots !== null) {
			roots.name = this.class.rootModelMeta.rootsName;
			roots.card = this.class.rootModelMeta.rootsCard;
		}

		var contents = await this.getContentObjects(page, pageSize, searchQuery, options);
		contents.name = this.class.rootModelMeta.contentsName;
		contents.card = this.class.rootModelMeta.contentsCard;

		return { roots: roots, contents: contents };
	}

	/** Register update handler function for roots/contents */
	registerContentsUpdateHandler(
		page: number,
		pageSize: number,
		searchQuery: string,
		options: object,
		callback: (data: { roots: objectSetType; contents: objectSetType }) => void,
		errorCallback: (error: any) => void
	) {
		return this.contentsUpdateHandlers.register(callback, errorCallback, { page: page, pageSize: pageSize, searchQuery: searchQuery, options: options });
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
		for (let id of ids) {
			let obj = this.class.rootModelMeta.contentsClass.getById(id);
			if (obj) {
				obj.deleted = true;
				obj.updateHandlers.handle(obj);
			}
		}
		this.contentsUpdateHandlers.handle();
	}
}

/** Type for contents models with access groups  */
interface ContentsWithAccessGroups extends Model {
	accessGroupIds: number[];
}

/** RootModel with ability to propagate access group changes through hierarchy (i.e. Folder, Album, ScanFolder) */
export class RootModelWithAccessGroups extends RootModel {
	// Typescript hacks
	class: typeof RootModelWithAccessGroups;
	static meta: ModelMeta<RootModelWithAccessGroups>;

	/** ID of parent model (folder/album) */
	parentID: number;

	/** Parent folder */
	getParent(): RootModelWithAccessGroups {
		if (this.parentID === null) return null;
		else return (this.class.getById(this.parentID) || undefined) as RootModelWithAccessGroups;
	}

	/** Access user group IDs */
	accessGroupIds: number[];

	/** Access user groups */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

	/**
	 * Change user access groups for this folder
	 * @param accessGroupIds New access group IDs
	 * @param propagate Whether to propagate change to child folders
	 * @param save Whether to save changes to remote database
	 * @returns Promise representing completion
	 */
	updateAccessGroups(accessGroupIds: number[], propagate: boolean, save = true) {
		this.accessGroupIds = accessGroupIds;
		this.addAccessGroupsToParents(accessGroupIds);
		if (propagate) {
			this.class.meta.objects.filter(obj => obj.parentID === this.id).forEach(obj => obj.updateAccessGroups(accessGroupIds, true, false));
			let allContentIds = [];
			for (let entry of this.contents) allContentIds = allContentIds.concat(entry[1].objectIds);
			allContentIds = allContentIds.filter((v, i, a) => a.indexOf(v) === i);
			allContentIds.forEach(id => ((this.class.rootModelMeta.contentsClass.getById(id) as ContentsWithAccessGroups).accessGroupIds = accessGroupIds));
		}
		if (save) return Database.update(this.class.meta.modelName, this.id, { access_groups: accessGroupIds, propagate_ag: propagate }, true);
	}

	/**
	 * Recursively add new access groups to parent albums
	 * @param newAccessGroupIds Full (new) set of access group IDs for child album
	 */
	addAccessGroupsToParents(newAccessGroupIds: number[]) {
		for (let groupId of newAccessGroupIds) if (!this.accessGroupIds.includes(groupId)) this.accessGroupIds.push(groupId);
		const parent = this.getParent();
		if (parent !== null) parent.addAccessGroupsToParents(newAccessGroupIds);
	}
}
