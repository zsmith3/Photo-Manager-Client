import {
	Button,
	Checkbox,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Icon,
	InputAdornment,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	Radio,
	TextField
} from "@material-ui/core";
import React, { Fragment } from "react";
import { HoverIconButton } from ".";
import { getObjProps } from "../../utils";
import MountTrackedComponent from "./MountTrackedComponent";

/**
 * A template for a common form of Material-UI dialog
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param text The DialogContentText (if any) to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 * @param noFocus Used by other Dialog types to prevent autofocus of DialogContent
 */
export class SimpleDialog extends MountTrackedComponent<{
	open: boolean;
	onClose: () => void;
	title: string;
	text?: React.ReactNode;
	actionText: string;
	action: () => Promise<any>;
	noFocus?: boolean;
}> {
	state = {
		loading: false
	};

	/** Reference to main dialog content */
	contentRef: React.RefObject<HTMLElement>;

	constructor(props) {
		super(props);

		this.contentRef = React.createRef();
	}

	/** Submit data (on primary DialogAction button click) */
	submit = () => {
		this.setState({ loading: true });
		this.props.action().then(() => {
			this.props.onClose();
			this.setStateSafe({ loading: false });
		});
		// TODO add proper error handling here
		// also ability to add a validation function to determine whether current input/selection/etc is valid,
		// and so whether user is able to click confirm
	};

	componentDidUpdate() {
		if (this.props.open && !this.props.noFocus && !this.state.loading) setTimeout(() => this.contentRef.current.focus(), 1);
	}

	render() {
		return (
			<Dialog open={this.props.open} onClose={this.props.onClose}>
				<DialogTitle>{this.props.title}</DialogTitle>
				<DialogContent onKeyDown={event => event.key === "Enter" && this.submit()} tabIndex={-1} ref={this.contentRef}>
					{Boolean(this.props.text) && <DialogContentText>{this.props.text}</DialogContentText>}
					{this.props.children}
				</DialogContent>
				<DialogActions>
					<Button disabled={this.state.loading} onClick={this.props.onClose} color="primary">
						Cancel
					</Button>
					<Button disabled={this.state.loading} onClick={this.submit} color="primary">
						{this.props.actionText}
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

/** Data about a ListDialog item */
interface ListDialogItem {
	id: number;
	name: string;
	noSelect?: boolean;
	children?: ListDialogItem[];
}

/**
 * Simple Material-UI dialog with List selection (and optional text field)
 * (most props are passed to base SimpleDialog)
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param text The DialogContentText (if any) to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 * @param list List of items to display and select from
 * @param selected ID of initially selected item(s)
 * @param multiple Whether user can select multiple items at once
 * @param openByDefault Whether collapsible list items are open by default (default = false)
 * @param selectableFilter Filter function applied to each item to determine if it is selectable
 * @param textLabel Label for text input field (if empty then no text field)
 * @param defaultTextValue Default value for text input field
 */
export class ListDialog extends React.Component<{
	open: boolean;
	onClose: () => void;
	title: string;
	text?: string;
	actionText: string;
	action: (selected: number[], text?: string) => Promise<any>;
	list: ListDialogItem[];
	selected?: number[];
	multiple?: boolean;
	openByDefault?: boolean;
	selectableFilter?: (id: number) => boolean;
	textLabel?: string;
	defaultTextValue?: string;
	childrenBefore?: boolean;
}> {
	state: {
		selected: number[];
		itemsOpen: { [id: number]: boolean };
		searchValue: string;
		textValue: string;
	};

	constructor(props) {
		super(props);

		if (props.selected?.length > 1 && !props.multiple) throw "ListDialog: cannot pass multiple selected items without multiple=true";

		this.state = { selected: props.selected || [], itemsOpen: {}, searchValue: "", textValue: props.defaultTextValue };
	}

	/**
	 * Initialise this.state.itemsOpen (to all false)
	 * @param list (Nested) list of items
	 */
	initItemsOpen(list: ListDialogItem[]) {
		let getItemIds: (list: ListDialogItem[]) => number[] = list =>
			list ? list.map(item => item.id).concat(list.map(item => getItemIds(item.children)).reduce((all, cur) => all.concat(cur), [])) : [];
		this.setState({ itemsOpen: getItemIds(list).reduce((acc, cur) => ({ ...acc, [cur]: cur in acc ? acc[cur] : Boolean(this.props.openByDefault) }), this.state.itemsOpen) });
	}

	/**
	 * Collapse/expand a (collapsible) list item
	 * @param itemId ID of list item to toggle
	 */
	toggleItemOpen(itemId: number) {
		this.setState({ itemsOpen: { ...this.state.itemsOpen, [itemId]: !this.state.itemsOpen[itemId] } });
	}

	/**
	 * Recursively generate the displayed list
	 * @param listItems Nested list of items to display
	 * @param indent Current indent level (default = 0)
	 */
	generateList(listItems: ListDialogItem[], searchValue: string, indent?: number) {
		if (searchValue) {
			let getRes = (item: ListDialogItem) => {
				let getItem = (item: ListDialogItem, newProps: any) => getObjProps(item, ["id", "name", "noSelect", "children"], newProps);
				if (item.name.toLowerCase().includes(searchValue.toLowerCase())) return getItem(item, { match: true });
				let childRes = (item.children || []).map(child => getRes(child)).filter(child => child !== null);
				if (childRes.length > 1) return getItem(item, { noSelect: true, children: childRes });
				else if (childRes.length == 0) return null;
				else if (childRes[0].match) return getItem(item, { noSelect: true, children: childRes });
				else return getItem(childRes[0], { noSelect: true, name: item.name + "/" + childRes[0].name });
			};
			listItems = listItems.map(item => getRes(item)).filter(item => item !== null);

			return this.generateList(listItems, null);
		}

		let selectable = (itemId: number) => !this.props.selectableFilter || this.props.selectableFilter(itemId) || null;
		let isOpen = (itemId: number) => searchValue === null || this.state.itemsOpen[itemId];
		let selectItem = (itemId: number) =>
			this.props.multiple
				? this.setState({ selected: this.state.selected.includes(itemId) ? this.state.selected.filter(id => id !== itemId) : this.state.selected.concat([itemId]) })
				: this.setState({ selected: [itemId] });
		indent = indent || 0;
		return (
			<List>
				{listItems.map(item => (
					<Fragment key={item.id}>
						<ListItem
							button={item.noSelect || selectable(item.id)}
							onClick={item.noSelect ? () => this.toggleItemOpen(item.id) : selectable(item.id) && (() => selectItem(item.id))}
							style={{ paddingLeft: indent * 16 + "px" }}
						>
							{!item.noSelect &&
								(this.props.multiple ? (
									<Checkbox checked={this.state.selected.includes(item.id)} disabled={!selectable(item.id)} />
								) : (
									<Radio checked={this.state.selected.includes(item.id)} disabled={!selectable(item.id)} />
								))}
							<ListItemText primary={item.name} />
							{item.children &&
								Boolean(item.children.length) &&
								(item.noSelect ? (
									<Icon>{isOpen(item.id) ? "expand_less" : "expand_more"}</Icon>
								) : (
									<ListItemSecondaryAction>
										<HoverIconButton action={() => this.toggleItemOpen(item.id)}>{isOpen(item.id) ? "expand_less" : "expand_more"}</HoverIconButton>
									</ListItemSecondaryAction>
								))}
						</ListItem>
						{item.children && Boolean(item.children.length) && (
							<Collapse in={isOpen(item.id)} unmountOnExit>
								{this.generateList(item.children, searchValue, indent + 1)}
							</Collapse>
						)}
					</Fragment>
				))}
			</List>
		);
	}

	shouldComponentUpdate(nextProps) {
		// Initialise itemsOpen when list changes
		if (nextProps.list !== this.props.list) {
			this.initItemsOpen(this.props.list);
			return false;
		} else if ((nextProps.selected || []).sort().toString() !== (this.props.selected || []).sort().toString()) {
			this.setState({ selected: nextProps.selected || [] });
			return false;
		} else return true;
	}

	render() {
		return (
			<SimpleDialog
				open={this.props.open}
				onClose={this.props.onClose}
				title={this.props.title}
				actionText={this.props.actionText}
				action={() => this.props.action(this.state.selected, this.state.textValue)}
				noFocus={true}
			>
				{this.props.childrenBefore && this.props.children}

				{this.props.textLabel && (
					<Fragment>
						<TextField
							autoFocus
							label={this.props.textLabel}
							defaultValue={this.props.defaultTextValue}
							onChange={event => (this.state.textValue = event.currentTarget.value)}
							style={this.props.childrenBefore ? {} : { width: "100%" }}
						/>

						<br />
						<br />
					</Fragment>
				)}

				{/* Search box */}
				<TextField
					placeholder="Search"
					autoFocus
					onChange={event => this.setState({ searchValue: event.currentTarget.value })}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<Icon>search</Icon>
							</InputAdornment>
						)
					}}
					style={{ width: "100%" }}
				/>
				{/* Main list */}
				{this.generateList(this.props.list, this.state.searchValue)}
				{!this.props.childrenBefore && this.props.children}
			</SimpleDialog>
		);
	}
}

/**
 * Simple Material-UI dialog with a TextField
 * @param open A state variable determining whether the dialog is open
 * @param onClose A function which closes the dialog (i.e. by setting "open" to false)
 * @param title The DialogTitle to display
 * @param actionText The name of the primary DialogAction (the secondary will always be "Cancel")
 * @param action The function to run when the primary DialogAction button is clicked
 * @param label The label of the TextField component
 * @param defaultValue Initial value of the TextField component
 */
export class TextDialog extends React.Component<{
	open: boolean;
	onClose: () => void;
	title: string;
	actionText: string;
	action: (text: string) => Promise<any>;
	label: string;
	defaultValue?: string;
}> {
	state: {
		value: string;
	};

	constructor(props) {
		super(props);

		this.state = { value: props.defaultValue };
	}

	render() {
		return (
			<SimpleDialog
				open={this.props.open}
				onClose={this.props.onClose}
				title={this.props.title}
				actionText={this.props.actionText}
				action={() => this.props.action(this.state.value)}
				noFocus={true}
			>
				<TextField autoFocus label={this.props.label} defaultValue={this.props.defaultValue} onChange={event => (this.state.value = event.currentTarget.value)} />
			</SimpleDialog>
		);
	}
}
