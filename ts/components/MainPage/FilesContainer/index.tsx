import { GridList, GridListTile, LinearProgress, ListSubheader } from "@material-ui/core";
import React, { ComponentType } from "react";
import { Folder } from "../../../models";
import { addressRootTypes } from "../../App";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";

/** Type for stored data in FilesContainer */
type dataType = {
	/** ID to identify this set of objects */
	id: number,

	/** Display name for object set */
	name: string,

	/** IDs of Model instances to display */
	objectIds: number[],

	/** GridCard component to display for each instance */
	card: ComponentType<{ modelId: number, scale: number, selected: boolean, onSelect: (event) => void }>,

	/** List of IDs of selected objects */
	selection?: number[]
}

/** Grid-based container for displaying Files (and other models) */
export default class FilesContainer extends React.Component<{ rootType: addressRootTypes, rootId: number }> {
	state = {
		/** Storage of this.props to determine when they have been updated */
		props: { rootType: null as addressRootTypes, rootId: null as number },

		/** Data to be displayed, as a list of object sets */
		data: [] as dataType[],

		/** Whether data for the current set of props has been loaded */
		dataLoaded: false
	}

	constructor (props: { rootType: addressRootTypes, rootId: number }) {
		super(props);

		this.state.props = props;
	}


	/**
	 * Fetch all data to be displayed, based on this.props
	 * @returns Promise object representing data fetched
	 */
	private getData (): Promise<dataType[]> {
		return new Promise((resolve, reject) => {
			switch (this.props.rootType) {
				case "folders":
					if (this.props.rootId === null) {
						Folder.loadAll<Folder>({ parent: null }).then(folders => {
							resolve([{ id: 1, name: "Folders", objectIds: folders.map(folder => folder.id), card: FolderCard }]);
						});
					} else {
						Folder.loadObject<Folder>(this.props.rootId, true).then(folder => {
							folder.getContents().then(data => {
								resolve([{ id: 1, name: "Folders", objectIds: data.folders.map(folder => folder.id), card: FolderCard }, { id: 2, name: "Files", objectIds: data.files.map(file => file.id), card: FileCard }]);
							}).catch(reject);
						}).catch(reject);
					}
					break;
				}
		});
	}


	/**
	 * Select or deselect a single object
	 * @param setId ID of the set to which the object belongs
	 * @param modelId ID of the object to select
	 * @param value Whether to select or deselect the object (true => select) (NOT IMPLEMENTED)
	 */
	select (setId: number, modelId: number, value: boolean) {
		let data = this.state.data.map(set => {
			if (set.id === setId) return Object.assign(set, { selection: [ modelId ]});
			else return Object.assign(set, { selection: [] });
		});
		// let setIndex = data.findIndex(set => set.id === setId);
		// data[setIndex].selection = [ modelId ];
		this.setState({ data: data });
	}

	/**
	 * Select or deselect all objects
	 * @param value Whether to select or deselect all objects (true => select)
	 */
	selectAll (value: boolean) {
		let data = this.state.data.map(set => {
			if (value) return Object.assign(set, { selection: set.objectIds });
			else return Object.assign(set, { selection: [] });
		});
		this.setState({ data: data });
	}


	render () {
		let scale = 150;

		if (this.state.props != this.props) {
			this.state.dataLoaded = false;
			this.state.props = this.props;
		}

		if (this.state.dataLoaded) {
			return <GridList cols={ 1 } cellHeight={ 100 /* TODO */ } spacing={ 10 } style={ { margin: 0, padding: 10 } } onClick={ () => this.selectAll(false) }>
					{ this.state.data.map(objectSet => {
						let title = objectSet.objectIds.length > 0 && <GridListTile key="childrenSubheader" cols={ 1 } style={ { height: "auto" } }>
							<ListSubheader component="div">{ objectSet.name }</ListSubheader>
						</GridListTile>;

						let cards = objectSet.objectIds.map(objectId => (
							<objectSet.card key={ `${ objectSet.id }_${ objectId }` } modelId={ objectId } selected={ objectSet.selection.includes(objectId) } onSelect={ this.select.bind(this, objectSet.id, objectId) } scale={ scale } />
						));

						return [title].concat(cards);
					}) }
				</GridList>;
		} else {
			this.getData().then(data => {
				this.setState({ data: data.map(set => Object.assign(set, { selection: [] })), dataLoaded: true });
			});
			return <LinearProgress />;
		}
	}
}
