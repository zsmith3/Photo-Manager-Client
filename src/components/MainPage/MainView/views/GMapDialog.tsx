import { Checkbox, FormControlLabel, Grid, MenuItem, Paper, Select, Slider, Tab, Tabs, TextField, Typography, withStyles } from "@material-ui/core";
import { Circle, GoogleApiWrapper, Map, mapEventHandler, Marker } from "google-maps-react";
import cloneDeep from "lodash/cloneDeep";
import React from "react";
import { FileObject, GeoTag, GeoTagArea } from "../../../../models";
import { SimpleDialog } from "../../../utils";

/** Props for MapDialog component */
interface PropsType {
	google: typeof google;
	classes: any;
	open: boolean;
	onClose: () => void;
	fileIds: number[];
}

/** Default value of GeoTagArea data */
const defaultArea = { id: 0, name: "", address: "", latitude: 0, longitude: 0, radius: 1000 };

/** Default state data for MapDialog component */
const defaultState = {
	geoTagAreaIds: [] as number[],
	tab: "area" as "area" | "location",
	warnArea: false,
	warnLocation: false,
	data: {
		modifyArea: false,
		hasArea: false,
		area: defaultArea,
		modifyLocation: false,
		hasLocation: false,
		geotag: { latitude: 0, longitude: 0 }
	}
};

/** State type for MapDialog component */
type StateType = typeof defaultState;

/**
 * Construct LatLngLiteral from data
 * @param obj Data object with latitude and longitude properties
 * @returns LatLngLiteral object with given data
 */
function getLatLngLiteral(obj: { latitude: number; longitude: number }): google.maps.LatLngLiteral {
	return obj === null ? null : { lat: obj.latitude, lng: obj.longitude };
}

/**
 * Construct LatLng from data
 * @param obj Data object with latitude and longitude properties
 * @returns LatLng object with given data
 */
function getLatLng(obj: { latitude: number; longitude: number }): google.maps.LatLng {
	return new google.maps.LatLng(getLatLngLiteral(obj));
}

/**
 * Round a number
 * @param num The number to round
 * @returns The number rounded to 6dp
 */
function round(num: number) {
	return Math.round(num * 1e6) / 1e6;
}

/** Dialog for editing geotags */
class MapDialog extends React.Component<PropsType, StateType> {
	static styles = {
		outerContainer: {
			width: "80vw",
			height: "60vh"
		},
		mapContainer: {
			position: "relative" as "relative"
		},
		formContainer: {
			padding: 20
		},
		formRow: {
			margin: "20px 0"
		},
		latLngGrid: {
			padding: 10
		},
		searchBox: {
			fontFamily: "Roboto",
			fontSize: "15px",
			marginLeft: "12px",
			textOverflow: "ellipsis",
			width: "calc(100% - 300px)",
			marginTop: "10px",
			padding: "10px",
			height: "40px",
			border: "none",
			boxShadow: "rgba(0, 0, 0, 0.3) 0px 1px 4px -1px"
		}
	};

	state = cloneDeep(defaultState);

	/** Reference to Google map component */
	mapRef: React.RefObject<Map> & { current: { map: google.maps.Map } };

	/** Reference to map search box */
	searchBoxRef: React.RefObject<HTMLInputElement>;

	/** Map search box API */
	searchBoxApi: google.maps.places.SearchBox = null;

	/** Map search markers */
	searchMarkers: google.maps.Marker[] = [];

	/**
	 * Update this.state.data recursively
	 * @param newData Object from which to copy properties
	 * @param dataObj Initial value of this.state.data (if given, state will not be updated)
	 * @returns New value of this.state.data
	 */
	updateData(newData, dataObj = null) {
		let data = dataObj || this.state.data;
		let edit = (obj, path: string, value) => {
			if (path.includes(".")) edit(obj[path.substr(0, path.indexOf("."))], path.substr(path.indexOf(".") + 1), value);
			else obj[path] = value;
		};
		for (let key in newData) edit(data, key, newData[key]);
		if (dataObj === null) this.setState({ data: data });
		return data;
	}

	/**
	 * Switch the current tab and recenter the map
	 * @param tab The new tab to switch to
	 */
	switchTab(tab: "area" | "location") {
		this.setState({ tab: tab });
		if (tab === "area" && this.state.data.hasArea) this.mapRef.current.map.setCenter(getLatLng(this.state.data.area));
		else if (tab === "location" && this.state.data.hasLocation) this.mapRef.current.map.setCenter(getLatLng(this.state.data.geotag));
	}

	/**
	 * Update the area by ID
	 * @param id ID of area to switch to (including 0 or -1)
	 */
	setArea(id: any) {
		if (id === -1) this.updateData({ hasArea: false });
		else {
			let area;
			if (id === 0) area = { ...defaultArea };
			else area = GeoTagArea.getById(id).serialize();
			this.updateData({ hasArea: true, area: area });
		}
	}

	/**
	 * Place a marker on the map and update area/location with place data
	 * @param props Component properties
	 * @param component Component clicked
	 * @param event Click event
	 */
	placeMarker: mapEventHandler = (props, comp, event) => {
		if (this.state.tab === "area") {
			if (!this.state.data.modifyArea) return;

			// Fetch place data and update area

			const geocoder = new google.maps.Geocoder();
			const placesService = new google.maps.places.PlacesService(this.mapRef.current.map);

			let defaultData = { ["area.id"]: 0, ["area.name"]: "Unknown Place", ["area.address"]: "Unknown Address" };
			let updateData = (data: typeof defaultData) =>
				this.updateData({ hasArea: true, ["area.latitude"]: round(event.latLng.lat()), ["area.longitude"]: round(event.latLng.lng()), ...data });
			let getPlace = (placeId: string) => {
				placesService.getDetails({ placeId: placeId }, (place, status) => {
					if (status === google.maps.places.PlacesServiceStatus.OK) updateData({ ["area.id"]: 0, ["area.name"]: place.name, ["area.address"]: place.formatted_address });
					else updateData(defaultData);
				});
			};

			if (event.placeId) {
				getPlace(event.placeId);
			} else {
				geocoder.geocode({ location: event.latLng }, (results, status) => {
					if (status === google.maps.GeocoderStatus.OK && results[0]) getPlace(results[0].place_id);
					updateData(defaultData);
				});
			}
		} else {
			// Update location data
			if (!this.state.data.modifyLocation) return;
			this.updateData({ hasLocation: true, ["geotag.latitude"]: round(event.latLng.lat()), ["geotag.longitude"]: round(event.latLng.lng()) });
		}
	};

	/** Save local changes to remote database */
	save = async () => {
		// Create or update area if needed
		let areaId = this.state.data.area.id;
		if (this.state.data.modifyArea && this.state.data.hasArea) {
			if (this.state.data.area.id === 0) {
				let areaData = { ...this.state.data.area };
				delete areaData.id;
				const area = await GeoTagArea.create(areaData);
				areaId = area.id;
			} else {
				await GeoTagArea.getById(this.state.data.area.id).updateSave(this.state.data.area);
			}
		}

		// Update geotag data for each file
		this.props.fileIds
			.map(id => FileObject.getById(id))
			.forEach(async file => {
				let geotag = file.geotag === null ? { latitude: null, longitude: null, area: null } : (file.geotag.serialize() as any);
				// Modify location data as needed
				if (this.state.data.modifyLocation) {
					if (this.state.data.hasLocation) {
						geotag.latitude = this.state.data.geotag.latitude;
						geotag.longitude = this.state.data.geotag.longitude;
					} else {
						geotag.latitude = null;
						geotag.longitude = null;
					}
				}
				// Modify area data as needed
				if (this.state.data.modifyArea) {
					if (this.state.data.hasArea) geotag.area = areaId;
					else geotag.area = null;
				}

				// Remove geotag if null, and avoid modifying data which shouldn't be
				if (geotag.latitude === null && geotag.longitude === null && geotag.area === null) geotag = null;
				else {
					if (!("id" in geotag)) geotag.id = 0;
					geotag.locationModified = this.state.data.modifyLocation;
					geotag.areaModified = this.state.data.modifyArea;
				}
				await file.updateSave({ geotag: geotag });
			});
	};

	/** Setup Google Maps SearchBox API */
	setupSearch = () => {
		this.searchBoxApi = new google.maps.places.SearchBox(this.searchBoxRef.current);
		this.mapRef.current.map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.searchBoxRef.current);

		this.searchBoxApi.addListener("places_changed", () => {
			const places = this.searchBoxApi.getPlaces();
			if (places.length == 0) return;

			// Clear out the old markers.
			this.searchMarkers.forEach(marker => marker.setMap(null));
			this.searchMarkers = [];

			// For each place, get the icon, name and location.
			const bounds = new google.maps.LatLngBounds();
			places.forEach(place => {
				if (!place.geometry) return;
				const icon = {
					url: place.icon as string,
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(25, 25)
				};

				// Create a marker for each place.
				this.searchMarkers.push(new google.maps.Marker({ map: this.mapRef.current.map, icon, title: place.name, position: place.geometry.location }));

				if (place.geometry.viewport) bounds.union(place.geometry.viewport);
				// Only geocodes have viewport.
				else bounds.extend(place.geometry.location);
			});
			this.mapRef.current.map.fitBounds(bounds);
		});
	};

	constructor(props) {
		super(props);
		this.mapRef = React.createRef();
		this.searchBoxRef = React.createRef();
	}

	componentDidMount() {
		// Load all GeoTagArea models
		GeoTagArea.registerListUpdateHandler((areas: GeoTagArea[]) => this.setState({ geoTagAreaIds: areas.map(area => area.id) }));
	}

	shouldComponentUpdate(nextProps: PropsType) {
		// Reset state when file selection changes
		let nextIdsSorted = nextProps.fileIds.sort();
		if (
			this.props.fileIds.length !== nextProps.fileIds.length ||
			!this.props.fileIds
				.sort()
				.map((id, ind) => [id, nextIdsSorted[ind]])
				.every(x => x[0] === x[1])
		) {
			let state = cloneDeep(defaultState);
			state.geoTagAreaIds = this.state.geoTagAreaIds;

			let files = nextProps.fileIds.map(id => FileObject.getById(id));
			let allTagged = files.every(file => file.geotag !== null);
			let noneTagged = files.every(file => file.geotag === null);
			let noAreas = files.every(file => file.geotag === null || file.geotag.area === null);
			let sameArea = allTagged && files[0].geotag.area !== null && files.every(file => file.geotag.area !== null && file.geotag.area.id === files[0].geotag.area.id);

			// If all files belong to same GeoTagArea, use this
			if (sameArea) state.data = this.updateData({ hasArea: true, area: files[0].geotag.area.serialize() }, state.data);
			else if (!noAreas) state.warnArea = true;

			// Use location data for single file, or average for multiple
			if (files.length === 1 && allTagged && files[0].geotag.latitude !== null) {
				this.updateData({ hasLocation: true, geotag: files[0].geotag }, state.data);
			} else if (files.length > 1 && !noneTagged) {
				state.warnLocation = true;
				let tagged = files.filter(file => file.geotag !== null);
				this.updateData(
					{
						geotag: {
							latitude: tagged.reduce((sum, file) => sum + file.geotag.latitude, 0) / tagged.length,
							longitude: tagged.reduce((sum, file) => sum + file.geotag.longitude, 0) / tagged.length
						} as GeoTag
					},
					state.data
				);
			}
			this.setState(state);
			return false;
		} else if (this.props.open || nextProps.open) return true;
		else return false;
	}

	render() {
		let areaDisabled = !(this.state.data.modifyArea && this.state.data.hasArea);
		let locDisabled = !(this.state.data.modifyLocation && this.state.data.hasLocation);

		return (
			<SimpleDialog open={this.props.open} onClose={this.props.onClose} title="Edit geotag for file(s)" actionText="Save Changes" action={this.save}>
				<Grid container className={this.props.classes.outerContainer}>
					{/* Google map container */}
					<Grid item xs={8} className={this.props.classes.mapContainer}>
						<Map
							google={this.props.google}
							ref={this.mapRef}
							zoom={12}
							onClick={this.placeMarker}
							onBoundsChanged={(props, map, event) => this.searchBoxApi.setBounds(map.getBounds())}
							onReady={this.setupSearch}
							clickableIcons={true}
							initialCenter={
								this.state.data.hasArea
									? getLatLngLiteral(this.state.data.area)
									: this.state.data.hasLocation
									? getLatLngLiteral(this.state.data.geotag)
									: { lat: 51.75, lng: -0.35 }
							}
						>
							{this.state.data.hasArea && <Marker position={getLatLng(this.state.data.area)} label={{ fontFamily: "Material Icons", text: "location_searching" }} />}
							{this.state.data.hasLocation && <Marker position={getLatLng(this.state.data.geotag)} label={{ fontFamily: "Material Icons", text: "my_location" }} />}
							{this.state.data.hasArea && (
								<Circle
									radius={this.state.data.area.radius}
									center={getLatLng(this.state.data.area)}
									strokeColor="blue"
									strokeOpacity={1}
									strokeWeight={5}
									fillColor="blue"
									fillOpacity={0.2}
									onClick={this.placeMarker}
								/>
							)}
						</Map>
						<input ref={this.searchBoxRef} type="text" placeholder="Search" className={this.props.classes.searchBox} />
					</Grid>

					{/* Geotag editing options */}
					<Grid item xs={4} className={this.props.classes.formContainer}>
						{/* Area/location tabs */}
						<Paper square>
							<Tabs value={this.state.tab} indicatorColor="primary" textColor="primary" variant="fullWidth" onChange={(event, value) => this.switchTab(value)}>
								<Tab value="area" label="Area" />
								<Tab value="location" label="Location" />
							</Tabs>
						</Paper>

						{this.state.tab === "area" ? (
							<Grid container>
								{/* Warning for multiple files */}
								{this.state.warnArea && <Typography>Warning: some of the selected files already have geotags belonging to different areas. This will overwrite them.</Typography>}

								{/* Whether to modify GeoTagArea data */}
								<Grid item xs={12} className={this.props.classes.formRow}>
									<FormControlLabel
										control={<Checkbox color="primary" checked={this.state.data.modifyArea} onChange={event => this.updateData({ modifyArea: event.target.checked })} />}
										label="Modify Area Data"
										labelPlacement="end"
									/>
								</Grid>

								{/* Select an existing/new area */}
								<Grid item xs={6} className={this.props.classes.latLngGrid}>
									<Grid item xs={12} className={this.props.classes.formRow}>
										<Select
											value={this.state.data.hasArea ? this.state.data.area.id : -1}
											onChange={event => this.setArea(event.target.value)}
											disabled={!this.state.data.modifyArea}
										>
											<MenuItem key={-1} value={-1}>
												None
											</MenuItem>
											{this.state.geoTagAreaIds.map(id => (
												<MenuItem key={id} value={id}>
													{GeoTagArea.getById(id).name}
												</MenuItem>
											))}
											<MenuItem key={0} value={0}>
												New Place
											</MenuItem>
										</Select>
									</Grid>
								</Grid>

								{/* Area name */}
								<Grid item xs={6} className={this.props.classes.latLngGrid}>
									<TextField
										label="Place name"
										value={this.state.data.area.name}
										onChange={event => this.updateData({ ["area.name"]: event.currentTarget.value })}
										disabled={areaDisabled}
									/>
								</Grid>

								{/* Area address */}
								<Grid item xs={12} className={this.props.classes.formRow}>
									<TextField
										label="Address"
										multiline
										value={this.state.data.area.address}
										onChange={event => this.updateData({ ["area.address"]: event.currentTarget.value })}
										disabled={areaDisabled}
									/>
								</Grid>

								{/* Area co-ordinates */}
								<Grid item xs={6} className={this.props.classes.latLngGrid}>
									<TextField
										label="Latitude"
										value={this.state.data.area.latitude}
										onChange={event => this.updateData({ ["area.latitude"]: parseFloat(event.currentTarget.value) })}
										disabled={areaDisabled}
									/>
								</Grid>
								<Grid item xs={6} className={this.props.classes.latLngGrid}>
									<TextField
										label="Longitude"
										value={this.state.data.area.longitude}
										onChange={event => this.updateData({ ["area.longitude"]: parseFloat(event.currentTarget.value) })}
										disabled={areaDisabled}
									/>
								</Grid>

								{/* Area radius */}
								<Grid item xs={12} className={this.props.classes.formRow}>
									<Slider
										value={Math.pow(this.state.data.area.radius, 1 / 3)}
										min={0}
										max={20}
										step={0.1}
										onChange={(event, value) => this.updateData({ ["area.radius"]: Math.pow(value[0] || value, 3) })}
										disabled={areaDisabled}
									/>
								</Grid>
							</Grid>
						) : (
							<Grid container>
								{/* Warning for multiple files */}
								{this.state.warnLocation && <Typography>Warning: some of the selected files already have individual geotags. This will overwrite them.</Typography>}

								{/* Whether to modify remote GeoTag data */}
								<Grid item xs={12} className={this.props.classes.formRow}>
									<FormControlLabel
										control={<Checkbox color="primary" checked={this.state.data.modifyLocation} onChange={event => this.updateData({ modifyLocation: event.target.checked })} />}
										label="Modify Exact Location Data"
										labelPlacement="end"
									/>
								</Grid>

								{/* Whether geotag should include exact co-ordinates */}
								<Grid item xs={12} className={this.props.classes.formRow}>
									<FormControlLabel
										control={<Checkbox color="primary" checked={this.state.data.hasLocation} onChange={event => this.updateData({ hasLocation: event.target.checked })} />}
										label="Specify Exact Location"
										labelPlacement="end"
										disabled={!this.state.data.modifyLocation}
									/>
								</Grid>

								{/* Geotag co-ordinates */}
								<Grid item xs={6} className={this.props.classes.latLngGrid}>
									<TextField
										label="Latitude"
										value={this.state.data.geotag.latitude}
										onChange={event => this.updateData({ ["geotag.latitude"]: parseFloat(event.currentTarget.value) })}
										disabled={locDisabled}
									/>
								</Grid>
								<Grid item xs={6} className={this.props.classes.latLngGrid}>
									<TextField
										label="Longitude"
										value={this.state.data.geotag.longitude}
										onChange={event => this.updateData({ ["geotag.longitude"]: parseFloat(event.currentTarget.value) })}
										disabled={locDisabled}
									/>
								</Grid>
							</Grid>
						)}

						{/* Area-location mismatch warning */}
						{this.state.data.hasLocation &&
							this.state.data.hasArea &&
							this.props.google.maps.geometry &&
							this.props.google.maps.geometry.spherical.computeDistanceBetween(getLatLng(this.state.data.area), getLatLng(this.state.data.geotag)) >
								this.state.data.area.radius && <Typography>Warning: selected location outside of selected area</Typography>}
					</Grid>
				</Grid>
			</SimpleDialog>
		);
	}
}

export default GoogleApiWrapper({ apiKey: process.env.googleMapsAPIKey })(withStyles(MapDialog.styles)(MapDialog));
