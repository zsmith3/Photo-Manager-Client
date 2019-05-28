import { Folder, Person } from "../../../../models";
import { makeGridView } from "./GridView";

export { default as View } from "./View";

/** Standard Folder-based grid display */
export const FolderView = makeGridView(Folder);

/** Standard Person-based grid display */
export const PersonView = makeGridView(Person);
