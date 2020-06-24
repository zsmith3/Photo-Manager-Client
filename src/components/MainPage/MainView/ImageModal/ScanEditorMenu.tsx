import { Button, ButtonGroup, Icon, withStyles } from "@material-ui/core";
import React from "react";
import { Scan } from "../../../../models";
import { EditorSharedData } from "./BaseEditor";
import { EditorMenuAction, ScanEditorCursor } from "./ScanEditor";

/** Menu for ScanEditor */
class ScanEditorMenu extends React.Component<{ classes: { menu: string; menuItem: string }; data: EditorSharedData<Scan>; action: (action: EditorMenuAction, ...args: any[]) => void }> {
	static styles = {
		menu: {
			top: "64px",
			background: "rgba(0, 0, 0, 0.8)",
			position: "absolute" as "absolute"
		},
		menuItem: {
			width: "50px",
			height: "50px",
			color: "white"
		}
	};

	render() {
		let getOnClick = (cursor: ScanEditorCursor) => () => this.props.action("updateCursor", cursor);
		let getStyle = (cursor: ScanEditorCursor) => (this.props.data.cursor === cursor ? { background: "rgba(255,255,255,0.5)" } : {});

		return (
			<div className={this.props.classes.menu}>
				<ButtonGroup>
					<Button className={this.props.classes.menuItem} title="Pan/zoom" onClick={getOnClick(ScanEditorCursor.Move)} style={getStyle(ScanEditorCursor.Move)}>
						<Icon>open_with</Icon>
					</Button>
					<Button
						className={this.props.classes.menuItem}
						title="Add horizontal line"
						onClick={getOnClick(ScanEditorCursor.HorizontalLine)}
						style={getStyle(ScanEditorCursor.HorizontalLine)}
					>
						<Icon>more_horiz</Icon>
					</Button>
					<Button
						className={this.props.classes.menuItem}
						title="Add vertical line"
						onClick={getOnClick(ScanEditorCursor.VerticalLine)}
						style={getStyle(ScanEditorCursor.VerticalLine)}
					>
						<Icon>more_vert</Icon>
					</Button>
				</ButtonGroup>

				<br />

				<ButtonGroup>
					<Button className={this.props.classes.menuItem} title="Preview Crop" onClick={() => this.props.action("preview")}>
						<Icon>preview</Icon>
					</Button>
					<Button className={this.props.classes.menuItem} title="Confirm Lines" onClick={() => this.props.action("confirm")}>
						<Icon>check</Icon>
					</Button>
				</ButtonGroup>
			</div>
		);
	}
}

export default withStyles(ScanEditorMenu.styles)(ScanEditorMenu);
