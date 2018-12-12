import React from "react";
import { FileObject } from "../../../models"
import FileBox from "./FileBox"
import { GridList, GridListTile, ListSubheader, LinearProgress } from "@material-ui/core";
import { addressRootTypes } from "../../App";
import { Folder } from "../../../models";
import FolderBox from "./FolderBox";

type childType = Folder;
type objectType = FileObject;
type dataType = { childName: string, objectName: string, children: childType[], objects: objectType[]}

export default class FilesContainer extends React.Component<{ rootType: addressRootTypes, rootId: number }> {
	state = {
		props: { rootType: null as addressRootTypes, rootId: null as number },
		data: {
			childName: "Folders",
			objectName: "Files",
			children: [] as childType[],
			objects: [] as objectType[]
		},
		selection: {},
		//selectedChildren: {},
		//selectedObjects: {},
		cols: 10, // TODO
		dataLoaded: false
	}

	constructor (props) {
		super(props);

		this.state.props = props;

		window.addEventListener("resize", () => this.setState({ cols: 3 })); // TODO
	}

	private getData (): Promise<dataType> {
		return new Promise((resolve, reject) => {
			switch (this.props.rootType) {
				case "folders":
					if (this.props.rootId === null) {
						Folder.loadAll<Folder>({ parent: null }).then(folders => {
							resolve({ childName: "Folders", objectName: "Files", children: folders, objects: [] });
						});
					} else {
						Folder.loadObject<Folder>(this.props.rootId, true).then(folder => {
							console.log(folder);
							folder.getContents().then(data => {
								console.log(data);
								resolve({ childName: "Folders", objectName: "Files", children: data.folders, objects: data.files });
							}).catch(reject);
						}).catch(reject);
					}

					break;
				}
		});
	}


	// SELECTION FUNCTIONS

	select (type: ("child" | "object"), id: number, value: boolean) {
		this.selectAll(false);
		this.setState({ selection: {
			...this.state.selection,
			[type + "_" + id]: value
		}});
	}

	selectAll (value: boolean) {
		let selection = this.state.selection;
		Object.keys(selection).forEach(key => selection[key] = value);
		this.setState({ selection: selection });
	}


	render () {
		let scale = 150;

		if (this.state.props != this.props) {
			this.state.dataLoaded = false;
			this.state.props = this.props;
		}

		if (this.state.dataLoaded) {
			return <GridList cols={ this.state.cols } cellHeight={ 100 /* TODO */ } spacing={ 10 } style={ { margin: 0, padding: 10 } } onClick={ () => this.selectAll(false) }>
					{ this.state.data.children.length > 0 &&
					<GridListTile key="childrenSubheader" cols={ this.state.cols } style={ { height: "auto" } }>
						<ListSubheader component="div">{ this.state.data.childName }</ListSubheader>
					</GridListTile>
					}
					{ this.state.data.children.map(folder => (
						<FolderBox key={ "child_" + folder.id } modelId={ folder.id } selected={ this.state.selection["child_" + folder.id] } onSelect={ (event) => { event.stopPropagation(); this.select("child", folder.id, true); } } />
					)) }

					{ this.state.data.objects.length > 0 &&
					<GridListTile key="objectsSubheader" cols={ this.state.cols } style={ { height: "auto" } }>
						<ListSubheader component="div">{ this.state.data.objectName }</ListSubheader>
					</GridListTile>
					}
					{ this.state.data.objects.map(file => (
						<FileBox key={ "object_" + file.id } modelId={ file.id } scale={ scale } selected={ this.state.selection["object_" + file.id] } onSelect={ (event) => { event.stopPropagation(); this.select("object", file.id, true); } } />
					)) }
				</GridList>;
		} else {
			this.getData().then(data => {
				let childrenSelection = data.children.reduce((result, item) => Object.assign(result, { ["child_" + item.id]: false }), {})
				let objectSelection = data.objects.reduce((result, item) => Object.assign(result, { ["object_" + item.id]: false }), {})
				this.setState({ data: data, dataLoaded: true, selection: Object.assign(childrenSelection, objectSelection) });
			});
			return <LinearProgress />;
		}
	}
}
