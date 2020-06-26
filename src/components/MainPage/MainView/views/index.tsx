import { Album, Folder, Person, ScanFolder } from "../../../../models";
import { makeGridView } from "./GridView";

export { default as View } from "./View";

/** Standard Folder-based grid display */
export const FolderView = makeGridView(Folder);

/** Standard Album-based grid display */
export const AlbumView = makeGridView(Album);

/** Standard Person-based grid display */
export const PersonView = makeGridView(Person);

/** Standard ScanFolder-based grid display */
export const ScanView = makeGridView(ScanFolder);
