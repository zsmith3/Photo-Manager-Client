import FaceCard from "../components/MainPage/MainView/cards/FaceCard";
import { Database, DBTables } from "../controllers/Database";
import { AuthGroup } from "./AuthGroup";
import { Face } from "./Face";
import { Model, ModelMeta } from "./Model";
import RootModel from "./RootModel";

/** Person Group model */
export class PersonGroup extends Model {
	/** Person group model metadata */
	static meta = new ModelMeta<PersonGroup>({
		modelName: DBTables.PersonGroup,
		props: ["id", "name"],
		specialProps: { access_groups: "accessGroupIds" }
	});

	/**
	 * Create a new Person Group and add it to the remote database
	 * @param name Name of the group
	 * @returns Promise object representing new group
	 */
	static create(name: string, accessGroupIds: number[]): Promise<PersonGroup> {
		return new Promise(function(resolve, reject) {
			Database.create(PersonGroup.meta.modelName, { name: name, access_groups: accessGroupIds })
				.then(function(data) {
					let newGroup = PersonGroup.addObject(data);
					// App.app.els.navDrawer.addPersonGroup(newGroup);
					resolve(newGroup);
				})
				.catch(reject);
		});
	}

	id: number;

	/** Name of group */
	name: string;

	/** People within group */
	get people(): Person[] {
		return Person.meta.objects.filter(person => person.group && person.group.id == this.id);
	}

	/** Number of people within group */
	get person_count(): number {
		return this.people.length;
	}

	/** Access user group IDs */
	accessGroupIds: number[];

	/** Access user groups */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

	/**
	 * Delete person group from the remote database
	 * @returns Promise object representing completion
	 */
	delete() {
		return new Promise<void>((resolve, reject) => {
			Database.delete(PersonGroup.meta.modelName, this.id)
				.then(() => {
					PersonGroup.deleteById(this.id);
					// App.app.els.navDrawer.deletePersonGroup(this.id);
					resolve();
				})
				.catch(reject);
		});
	}

	/**
	 * Change user access groups for this PersonGroup
	 * @param accessGroupIds New access group IDs
	 * @param propagate Whether to propagate change to contained people
	 * @returns Promise representing completion
	 */
	updateAccessGroups(accessGroupIds: number[], propagate: boolean) {
		this.accessGroupIds = accessGroupIds;
		if (propagate) this.people.forEach(person => (person.accessGroupIds = accessGroupIds));
		return Database.update(this.class.meta.modelName, this.id, { access_groups: accessGroupIds, propagate_ag: propagate }, true);
	}
}

/** Person model */
export class Person extends RootModel {
	/** Person model metadata */
	static meta = new ModelMeta<Person>({
		modelName: DBTables.Person,
		props: ["id", "full_name", "face_count", "face_count_confirmed", "thumbnail"],
		specialProps: { group: "groupID", access_groups: "accessGroupIds" }
	});

	static rootModelMeta = {
		contentsName: "Faces",
		contentsCard: FaceCard,
		contentsFilterParam: "person",
		contentsClass: Face,
		hasRoots: false
	};

	/**
	 * Create a new Person and add to the remote database
	 * @param name Name of the new person
	 * @param groupID ID of the person group to add to
	 * @param accessGroupIds IDs of access groups for new person to belong to
	 * @returns Promise object representing new Person
	 */
	static create(name: string, groupID: number, accessGroupIds: number[]): Promise<Person> {
		return new Promise((resolve, reject) => {
			Database.create(Person.meta.modelName, {
				full_name: name,
				group: groupID,
				access_groups: accessGroupIds
			})
				.then(data => {
					let newPerson = Person.addObject(data);
					// App.app.els.navDrawer.addPerson(newPerson);
					// App.app.els.navDrawer.updateGroupPersonCount(newPerson.group.id);

					resolve(newPerson);
				})
				.catch(reject);
		});
	}

	id: number;

	/** Full name of the person */
	full_name: string;

	/** Number of faces identified as this person */
	face_count: number;

	/** Number of faces confirmed to be this person */
	face_count_confirmed: number;

	/** ID of the Face used as a thumbnail for this person */
	thumbnail: number;

	/** ID of group to which person belongs */
	private groupID: number;

	/** Group to which person belongs */
	get group() {
		return PersonGroup.getById(this.groupID);
	}

	/** Number of unconfirmed faces identified as this person */
	get face_count_unconfirmed() {
		return this.face_count - this.face_count_confirmed;
	}

	/** Handler functions to be run when associated faces are updated */
	faceListUpdateHandlers: ((faces: Face[]) => void)[] = [];

	/** Access user group IDs */
	accessGroupIds: number[];

	/** Access user groups */
	get access_groups(): AuthGroup[] {
		return this.accessGroupIds.map(id => AuthGroup.getById(id));
	}

	/**
	 * Delete person from remote database
	 * @returns Promise representing completion
	 */
	delete() {
		return new Promise<void>((resolve, reject) => {
			Database.delete(Person.meta.modelName, this.id)
				.then(() => {
					let unknownPerson = Person.getById(0);
					unknownPerson.update({ face_count: unknownPerson.face_count + this.face_count });
					unknownPerson.resetData();
					Person.deleteById(this.id);
					resolve();
				})
				.catch(reject);
		});
	}

	/**
	 * Change user access groups for this Person
	 * @param accessGroupIds New access group IDs
	 * @returns Promise representing completion
	 */
	updateAccessGroups(accessGroupIds: number[]) {
		this.accessGroupIds = accessGroupIds;
		// for (let accessGroupId of accessGroupIds) if (!this.group.accessGroupIds.includes(accessGroupId)) this.group.accessGroupIds.push(accessGroupId);
		return Database.update(this.class.meta.modelName, this.id, { access_groups: accessGroupIds }, true);
	}
}
