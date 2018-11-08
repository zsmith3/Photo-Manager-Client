// Map element base class
class GoogleMap extends HTMLElement {
	connectedCallback () {
		if (this.connected) {
			this.init();
			return;
		}

		this.connected = true;
		this.initiated = false;

		this.api = {};

		if (document.readyState == "complete") this.init();
	}

	init () {
		// Return if already initiated
		if (this.initiated) {
			if (this.postInit) this.postInit();
			return;
		} else this.initiated = true;

		// Create Map API
		this.api.map = new google.maps.Map(this, {
			center: GoogleMap.defaultLocation,
			zoom: GoogleMap.defaultZoom,
			mapTypeId: "roadmap"
		});
		this.api.map.parent = this;

		// Create search box API and connect it
		this.searchBox = $("<mdc-text></mdc-text>").attr("id", this.id + "-search").addClass("map-search").insertBefore(this).get(0);
		this.api.searchBox = new google.maps.places.SearchBox(this.searchBox);
		this.api.searchBox.parent = this;
		this.api.map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.searchBox);
		this.api.map.addListener("bounds_changed", function() { this.parent.api.searchBox.setBounds(this.getBounds()); });

		this.api.placeMarkers = [];

		// Retrieve place details upon search selection
		this.api.searchBox.addListener("places_changed", function() {
			// Get places and return if none found
			var places = this.getPlaces();
			if (places.length == 0) return;

			// Clear out old markers
			this.parent.api.placeMarkers.forEach(function (marker) { marker.setMap(null); });
			this.parent.api.placeMarkers = [];

			// For each place, get the icon, name and location
			var bounds = new google.maps.LatLngBounds();
			let sb = this;
			places.forEach(function (place) {
				if (!place.geometry) return;

				// Create place icon
				var icon = {
					url: place.icon,
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(25, 25)
				};

				// Create place marker
				sb.parent.api.placeMarkers.push(new google.maps.Marker({
					map: sb.parent.api.map,
					icon: icon,
					title: place.name,
					position: place.geometry.location
				}));

				// Add place to bounds
				if (place.geometry.viewport) bounds.union(place.geometry.viewport);
				else bounds.extend(place.geometry.location);
			});

			this.parent.api.map.fitBounds(bounds);
		});

		// Create error message box
		let errorMsg = $("<p></p>").addClass("map-error-msg").appendTo(this);
		$("<i></i>").addClass("material-icons map-error-left-icon").text("warning").appendTo(errorMsg);
		$("<span></span>").addClass("map-error-text").appendTo(errorMsg);
		$("<i></i>").addClass("material-icons map-error-right-icon").text("warning").appendTo(errorMsg);

		if (this.constructor == GoogleMap && this.postInit) this.postInit();
	}

	showError (message) {
		$(this).find(".map-error-msg > .map-error-text").text(message);
		$(this).find(".map-error-msg").css("opacity", 0.8);
	}

	hideError () {
		$(this).find(".map-error-msg").css("opacity", 0);
	}
}

GoogleMap.defaultLocation = {lat: 51.50072919999999, lng: -0.12462540000001354};
GoogleMap.defaultZoom = 5;


// Geotag editing map element
class GMapEdit extends GoogleMap {
	init () {
		super.init();

		// Create selection markers
		this.api.areaMarker = new google.maps.Marker({ map: this.api.map, label: {fontFamily: "Material Icons", text: "location_searching"} });
		this.api.locationMarker = new google.maps.Marker({ map: this.api.map, label: {fontFamily: "Material Icons", text: "my_location"} });
		// Open info window on marker click
		google.maps.event.addListener(this.api.areaMarker, "click", function() { this.map.parent.placeMarker(this.position, null, false, this); });
		google.maps.event.addListener(this.api.locationMarker, "click", function() { this.map.parent.placeMarker(this.position, null, false, this); });
		// Create selection radius
		this.api.selectCircle = new google.maps.Circle({
			map: this.api.map,
			radius: Math.pow($(this).closest("mdc-modal").find("#modal-geotag-form-area-radius").val(), 3),
			fillColor: "#AAAAFF",
			fillOpacity: 0.4,
			strokeColor: "#5555FF",
			strokeOpacity: 0.6,
			strokeWeight: 2,
		});
		this.api.selectCircle.bindTo("center", this.api.areaMarker, "position");
		google.maps.event.addListener(this.api.selectCircle, "click", function (event) { this.map.parent.placeMarker(event.latLng, event.placeId || null); });

		// Create geocoder, placeService and infoWindow
		this.api.geocoder = new google.maps.Geocoder();
		this.api.placeService = new google.maps.places.PlacesService(this.api.map);
		this.api.infoWindow = new google.maps.InfoWindow();

		// Place areaMarker on click
		google.maps.event.addListener(this.api.map, "click", function(event) {
			this.parent.oldZoom = this.getZoom();

			let parent = this.parent;
			setTimeout(function() {
				if (parent.api.map.getZoom() == parent.oldZoom){
					parent.placeMarker(event.latLng, event.placeId || null);
				}
			}, 400);
		});

		this.postInit();
	}

	postInit () {
		$("#modal-geotag-form-tabs-location").find(">*").css("display", "none");
		this.api.locationMarker.setPosition(null);

		// Show existing geotag data
		if (App.app.els.filesCont.selection.length > 1) {
			$("#modal-geotag-form-location-multiple").css("display", "");
		} else if (App.app.els.filesCont.selection.length == 1) {
			$("#modal-geotag-form-location-single").css("display", "");

			let geotag = App.app.els.filesCont.getFile(App.app.els.filesCont.selection[0]).geotag;
			if (geotag != null) {
				this.placeMarker(new google.maps.LatLng(geotag.latitude, geotag.longitude), null, true, this.api.locationMarker);

				if (geotag.area) {
					$("#modal-geotag-form-area-title").val(geotag.area.name);
					$("#modal-geotag-form-area-address").val(geotag.area.address);
				}
				$("#modal-geotag-form-area-lat, #modal-geotag-form-location-lat").val(geotag.latitude);
				$("#modal-geotag-form-area-lng, #modal-geotag-form-location-lng").val(geotag.longitude);
			}
		} else if (App.app.els.filesCont.selection.length == 0) {
			$("#modal-geotag-form-location-empty").css("display", "");
		}
	}

	// Get the current selection marker to deal with
	getCurrentMarker () {
		if ($("#modal-geotag-form-tabs").get(0).getTabName() == "area") {
			return this.api.areaMarker;
		} else {
			return this.api.locationMarker;
		}
	}

	// Place the selectMarker at a given position, and display info about that area
	placeMarker (location, placeId, noInfo, marker) {
		marker = marker || this.getCurrentMarker();
		marker.setPosition(location);
		this.api.map.setCenter(location);

		if (noInfo) {
			this.api.infoWindow.close();
			return;
		}

		let parent = this;
		if (placeId == null) this.geocodePoint(location).then(function (data) { return parent.getPlace(data); }).then(function (data) { parent.openInfoWindow(data, marker); });
		else this.getPlace(placeId).then(function (data) { parent.openInfoWindow(data, marker); });

		this.checkLocInArea();
	}

	// Register a change in the tab (area vs location)
	changeTab (newTab) {
		if (newTab == "area") {
			this.api.areaMarker.setOpacity(1);
			this.api.locationMarker.setOpacity(0.5);
		} else {
			this.api.areaMarker.setOpacity(0.5);
			this.api.locationMarker.setOpacity(1);
		}
		this.placeMarker(this.getCurrentMarker().position);
	}

	// Open an info window from a place
	openInfoWindow (place, marker) {
		if (place) {
			let location = place.geometry.location;
			let thumbUrl = "https://maps.googleapis.com/maps/api/streetview?size=200x200&location=" + location.lat() + "," + location.lng() + "&key=AIzaSyAX_6NiibPoSfF_21RhvOTNND8XHKsmSs8";
			let addressList = place.formatted_address.split(", ");

			let infoDiv = $($("#template-mapInfoWindow").html().trim()).clone();
			$(infoDiv).find(".modal-geotag-map-info-title").text(place.name);
			$(infoDiv).find(".modal-geotag-map-info-thumb").attr("src", place.photos ? place.photos[0].getUrl({maxWidth: 400, maxHeight: 400}) : thumbUrl);
			$(infoDiv).find(".modal-geotag-map-info-address").text(addressList.join("\n"));
			$(infoDiv).find(".modal-geotag-map-info-link-cont > a").attr("href", place.website || "").attr("rel", "external").text(place.website || "");

			this.api.infoWindow.setContent(infoDiv.get(0).outerHTML);

			if ($("#modal-geotag-form-tabs").get(0).getTabName() == "area") {
				if ($("#modal-geotag-form-area-title").val() == "" || $("#modal-geotag-form-area-title").val() == "new") $("#modal-geotag-form-area-title").val(place.name);
				$("#modal-geotag-form-area-address").val(addressList.join("\n"));
				if ($("#modal-geotag-form-location-lat").val() == "") {
					$("#modal-geotag-form-location-lat").val(location.lat());
					$("#modal-geotag-form-location-lng").val(location.lng());
				}
			}
			$("#modal-geotag-form-" + $("#modal-geotag-form-tabs").get(0).getTabName() + "-lat").val(location.lat());
			$("#modal-geotag-form-" + $("#modal-geotag-form-tabs").get(0).getTabName() + "-lng").val(location.lng());
		} else {
			this.api.infoWindow.setContent("No results found for this location.");
		}

		this.api.infoWindow.open(this.api.map, marker);
	}

	// Fetch a place object using its ID
	getPlace (placeId) {
		let parent = this;
		return new Promise(function (resolve, reject) {
			if (placeId == null) resolve(null);
			else {
				parent.api.placeService.getDetails({placeId: placeId}, function(place, status) {
					if (status === google.maps.places.PlacesServiceStatus.OK) {
						resolve(place);
					} else {
						resolve(null);
					}
				});
			}
		});
	}

	// Fetch place from location, and run a callback on this data
	geocodePoint (location) {
		let parent = this;
		return new Promise(function (resolve, reject) {
			parent.api.geocoder.geocode({"location": location}, function(results, status) {
				if (status === "OK" && results[0]) resolve(results[0].place_id);
				else resolve(null);
			});
		});
	}

	// Ensure location marker is within area radius (and warn user if not)
	checkLocInArea () {
		if (!this.api.areaMarker.position || !this.api.locationMarker.position) {
			this.hideError();
			return;
		}

		let markerDist = google.maps.geometry.spherical.computeDistanceBetween(this.api.areaMarker.position, this.api.locationMarker.position);

		if (markerDist > this.api.selectCircle.radius) {
			this.showError("Warning: The selected location does not fall within the selected area");
		} else {
			this.hideError();
		}
	}

	// Display an existing GeoTagArea on the map
	showArea (area) {
		this.placeMarker(new google.maps.LatLng(area.latitude, area.longitude), null, true);
		$("#modal-geotag-form-area-lat").val(area.latitude);
		$("#modal-geotag-form-area-lng").val(area.longitude);

		$("#modal-geotag-form-area-address").val(area.address);

		this.api.selectCircle.setRadius(area.radius);
		$("#modal-geotag-form-area-radius").get(0).value = Math.pow(area.radius, 1 / 3);
	}
}

window.customElements.define("map-edit", GMapEdit);


// Geotag viewing map element
class GMapView extends GoogleMap {
	init (files) {
		// TODO files should be filtered to only ones with geotags before put into this function
		super.init();

		this.api.imageMarkers = {};

		for (var id in files) {
			let markerSize = files[id].getSize(60, 40);
			this.api.imageMarkers[id] = new google.maps.Marker({
				position: {lat: files[id].geotag.latitude, lng: files[id].geotag.longitude},
				map: this.api.map,
				icon: {url: files[id].getSrc(1),
					scaledSize: new google.maps.Size(markerSize[0], markerSize[1]),
					anchor: new google.maps.Point(markerSize[0] / 2, markerSize[1] / 2)
				}
				// TODO get this to use imageloader somehow
			});
			this.api.imageMarkers[id].setCursor("pointer");
			this.api.imageMarkers[id].file = files[id];

			google.maps.event.addListener(this.api.imageMarkers[id], "mouseover", function () {
				let markerSize = this.file.getSize(parseInt($("#thumbScaler").val()), parseInt($("#thumbScaler").val()) * 2 / 3);
				this.setIcon({
					url: this.getIcon().url,
					scaledSize: new google.maps.Size(markerSize[0], markerSize[1]),
					anchor: new google.maps.Point(markerSize[0] / 2, markerSize[1] / 2)
				});
				this.setZIndex(1000);
			});
			google.maps.event.addListener(this.api.imageMarkers[id], "mouseout", function () {
				let markerSize = this.file.getSize(60, 40);
				this.setIcon({url: this.getIcon().url,
					scaledSize: new google.maps.Size(markerSize[0], markerSize[1]),
					anchor: new google.maps.Point(markerSize[0] / 2, markerSize[1] / 2)
				});
				this.setZIndex(10);
			});

			google.maps.event.addListener(this.api.imageMarkers[id], "click", function () {
				this.file.open();
			});
		}
	}
}

window.customElements.define("map-view", GMapView);
