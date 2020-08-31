import { FileObject, Person } from ".";
import { LocationManager } from "../components/utils";
import { DBTables } from "../controllers/Database";
import { FaceImgSizes, Platform } from "../controllers/Platform";
import { Model, ModelMeta } from "./Model";

/** Face model */
export class Face extends Model {
	/** Face model metadata */
	static meta = new ModelMeta<Face>({
		modelName: DBTables.Face,
		props: ["id", "rect_x", "rect_y", "rect_w", "rect_h", "status"],
		specialProps: {
			person: "personID",
			file: {
				deserialize: (face: Face, prop: { id: number }) => {
					face.fileID = FileObject.addObject(prop).id;
				}
			}
		}
	});

	id: number;

	/** X co-ordinate of centre of face bounding box */
	rect_x: number;

	/** Y co-ordinate of centre of face bounding box */
	rect_y: number;

	/** Width of face bounding box */
	rect_w: number;

	/** Height of face bounding box */
	rect_h: number;

	/** Identification status of face */
	status: 0 | 1 | 2 | 3 | 4 | 5;

	/** ID of Person assigned to face */
	personID: number;

	/** Person assigned to face */
	get person(): Person {
		return Person.getById(this.personID);
	}

	/** ID of image file in which face is found */
	fileID: number;

	/** Image file in which face is found */
	get file(): FileObject {
		return FileObject.getById(this.fileID);
	}

	/** Local storage of image data for face */
	imageData: Map<FaceImgSizes, string> = new Map<FaceImgSizes, string>();

	/** Material icon to use in place of image data */
	imageMaterialIcon = "face";

	/**
	 * Get (and load if needed) image data for this face
	 * @param size The size at which to load the image
	 * @param queue Whether to queue image loading
	 * @returns Base64 data url for image
	 */
	async loadImgData(size: FaceImgSizes, queue: boolean): Promise<string> {
		let data = this.imageData.get(size);
		if (data) return data;
		else {
			const data = await Platform.getImgSrc(this, "face", size, queue);
			this.imageData.set(size, data);
			return data;
		}
	}

	/**
	 * Get the largest already-loaded size for face image data,
	 * up to a given maximum size
	 * @param size The maximum size to look for
	 * @returns The best size found
	 */
	getBestImgSize(size: FaceImgSizes): FaceImgSizes {
		let bestInd = null as FaceImgSizes;
		let entries = this.imageData.entries();
		while (true) {
			let next = entries.next();
			if (next.done) break;

			let pair = next.value;
			if ((bestInd === null || pair[0] > bestInd) && pair[0] <= size) bestInd = pair[0];
		}
		return bestInd;
	}

	/** Open the image file to which the face belongs */
	open(): void {
		LocationManager.updateQuery({ face: this.id.toString() });
	}

	/**
	 * Assign face to a person
	 * @param personId ID of the person to assign
	 * @returns Promise object representing completion
	 */
	async setPerson(personID: number): Promise<void> {
		let oldPerson = this.person;
		let oldStatus = this.status;
		await this.updateSave({ person: personID, status: personID !== 0 ? 1 : 3 });
		oldPerson.update({ face_count: oldPerson.face_count - 1, ...(oldStatus <= 1 ? { face_count_confirmed: oldPerson.face_count_confirmed - 1 } : {}) });
		oldPerson.removeContentsItems([this.id]);
		this.person.update({ face_count: this.person.face_count + 1, face_count_confirmed: this.person.face_count_confirmed + 1 });
	}

	/**
	 * Set identification status of face
	 * @param status Status to set to
	 * @returns Promise object representing completion
	 */
	setStatus(status: 0 | 1 | 2 | 3 | 4 | 5): Promise<void> {
		if (this.status >= 2 && status <= 1) this.person.update({ face_count_confirmed: this.person.face_count_confirmed + 1 });
		else if (this.status <= 1 && status >= 2) this.person.update({ face_count_confirmed: this.person.face_count_confirmed - 1 });
		if (status >= 4) {
			this.person.update({ face_count: this.person.face_count - 1 });
			this.person.removeContentsItems([this.id]);
		}
		return this.updateSave({ status: status });
	}
}
