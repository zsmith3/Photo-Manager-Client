import { Model } from "./Model"
import { Database, DBTables } from "../controllers/Database"
import App from "../components/App"


/** Person Group model */
export class PersonGroup extends Model {
	/** Local instances of Person Group */
	static objects: PersonGroup[] = []

	static modelName = DBTables.PersonGroup

	static props = ["id", "name"]

	/** Update handlers for the list of Person Group models */
	static listUpdateHandlers: ((models: PersonGroup[]) => void)[] = []


	/**
	 * Create a new Person Group and add it to the remote database
	 * @param name Name of the group
	 * @returns Promise object representing new group
	 */
	static create (name: string): Promise<PersonGroup> {
		return new Promise(function (resolve, reject) {
			Database.create("people-groups", { name: name }).then(function (data) {
				let newGroup = PersonGroup.addObject(data);
				App.app.els.navDrawer.addPersonGroup(newGroup);
				resolve(newGroup);
			}).catch(reject);
		});
	}


	id: number

	/** Name of group */
	name: string

	/** People within group */
	get people (): Person[] { return Person.objects.filter(person => person.group.id == this.id) }

	/** Number of people within group */
	get person_count (): number { return this.people.length; }


	/**
	 * Delete person group from the remote database
	 * @returns Promise object representing completion
	 */
	delete (): Promise<never> {
		return new Promise((resolve, reject) => {
			Database.delete("people-groups", this.id).then(() => {
				PersonGroup.deleteById(this.id);
				App.app.els.navDrawer.deletePersonGroup(this.id);
				resolve();
			}).catch(reject);
		});
	}
}


/** Person model */
export class Person extends Model {
	/** Local instances of Person */
	static objects: Person[] = []

	static modelName = DBTables.Person

	static props = ["id", "name", "face_count", "groupID"]

	static specialProps = {
		"group": (person: Person, prop: number) => { person.groupID = prop; }
	}


	/**
	 * Create a new Person and add to the remote database
	 * @param name Name of the new person
	 * @param groupID ID of the person group to add to
	 * @returns Promise object representing new Person
	 */
	static create (name: string, groupID?: number): Promise<Person> {
		return new Promise((resolve, reject) => {
			Database.create("people", { full_name: name, group: groupID }).then((data) => {
				let newPerson = Person.addObject(data);
				App.app.els.navDrawer.addPerson(newPerson);
				App.app.els.navDrawer.updateGroupPersonCount(newPerson.group.id);

				resolve(newPerson);
			}).catch(reject);
		});
	}


	id: number

	/** Full name of the person */
	name: string

	/** Number of faces identified as this person */
	face_count: number

	/** ID of group to which person belongs */
	private groupID: number

	/** Group to which person belongs */
	get group () { return PersonGroup.getById(this.groupID); }


	/**
	 * Delete person from remote database
	 * @returns Promise object representing completion
	 */
	delete () {
		return new Promise((resolve, reject) => {
			Database.delete("people", this.id).then(() => {
				App.app.els.navDrawer.deletePerson(this);
				Person.deleteById(this.id);
				resolve();
			}).catch(reject);
		});
	}

	// TODO:
	// 1) removing people
	// 2) ordering (of both people and groups)
	// 3) people pages
}
