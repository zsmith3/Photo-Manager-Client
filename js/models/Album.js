// Album class
class Album {
	// Construct Album from object
	constructor (object) {
		for (var property in object) this[property] = object[property];

		this.children = Album.createFromList(object.children);
	}

	addFiles (files) {
		let album = this;
		apiRequest("albums/" + this.id + "/files/", "POST", files.map(function (id) { return {"file": id}; })).then(function (data) {
			console.log(data);
			Album.albums = Album.createFromList(data);
			navigationDrawer.refreshAlbums();
		});
	}

	removeFiles (files) {
		for (i in files) {
			let fileId = files[i];
			apiRequest("albums/" + this.id + "/files/" + fileId + "/", "DELETE").then(function () {
				pageLoader.filesContainer.removeFile(fileId);
				apiRequest("albums/").then(function (data) {
					Album.albums = Album.createFromList(data);
					navigationDrawer.refreshAlbums();
				});
			});
		}

	}

	delete () {
		let album = this;
		apiRequest("albums/" + this.id + "/", "DELETE").then(function () {
			Album.deleteById(album.id);
			navigationDrawer.refreshAlbums();
		});
		//TODO BUG - removing album seems to remove other album from display (but not actually, thankfully)
	}
}

Album.albums = [];

Album.createFromList = function (list) {
	let albums = [];
	for (var i in list) {
		albums.push(new Album(list[i]));
	}
	return albums;
};

Album.getById = function (id, albums) {
	albums = albums || Album.albums;

	for (var i in albums) {
		if (albums[i].id == id) return albums[i];
		res = Album.getById(id, albums[i].children);
		if (res) return res;
	}
};

Album.getAll = function (albums, path) {
	albums = albums || Album.albums;
	path = path || "";
	var results = {};

	for (var i in albums) {
		results[albums[i].id] = path + albums[i].name;
		results = Object.assign(results, Album.getAll(albums[i].children, path + albums[i].name + "/"));
	}

	return results;
};

Album.deleteById = function (id, albums) {
	albums = albums || Album.albums;

	for (var i in albums) {
		if (albums[i].id == id) {
			delete albums[i];
			break;
		}
		Album.deleteById(id, albums[i].children);
	}
};

// Add an album to the database
Album.create = function (parent, name) {
	return new Promise(function (resolve, reject) {
		apiRequest("albums/", "POST", { parent: parent, name: name }).then(function (data) {
			if (parent == "") Album.albums.push(new Album(data));
			else Album.getById(parent).children.push(new Album(data));

			navigationDrawer.refreshAlbums();
			resolve(data);
		});
	});
};
