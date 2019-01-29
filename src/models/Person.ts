import { Model, ModelMeta } from "./Model"
import { Database, DBTables } from "../controllers/Database"
import App from "../components/App"
import { Face } from "./Face";


/** Person Group model */
export class PersonGroup extends Model {
	/** Person group model metadata */
	static meta = new ModelMeta<PersonGroup>({
		modelName: DBTables.PersonGroup,
		props: ["id", "name"]
	});


	/**
	 * Create a new Person Group and add it to the remote database
	 * @param name Name of the group
	 * @returns Promise object representing new group
	 */
	static create (name: string): Promise<PersonGroup> {
		return new Promise(function (resolve, reject) {
			Database.create(PersonGroup.meta.modelName, { name: name }).then(function (data) {
				let newGroup = PersonGroup.addObject(data);
				// App.app.els.navDrawer.addPersonGroup(newGroup);
				resolve(newGroup);
			}).catch(reject);
		});
	}


	id: number

	/** Name of group */
	name: string

	/** People within group */
	get people (): Person[] { return Person.meta.objects.filter(person => person.group.id == this.id) }

	/** Number of people within group */
	get person_count (): number { return this.people.length; }


	/**
	 * Delete person group from the remote database
	 * @returns Promise object representing completion
	 */
	delete (): Promise<never> {
		return new Promise((resolve, reject) => {
			Database.delete(PersonGroup.meta.modelName, this.id).then(() => {
				PersonGroup.deleteById(this.id);
				// App.app.els.navDrawer.deletePersonGroup(this.id);
				resolve();
			}).catch(reject);
		});
	}
}


/** Person model */
export class Person extends Model {
	/** Person model metadata */
	static meta = new ModelMeta<Person>({
		modelName: DBTables.Person,
		props: ["id", "full_name", "face_count", "thumbnail"],
		specialProps: { "group": "groupID" }
	});


	/**
	 * Create a new Person and add to the remote database
	 * @param name Name of the new person
	 * @param groupID ID of the person group to add to
	 * @returns Promise object representing new Person
	 */
	static create (name: string, groupID?: number): Promise<Person> {
		return new Promise((resolve, reject) => {
			Database.create(Person.meta.modelName, { full_name: name, group: groupID }).then(data => {
				let newPerson = Person.addObject(data);
				// App.app.els.navDrawer.addPerson(newPerson);
				// App.app.els.navDrawer.updateGroupPersonCount(newPerson.group.id);

				resolve(newPerson);
			}).catch(reject);
		});
	}


	id: number

	/** Full name of the person */
	full_name: string

	/** Number of faces identified as this person */
	face_count: number

	/** ID of the Face used as a thumbnail for this person */
	thumbnail: number

	/** ID of group to which person belongs */
	private groupID: number

	/** Group to which person belongs */
	get group () { return PersonGroup.getById(this.groupID); }

	// /** IDs of faces identified as belonging to person */
	// private faceIds: number[]

	/** Handler functions to be run when associated faces are updated */
	faceListUpdateHandlers: ((faces: Face[]) => void)[] = []

	/** Whether faces have been loaded yet */
	loadedFaces: boolean


	/**
	 * Delete person from remote database
	 * @returns Promise representing completion
	 */
	delete () {
		return new Promise((resolve, reject) => {
			Database.delete(Person.meta.modelName, this.id).then(() => {
				// App.app.els.navDrawer.deletePerson(this);
				Person.deleteById(this.id);
				resolve();
			}).catch(reject);
		});
	}

	/**
	 * Load faces identified as belonging to person
	 * @returns Promise representing faces loaded
	 */
	async getFaces (): Promise<Face[]> {
		if (this.loadedFaces) return Face.meta.objects.filter(face => face.personID === this.id); // this.faceIds.map(id => Face.getById(id));
		else {
			const faces = await Face.loadFiltered({ person: this.id });
			this.loadedFaces = true;
			return faces;
		}
	}

	/**
	 * Run handler functions when associated face list is updated
	 * @returns Promise representing completion
	 */
	async handleFaceListUpdate () {
		const faces = await this.getFaces();
		this.faceListUpdateHandlers.forEach(callback => callback(faces));
	}
}