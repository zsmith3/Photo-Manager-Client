// Person Group class
class PersonGroup {
	// Construct Person Group from object
	constructor (object) {
		for (var property in object) this[property] = object[property];

		this.people = Person.createFromList(object.people);
	}

	delete () {
		let personGroup = this;
		apiRequest("people-groups/" + this.id + "/", "DELETE").then(function () {
			PersonGroup.deleteById(personGroup.id);
			navigationDrawer.deletePersonGroup(personGroup.id);
		});
	}
}

PersonGroup.groups = [];

PersonGroup.createFromList = function (list) {
	let groups = [];
	for (var i in list) {
		groups.push(new PersonGroup(list[i]));
	}
	return groups;
};

PersonGroup.getById = function (id) {
	for (var i in PersonGroup.groups) {
		if (PersonGroup.groups[i].id == id) {
			return PersonGroup.groups[i];
		}
	}
};

PersonGroup.deleteById = function(id) {
	for (var i in PersonGroup.groups) {
		if (PersonGroup.groups[i].id == id) {
			delete PersonGroup.groups[i];
			break;
		}
	}
};

PersonGroup.create = function (name) {
	return new Promise(function (resolve, reject) {
		apiRequest("people-groups/", "POST", { name: name }).then(function (data) {
			PersonGroup.groups.push(new PersonGroup(data));
			navigationDrawer.addPersonGroup(PersonGroup.getById(data.id));
			resolve(data);
		});
	});
};


// Person class
class Person {
	// Construct Person from object
	constructor (object) {
		for (var property in object) if (property != "group") this[property] = object[property];

		this.groupId = object.group;
	}

	delete () {
		let person = this;
		apiRequest("people/" + this.id + "/", "DELETE").then(function () {
			Person.deleteById(person.id);
			person.group.person_count--;
			navigationDrawer.deletePerson(person);
		});
	}

	get group () { return PersonGroup.getById(this.groupId); }
}

Person.createFromList = function (list) {
	let people = [];
	for (var i in list) {
		people.push(new Person(list[i]));
	}
	return people;
};

Person.getById = function (id) {
	for (var i in PersonGroup.groups) {
		let people = PersonGroup.groups[i].people;
		for (var j in people) {
			if (people[j].id == id) return people[j];
		}
	}
};

Person.deleteById = function (id) {
	for (var i in PersonGroup.groups) {
		let people = PersonGroup.groups[i].people;
		for (var j in people) {
			if (people[j].id == id) delete PersonGroup.groups[i].people[j];
		}
	}
};

Person.create = function (group, name) {
	return new Promise(function (resolve, reject) {
		apiRequest("people/", "POST", { full_name: name, group: group }).then(function (data) {
			PersonGroup.getById(group).people.push(new Person(data));
			PersonGroup.getById(group).person_count++;
			navigationDrawer.addPerson(Person.getById(data.id));
			navigationDrawer.updateGroupPersonCount(group);

			resolve(data);
		});
	});
};

// TODO:
// 1) removing people
// 2) ordering (of both people and groups)
// 3) people pages
