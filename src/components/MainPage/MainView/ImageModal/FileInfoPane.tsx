import { Button, createMuiTheme, Grid, LinearProgress, MuiThemeProvider, TextField, Theme, Typography, withStyles } from "@material-ui/core";
import { CSSProperties } from "@material-ui/core/styles/withStyles";
import React from "react";
import { FileObject } from "../../../../models";
import { UpdateHandler } from "../../../../utils";
import { MountTrackedComponent } from "../../../utils";

/** File Info Pane Styles */
interface FIPStyles<T> {
	pane: T;
	progressBar: T;
	gridRow: T;
}

/** File Info Pane Props */
interface FIPProps {
	classes: FIPStyles<string>;
	fileId: number;
}

/** File Info Pane State */
interface FIPState {
	model?: FileObject;
	editData?: {
		notes?: string;
	};
	loading?: boolean;
}

/** File Info pane (with editing) for ImageModal */
class FileInfoPane extends MountTrackedComponent<FIPProps, FIPState> {
	static styles: FIPStyles<CSSProperties> = {
		pane: {
			padding: "20px",
			position: "absolute" as "absolute",
			marginTop: "64px",
			width: "20vw",
			height: "calc(100vh - 64px)",
			display: "inline-block",
			background: "rgba(0, 0, 0, 0.5)"
		},
		progressBar: {
			marginBottom: "10px"
		},
		gridRow: {
			marginTop: 10
		}
	};

	/** Update handler for current file */
	updateHandler: UpdateHandler = null;

	state = {
		model: null,
		editData: {
			notes: null
		},
		loading: false
	};

	/** Save current changes to file properties */
	async saveChanges() {
		this.setState({ loading: true });
		await this.state.model.updateSave({ notes: this.state.editData.notes || null });
		this.setState({ loading: false });
	}

	/** Process keyboard shortcuts for form/file navigation */
	onKeyDown(event: React.KeyboardEvent) {
		switch (event.key) {
			case "Enter":
				if (event.ctrlKey) {
					this.saveChanges();
					event.preventDefault();
				}
				break;
			case "ArrowLeft":
			case "ArrowRight":
				if (event.ctrlKey) event.preventDefault();
				else event.stopPropagation();
				break;
		}
	}

	constructor(props: FIPProps) {
		super(props);

		this.updateHandler = FileObject.getById(props.fileId).updateHandlers.register((file: FileObject) => this.setStateSafe({ model: file }));
	}

	shouldComponentUpdate(nextProps: FIPProps) {
		if (nextProps.fileId !== this.props.fileId) {
			// Load new file into state when ID changes
			this.updateHandler.unregister();
			this.state.editData.notes = null;
			this.updateHandler = FileObject.getById(nextProps.fileId).updateHandlers.register((file: FileObject) => this.setStateSafe({ model: file }));
			return false;
		}

		return true;
	}

	render() {
		if (this.state.editData.notes === null) this.state.editData.notes = this.state.model.notes || "";

		return (
			<div className={this.props.classes.pane}>
				<MuiThemeProvider theme={createMuiTheme({ palette: { type: "dark" } })}>
					<LinearProgress className={this.props.classes.progressBar} style={{ visibility: this.state.loading ? "visible" : "hidden" }} />
					<Grid container onKeyDown={event => this.onKeyDown(event)}>
						<Grid item xs={4} className={this.props.classes.gridRow}>
							<Typography color="textPrimary">Name:</Typography>
						</Grid>
						<Grid item xs={8} className={this.props.classes.gridRow}>
							<Typography color="textPrimary">{this.state.model.name}</Typography>
						</Grid>

						<Grid item xs={12} className={this.props.classes.gridRow}>
							<Typography color="textPrimary">Notes:</Typography>
						</Grid>
						<Grid item xs={12} className={this.props.classes.gridRow}>
							<TextField multiline value={this.state.editData.notes} onChange={event => this.setState({ editData: { ...this.state.editData, notes: event.target.value } })} />
						</Grid>

						<Grid item xs={12} className={this.props.classes.gridRow}>
							<Button disabled={this.state.editData.notes === this.state.model.notes || (!this.state.editData.notes && !this.state.model.notes)} onClick={() => this.saveChanges()}>
								Save
							</Button>
						</Grid>
					</Grid>
				</MuiThemeProvider>
			</div>
		);
	}
}

export default withStyles(FileInfoPane.styles)(FileInfoPane);
