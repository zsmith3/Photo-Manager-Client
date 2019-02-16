import { GridCardExport } from "./BaseGridCard";
import { SelectMode } from ".";
import { FileObject, Folder, Face } from "../../../models";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";
import FaceCard from "./FaceCard";

/** Type for data parameter to ObjectSet constructor */
export type objectSetDataType = { count: number, objects: (FileObject | Folder | Face)[] };

/** Object set for use in FilesContainer */
export default class ObjectSet {
  /** ID to identify this set of objects */
	id: number;

	/** Display name for object set */
  name: string;

  /** Total number of models in set (without pagination) */
  totalCount: number

	/** IDs of Model instances to display */
	objectIds: number[];

	/** GridCard component to display for each instance */
	card: GridCardExport;

	/** List of IDs of selected objects */
	selection: number[] = [];

	/** ID of last selected object */
  lastSelected: number;

  paginated: boolean

  constructor (data: objectSetDataType, name?: string) {
    if (data.objects.length === 0) return; // TODO

    // Get type of data
    let type: ("Files" | "Folders" | "Faces");
    if (data.objects[0] instanceof FileObject) type = "Files";
    else if (data.objects[0] instanceof Folder) type = "Folders";
    else if (data.objects[0] instanceof Face) type = "Faces";

    // Set GridCard from model type
    this.card = { Files: FileCard, Folders: FolderCard, Faces: FaceCard }[type];

    // Set name (defaults to model type)
    this.name = name || type;

    // Set objectIds
    this.objectIds = data.objects.map(object => object.id);

    // Set total model count
    this.totalCount = data.count;

    // TODO THIS IS NOT GOOD
    if (this.totalCount === this.objectIds.length) this.paginated = false;
    else this.paginated = true;

    // Set lastSelected as first item (if available)
    this.lastSelected = this.objectIds.length > 0 ? this.objectIds[0] : null;
  }
}
