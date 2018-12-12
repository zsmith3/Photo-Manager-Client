import { FileObject, Person } from ".";
import App from "../components/App";
import { Database, DBTables } from "../controllers/Database";
import { Model, ModelMeta } from "./Model";


/** Face model */
export class Face extends Model {
	/** Face model metadata */
	static meta = new ModelMeta<Face>({
		modelName: DBTables.Face,
		props: ["id", "rect_x", "rect_y", "rect_w", "rect_h", "file", "status"],
		// TODO think file will need to be under specialProps
		specialProps: { "person": "personID" }
	});


	id: number

	/** X co-ordinate of centre of face bounding box */
	rect_x: number

	/** Y co-ordinate of centre of face bounding box */
	rect_y: number

	/** Width of face bounding box */
	rect_w: number

	/** Height of face bounding box */
	rect_h: number

	/** Image file in which face is found */
	file: FileObject

	/** Identification status of face */
	status: (0 | 1 | 2 | 3 | 4 | 5)

	/** ID of Person assigned to face */
	private personID: number

	/** Person assigned to face */
	get person (): Person { return Person.getById(this.personID); }

	/** Local storage of image data for face */
	data: object


	/** Open the image file to which the face belongs */
	open (): void {
		this.file.open();
	}

	/**
	 * Assign face to a person
	 * @param personId ID of the person to assign
	 * @returns Promise object representing completion
	 */
	setPerson (personID: number): Promise<never> {
		let oldID = this.person.id;
		return new Promise((resolve, reject) => {
			Database.update("faces", this.id, { person: personID, status: 1 }).then(data => {
				App.app.els.navDrawer.updatePersonFaceCount(personID);
				App.app.els.navDrawer.updatePersonFaceCount(oldID);
				this.update(data);
				if (App.app.data.folderType == "people" && App.app.data.person.id != personID) {
					App.app.els.filesCont.removeFile(this.id);
				}
				resolve();
			}).catch(reject);
		});
	}

	/**
	 * Set identification status of face
	 * @param status Status to set to
	 * @returns Promise object representing completion
	 */
	setStatus (status): Promise<never> {
		return new Promise((resolve, reject) => {
			Database.update("faces", this.id, { status: status }).then(data => {
				this.update(data);
				App.app.els.filesCont.getFilebox(this.id).showIcons();

				if (status >= 4) {
					App.app.els.navDrawer.updatePersonFaceCount(this.personID);

					if (App.app.data.folderType == "people") {
						App.app.els.filesCont.removeFile(this.id);
					}
				}

				resolve();
			}).catch(reject);
		});
	}
}
