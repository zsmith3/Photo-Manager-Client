import { Button, ButtonGroup, createMuiTheme, Grid, Icon, MuiThemeProvider, TextField, Typography, withStyles } from "@material-ui/core";
import React from "react";
import { Scan } from "../../../../models";
import { EditorSharedData } from "./BaseEditor";
import { EditorMenuAction, ScanEditorCursor } from "./ScanEditor";

/** Menu for ScanEditor */
class ScanEditorMenu extends React.Component<{
	classes: { menu: string; menuItem: string; menuOption: string; menuGroup: string; optionTitle: string };
	data: EditorSharedData<Scan>;
	action: (action: EditorMenuAction, ...args: any[]) => void;
}> {
	static styles = {
		menu: {
			top: "64px",
			background: "rgba(0, 0, 0, 0.8)",
			position: "absolute" as "absolute",
			width: 207
		},
		menuGroup: {
			margin: 5
		},
		menuItem: {
			width: "50px",
			height: "50px",
			color: "white"
		},
		menuOption: {
			padding: 10,
			paddingTop: 5
		},
		optionTitle: {
			marginLeft: 10,
			marginTop: 10
		}
	};

	render() {
		let getOnClick = (cursor: ScanEditorCursor) => () => this.props.action("updateCursor", cursor);
		let getStyle = (cursor: ScanEditorCursor) => (this.props.data.cursor === cursor ? { background: "rgba(255,255,255,0.5)" } : {});

		return (
			<MuiThemeProvider theme={createMuiTheme({ palette: { type: "dark" } })}>
				<div className={this.props.classes.menu}>
					<ButtonGroup className={this.props.classes.menuGroup}>
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

					<ButtonGroup className={this.props.classes.menuGroup}>
						<Button className={this.props.classes.menuItem} title="Preview Crop" onClick={() => this.props.action("preview")}>
							<Icon>preview</Icon>
						</Button>
						<Button className={this.props.classes.menuItem} title="Confirm Lines" onClick={() => this.props.action("confirm")}>
							<Icon>check</Icon>
						</Button>
						<Button className={this.props.classes.menuItem} title="Clear all lines" onClick={() => this.props.action("clear")}>
							<Icon>clear</Icon>
						</Button>
					</ButtonGroup>

					<br />

					<Typography color="textPrimary" variant="subtitle2" className={this.props.classes.optionTitle}>
						Margins (%):
					</Typography>
					<Grid container>
						<Grid item xs={6} className={this.props.classes.menuOption}>
							<TextField
								label="Horizontal"
								value={this.props.data.bounds[0] * 100}
								onChange={event => this.props.action("updateOption", "bounds", 0, parseFloat(event.currentTarget.value) / 100)}
								type="number"
							/>
						</Grid>
						<Grid item xs={6} className={this.props.classes.menuOption}>
							<TextField
								label="Vertical"
								value={this.props.data.bounds[1] * 100}
								onChange={event => this.props.action("updateOption", "bounds", 1, parseFloat(event.currentTarget.value) / 100)}
								type="number"
							/>
						</Grid>
					</Grid>
				</div>
			</MuiThemeProvider>
		);
	}
}

export default withStyles(ScanEditorMenu.styles)(ScanEditorMenu);
