import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import React from "react";
import { FileObject, Folder } from "../../../../../models";
import { SimpleDialog } from "../../../../utils";

// Import and register FilePond (uploader) and plugins
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "filepond/dist/filepond.min.css";
import { FilePond, registerPlugin } from "react-filepond";
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileValidateSize, FilePondPluginFileValidateType);

interface UploadDialogProps {
	open: boolean;
	onClose: () => void;
	folderId: number;
	width: Breakpoint;
}

class UploadDialog extends React.Component<UploadDialogProps> {
	render() {
		return (
			<SimpleDialog
				open={this.props.open}
				onClose={() => {
					this.props.onClose();
					Folder.getById<Folder>(this.props.folderId).resetData();
				}}
				title="Upload file(s)"
				actionText="Done"
				action={async () => {}}
			>
				<FilePond
					allowImagePreview={isWidthUp("md", this.props.width)}
					allowMultiple={true}
					maxFiles={100}
					maxFileSize="50MB"
					maxTotalFileSize="1000MB"
					acceptedFileTypes={["image/*"]}
					server={{
						process: (fieldName, file, metadata, load, error, progress, onAbort, transfer, options) => {
							const [uploadPromise, cancelUpload] = FileObject.upload(file as File, this.props.folderId, event => progress(event.lengthComputable, event.loaded, event.total));
							uploadPromise
								.then(newFile => {
									load("");
								})
								.catch(err => {
									console.error(err);
									error("Error.");
								});

							return {
								abort: () => {
									cancelUpload().then(() => {
										console.log("abort");
										onAbort();
									});
								}
							};
						}
					}}
				/>
				Warning: if you attempt to cancel an upload after it has started, the upload may still be completed. If it does not explicitly say cancelled, then it has not been
				cancelled. Likewise, completed uploads cannot be undone (pressing the undo button will just remove them from this list).
			</SimpleDialog>
		);
	}
}

export default withWidth()(UploadDialog);
