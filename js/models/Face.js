// Face class
class Face {
	// Construct Face from object
	constructor (object) {
		for (var property in object) if (property != "person") this[property] = object[property];

		this.personId = object.person;

		this.file.parent = this.id;
		this.file = new FileObject(this.file);
		this.file.type = "image";

		this.data = {};
	}

	get person () { return Person.getById(this.personId); }

	open () {
		this.file.open();
	}

	setPerson (personId) {
		let face = this;
		apiRequest("faces/" + this.id + "/", "PATCH", {person: personId, status: 1}).then(function (data) {
			Person.getById(personId).face_count++;
			navigationDrawer.updatePersonFaceCount(personId);
			Person.getById(face.personId).face_count--;
			navigationDrawer.updatePersonFaceCount(face.personId);
			if (pageLoader.data.folderType == "people" && pageLoader.data.person.id != personId) {
				pageLoader.filesContainer.removeFile(face.id);
			}
		});
	}

	setStatus (status) {
		let face = this;
		apiRequest("faces/" + this.id + "/", "PATCH", {status: status}).then(function (data) {
			pageLoader.filesContainer.getFile(face.id).status = status;
			pageLoader.filesContainer.getFilebox(face.id).showIcons();

			if (status >= 4) {
				Person.getById(face.personId).face_count--;
				navigationDrawer.updatePersonFaceCount(face.personId);

				if (pageLoader.data.folderType == "people") {
					pageLoader.filesContainer.removeFile(face.id);
				}
			}
		});
	}
}

// Create a list of Files from a list of objects
Face.createFromList = function (list) {
	faces = {};
	for (var i in list) {
		faces[list[i].id] = new Face(list[i]);
	}
	return faces;
};

Face.getById = function (id) {
	let face = pageLoader.filesContainer.getFile(id);
	if (face) return face;
	else {
		return new Face({id: id});
	}
};
