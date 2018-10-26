/** Base Model class */
class Model {
	/** Base Model objects array, to store local instances of Model */
	static objects: Model[]
	static specialProps: {
		[key: string]: (instance: Model, prop: any) => any
	}
	"constructor": { objects: Model[], specialProps: { [key: string]: (instance: Model, prop: any) => any } };

	/**
	 * Add a new model instance to the local list (from the API)
	 * @param this Subclass of Model
	 * @param obj Data representing new instance of model
	 * @returns Created instance of model
	 */
	static addObject<M extends Model> (this: { new (...args: any[]): M, objects: M[] }, obj: object): M {
		let object = new this(obj);
		this.objects.push(object);
		return object;
	}

	/**
	 * Append new model instances to the local list (from the API)
	 * @param this Subclass of Model
	 * @param list List of objects representing new instances of model
	 */
	static addObjects<M extends Model> (this: { new (...args: any[]): M, objects: M[], addObject (obj: object): void }, list: object[]): void {
		for (let i in list) {
			this.addObject(list[i]);
		}
	}

	/**
	 * Set (overwrite) the local list of model instances
	 * @param this Subclass of Model
	 * @param list List of objects representing new instances of model
	 * @returns List of created model instances
	 */
	static setObjects<M extends Model> (this: { new (...args: any[]): M, objects: M[], addObjects (list: object[]): void }, list: object[]): M[] {
		this.objects = [];
		this.addObjects(list);
		return this.objects;
	}

	/**
	 * Update a selection of the local model instances
	 * @param this Subclass of Model
	 * @param list List of objects representing updated instances of model
	 */
	static updateObjects<M extends Model> (this: { new (...args: any[]): M, objects: M[], getById (id: (number | string)): M }, list: { id: (number | string)}[]): void {
		for (let i in list) {
			this.getById(list[i].id).update(list[i]);
		}
	}

	/**
	 * Get a model instance from the local list from its ID
	 * @param this Subclass of Model
	 * @param id ID of requested model instance
	 * @returns Model instance with specified ID
	 */
	static getById<M extends Model> (this: { new (...args: any[]): M, objects: M[] }, id: (number | string)): M {
		let item = this.objects.find(obj => obj.id == id);
		if (item === undefined) {
			console.log("error");
		} else {
			return item;
		}
	}

	/**
	 * Delete a model instance from the local list from its ID
	 * @param this Subclass of Model
	 * @param id ID of model instance to delete
	 */
	static deleteById<M extends Model> (this: { new (...args: any[]): M, objects: M[] }, id: (number | string)): void {
		for (let i in this.objects) {
			if (this.objects[i].id == id) delete this.objects[i];
		}
	}

	/** ID property for all models */
	id: (number | string)

	/**
	 * Construct a new Model instance (overridden)
	 * @param obj Data object from which to construct the new model instance
	 */
	constructor (obj: object) {
		this.update(obj);

		this.constructor.objects.push(this);
	}

	/**
	 * Update model instance properties from data object
	 * @param obj Data object from which to update model instance
	 */
	update (obj: object): void {
		for (let property in obj) {
			if (property in this.constructor.specialProps) {
				this.constructor.specialProps[property](this, obj[property]);
			} else if (property in this) {
				this[property] = obj[property];
			}
		}
	}
}


/** Album model */
class Album extends Model {
	/** Local instances of Album */
	static objects: Album[];

	/** List of root-level albums only */
	static get rootAlbums (): Album[] { return Album.objects.filter(album => album.parent === undefined); }

	/**
	 * Create a new album and add it to the remote database
	 * @param parentId ID of the parent album (-1 for root-level) TODO this
	 * @param name Name of the new album
	 * @returns Promise object representing new album
	 */
	static create (parentId: number, name: string): Promise<Album> {
		return new Promise((resolve, reject) => {
			Database.create("albums", { parent: parentId, name: name }).then((data) => {
				let album = Album.addObject(data);

				app.els.navDrawer.refreshAlbums();
				resolve(album);
			});
		});
	}


	id: number

	/** ID of parent album */
	private parentID: number

	/** Parent album (undefined if root-level) */
	get parent (): Album { return Album.getById(this.parentID); }

	/** Child albums */
	get children (): Album[] { return Album.objects.filter(album => album.parent.id == this.id ); }


	/**
	 * Add files to album
	 * @param files List of IDs of files to be added
	 */
	addFiles (files: string[]): void {
		// TODO this kind of thing with Database class
		apiRequest("albums/" + this.id + "/files/", "POST", files.map((id) => ({"file": id}))).then((data) => {
			Album.updateObjects(data);
			app.els.navDrawer.refreshAlbums();
		});
	}

	/**
	 * Remove a file from album
	 * @param file File-like (only needs ID property) object to be removed from album
	 * @param multiple Whether or not this is part of a larger operation. If true, album listings will not be updated after removal.
	 * @returns Empty Promise object representing completion
	 */
	removeFile (file: { id: string }, multiple?: boolean): Promise<never> {
		return new Promise((resolve, reject) => {
			// TODO Database class
			apiRequest("albums/" + this.id + "/files/" + file.id + "/", "DELETE").then(() => {
				app.els.filesCont.removeFile(file.id);
				if (!multiple) {
					Database.get("albums").then((data: { id: number }[]) => {
						Album.updateObjects(data);
						app.els.navDrawer.refreshAlbums();
						resolve();
					});
				} else resolve();
			}).catch(reject);
		});
	}

	/**
	 * Remove multiple files from album
	 * @param fileIDs List of IDs of files to be removed
	 * @returns Empty Promise object representing completion
	 */
	removeFiles (fileIDs: string[]): Promise<never> {
		return new Promise((fullResolve, fullReject) => {
			promiseChain(fileIDs, (resolve, reject, fileID: string) => { this.removeFile({ id: fileID }, true).then(resolve).catch(reject); }).then(() => {
				// TODO Database
				apiRequest("albums/").then((data: { id: number }[]) => {
					Album.updateObjects(data);
					app.els.navDrawer.refreshAlbums();
					fullResolve();
				}).catch(fullReject);
			}).catch(fullReject);
		});
	}

	/**
	 * Delete album from remote database
	 * @returns Empty Promise object representing completion
	 */
	delete (): Promise<never> {
		return new Promise((resolve, reject) => {
			Database.delete("albums", this.id).then(() => {
				Album.deleteById(this.id);
				app.els.navDrawer.refreshAlbums();
				resolve();
			}).catch(reject);
		});
		//TODO BUG - removing album seems to remove other album from display (but not actually, thankfully)
	}
}
// TODO will need to make some ammends to album api i think
// 		and certainly to how they're accessed in JS/TS


/** File model */
class FileObject extends Model {
	/** Local instances of File */
	static objects: FileObject[];

	static specialProps = {
		"geotag": (file: FileObject, prop: object) => { file.geotagID = GeoTag.addObject(prop).id; }
	}


	id: string

	/** File name */
	name: string

	/** File path */
	path: string

	/** File type (broad) */
	type: ("folder" | "image" | "video" | "file")

	/** File format (extension) */
	format: string

	/** File size (bytes) */
	length: number

	/** File timestamp (date taken if available, otherwise date modified) */
	timestamp: Date

	/** File width (if image or video) */
	width: number

	/** File height (if image or video) */
	height: number

	/** File orientation (if image) */
	orientation: number

	/** File duration (if video) */
	duration: number

	/** Whether file is starred */
	is_starred: boolean

	/** Whether file is marked for deletion */
	is_deleted: boolean

	/** Local storage of image data for file */
	data: object

	/** Information about state of file zoom/positioning in ImageModal (current session) */
	zoom: object

	/** Parent ID (for File instances belonging to a Face) */
	// parent?: number
	// TODO remove this and remove it from ImageModal
	// 	I think maybe use selection instead

	/** File geotag ID */
	private geotagID: number

	/** File geotag (if image) */
	get geotag (): GeoTag { return GeoTag.getById(this.geotagID); }


	/**
	 * Construct a new FileObject instance
	 * @param obj Data object from which to construct the new file instance
	 */
	constructor (obj: object) {
		super(obj);

		if (this.orientation == 6 || this.orientation == 8) {
			this.width = obj["height"];
			this.height = obj["width"];
		}
	}

	/**
	 * Open the file.
	 *
	 * If the file is an image, it is opened in the image modal.
	 * If the file is a folder, the page navigates to its contents.
	 * For other types no action is taken.
	 */
	open () {
		if (this.type == "image") {
			app.els.imageModal.openFile(this);
		} else if (this.type == "folder") {
			//app.refreshFilesData("folders/" + this.path.replace("&", "%26"), "folders/" + this.id);
			app.refreshFilesData("folders/" + this.path.replace("&", "%26") + Platform.urls.getCurrentQuery(), "folders/" + this.id + "/" + Platform.urls.getCurrentQuery());
			// TODO more general approach to URL encoding
		}
	}

	/** FUNCTION DEPRECATED - TODO remove */
	getSrc (index) {
		// TODO remove this (and all uses)
		if (index in this.data) {
			return this.data[index];
		} else {
			return Platform.urls.serverUrl + "api/images/" + this.id + ImageLoader.imgSizes[index];
		}
	}

	/**
	 * Get the maximum dimensions of the file (for images)
	 * when it is fit within the given width and height
	 * but the aspect ratio is maintained.
	 * @param maxW Width of the bounding box
	 * @param maxH Height of the bounding box
	 * @returns [Width of the image at that size, Height of the image at that size]
	 */
	getSize (maxW: number, maxH: number): [number, number] {
		if (this.width / this.height < maxW / maxH) {
			return [this.width * maxH / this.height, maxH];
		} else {
			return [maxW, this.height * maxW / this.width];
		}
	}

	// Function to set a boolean field (for private use)
	/**
	 * Change the remote value of a boolean field
	 * @param type Boolean field to change
	 * @param value The boolean value to set it to
	 */
	private setBool (type: ("is_starred" | "is_deleted"), value: boolean) {
		return new Promise((resolve, reject) => {
			Database.update("files", this.id, { [type]: value }).then(() => {
				this[type] = value;
				app.els.filesCont.getFilebox(this.id).showIcons();
				resolve();
			}).catch(reject);
		});
	}

	// Wrappers for setBool

	star () { return this.setBool("is_starred", true); }

	unstar () { return this.setBool("is_starred", false); }

	markDelete () { return this.setBool("is_deleted", true); }

	unmarkDelete () { return this.setBool("is_deleted", false); }
}


/** Face model */
class Face extends Model {
	/** Local instances of Face */
	static objects: Face[];

	static specialProps = {
		"person": (face: Face, prop: number) => { face.personID = prop; }
	}


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
			Database.update("faces", this.id, { person: personID, status: 1 }).then((data) => {
				app.els.navDrawer.updatePersonFaceCount(personID);
				app.els.navDrawer.updatePersonFaceCount(oldID);
				this.update(data);
				if (app.data.folderType == "people" && app.data.person.id != personID) {
					app.els.filesCont.removeFile(this.id);
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
			Database.update("faces", this.id, { status: status }).then((data) => {
				this.update(data);
				app.els.filesCont.getFilebox(this.id).showIcons();

				if (status >= 4) {
					app.els.navDrawer.updatePersonFaceCount(this.personID);

					if (app.data.folderType == "people") {
						app.els.filesCont.removeFile(this.id);
					}
				}

				resolve();
			}).catch(reject);
		});
	}
}


/** Person Group model */
class PersonGroup extends Model {
	/** Local instances of Person Group */
	static objects: PersonGroup[];


	/**
	 * Create a new Person Group and add it to the remote database
	 * @param name Name of the group
	 * @returns Promise object representing new group
	 */
	static create (name: string): Promise<PersonGroup> {
		return new Promise(function (resolve, reject) {
			Database.create("people-groups", { name: name }).then(function (data) {
				let newGroup = PersonGroup.addObject(data);
				app.els.navDrawer.addPersonGroup(newGroup);
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
				app.els.navDrawer.deletePersonGroup(this.id);
				resolve();
			}).catch(reject);
		});
	}
}


/** Person model */
class Person extends Model {
	/** Local instances of Person */
	static objects: Person[];

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
				app.els.navDrawer.addPerson(newPerson);
				app.els.navDrawer.updateGroupPersonCount(newPerson.group.id);

				resolve(newPerson);
			}).catch(reject);
		});
	}


	id: number

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
				app.els.navDrawer.deletePerson(this);
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


/** Geotag area model */
class GeoTagArea extends Model {
	static objects: GeoTagArea[]


	/**
	 * Create new GeoTagArea model instance and add to remote database
	 * @param dataObj Data object from which to create GeoTagArea
	 * @returns Promise object representing new GeoTagArea
	 */
	static create (dataObj: { name: string }): Promise<GeoTagArea> {
		return new Promise((resolve, reject) => {
			Database.create("geotag-areas", dataObj).then((data) => {
				let newArea = GeoTagArea.addObject(data);
				$("<option></option>").val(newArea.id).text(newArea.name).appendTo("#modal-geotag-form-area-title");
				resolve(newArea);
			}).catch(reject);
		});
	};


	/** Name of the GeoTagArea */
	name: string

	/** Address of the GeoTagArea */
	address: string

	/** Latitude co-ordinate of area centre */
	latitude: number

	/** Longitude co-ordinate of area centre */
	longitude: number

	/** Radius of area from centre */
	radius: number
	// TODO find out unit and add to doc comment


	/**
	 * Get a display-formatted version of area
	 * @returns Formatted name and address of the area
	 */
	getString () {
		return "<span>" + this.name + "</span>\n\n<i style='font-size: 12px;'>" + this.address + "</i>";
	}

	/**
	 * Save edits to area
	 * @returns Promise object representing updated area
	 */
	save () {
		return new Promise((resolve, reject) => {
			Database.update("geotag-areas", this.id, { name: this.name, address: this.address }).then((data) => {
				this.update(data);
				resolve(this);
			});
		});
	}
}


/** Geotag model */
class GeoTag extends Model {
	static objects: GeoTag[]

	static specialProps = {
		"area": (geotag: GeoTag, prop: number) => { geotag.areaID = prop; }
	}


	/**
	 * Create a new geotag and add to remote database
	 * @param newGeotag Data object representing new geotag
	 * @param fileID ID of file to which to assign the geotag
	 * @returns Promise object representing new geotag
	 */
	static create (newGeotag: object, fileID: string): Promise<GeoTag> {
		return new Promise((resolve, reject) => {
			// TODO should create geotag then assign to file
			Database.update("files", fileID, { "geotag": newGeotag }).then((data) => {
				let newGeotag = GeoTag.addObject(data.geotag);
				// TODO ^^ not sure about data format
				app.els.filesCont.getFile(fileID).geotagID = data.geotag.id;
				resolve(newGeotag);
			}).catch(reject);
		});
	}


	// TODO document these methods

	static modalOnAccept () {
		if ($("#modal-geotag-form-area-title").val() == "new") {
			let newGta = {
				name: $("#modal-geotag-form-area-title > mdc-text").val(),
				address: $("#modal-geotag-form-area-address").val(),
				latitude: $("#modal-geotag-form-area-lat").val(),
				longitude: $("#modal-geotag-form-area-lng").val(),
				radius: Math.pow($("#modal-geotag-form-area-radius").val(), 3)
			};
			GeoTagArea.create(newGta).then(GeoTag.modalUpdateLocation);
		} else {
			let area = GeoTagArea.getById($("#modal-geotag-form-area-title").val());
			area.address = $("#modal-geotag-form-area-address").val();
			area.latitude = $("#modal-geotag-form-area-lat").val();
			area.longitude = $("#modal-geotag-form-area-lng").val();
			area.radius = Math.pow($("#modal-geotag-form-area-radius").val(), 3);
			area.save().then(GeoTag.modalUpdateLocation);
		}
	}

	static modalUpdateLocation (data) {
		if (app.els.filesCont.selection.length == 1) {
			let newGT = {
				area: data.id,
				latitude: $("#modal-geotag-form-location-lat").val(),
				longitude: $("#modal-geotag-form-location-lng").val()
			};
			GeoTag.create(newGT, app.els.filesCont.selection[0]);
		}
	}


	id: number

	/** Latitude co-ordinate */
	latitude: number

	/** Longitude co-ordinate */
	longitude: number

	/** ID of GeoTagArea to which geotag belongs (may be null) */
	private areaID: number

	/** GeoTagArea to which geotag belongs (may be null) */
	get area () {
		if (this.areaID === null) return null;
		else return GeoTagArea.getById(this.areaID);
	}


	/**
	 * Get a display-formatted version of the geotag
	 * @param noArea If true, the GeoTagArea will not be included
	 * @returns Formatted latitude and longitude (+ optionally GeoTagArea name and address) of geotag
	 */
	getString (noArea) {
		if (this.area && !noArea) {
			return this.area.getString() + "\n\n" + this.getString(true);
		} else {
			return "<i style='font-size: 13px;'>(" + (Math.round(this.latitude * 100) / 100) + ", " + (Math.round(this.longitude * 100) / 100) + ")</i>";
		}
	}
}


// Config class
class Config {
	defaults
	platform
	userConfig

	constructor (data) {
		this.defaults = data.default_settings;
		this.platform = data.platform;
		delete data.default_settings;
		delete data.platform;

		this.userConfig = {desktop: {}, mobile: {}};
		for (var setting in data) {
			let settingPlatform = setting.substr(0, setting.indexOf("_"));
			let settingName = setting.substr(setting.indexOf("_") + 1);
			this.userConfig[settingPlatform][settingName] = data[setting];

			if (settingName.substr(0, settingName.indexOf("_")) == "show" && data[setting]) {
				if (window.innerWidth < 800 && settingName == "show_toolBar") continue;
				$("#" + settingName.substr(settingName.indexOf("_") + 1)).get(0).show(true);
			}
		}
	}

	get (setting) {
		return this.userConfig[this.platform][setting];
	}

	set (setting, value) {
		this.userConfig[this.platform][setting] = value;
		let data = {};
		data[this.platform + "_" + setting] = value;

		this.onUpdate(setting, value);

		apiRequest("membership/config/", "PATCH", data);
	}

	onUpdate (setting, value) {
		switch (setting) {
		case "select_mode":
			app.els.filesCont.scaleFiles();
			$("#select-mode").val(value);
			break;
		}
	}
}
