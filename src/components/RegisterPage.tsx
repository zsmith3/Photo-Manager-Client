import { Button, Grid, Paper, TextField, Typography, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { Database } from "../controllers/Database";

/** Separate page for user registration */
class RegisterPage extends React.Component<{
	classes: { center: string; paper: string; textField: string };
	width: Breakpoint;
	history: any;
}> {
	static styles = {
		center: {
			margin: "auto",
			textAlign: "center" as "center"
		},
		paper: {
			padding: 50,
			boxSizing: "border-box" as "border-box"
		},
		textField: {
			marginLeft: 10,
			marginRight: 10
		}
	};

	state = {
		/** Input data which will be submitted */
		data: {
			first_name: "",
			last_name: "",
			username: "",
			email: "",
			password: "",
			confirm_password: "",
			token: ""
		},

		/** Error data from failed submit */
		error: {
			first_name: [],
			last_name: [],
			username: [],
			email: [],
			password: [],
			confirm_password: [],
			token: [],
			non_field_errors: []
		}
	};

	/** Handle a change to a text input */
	handleChange(name: string, event) {
		this.setState({ data: { ...this.state.data, [name]: event.target.value } });
	}

	/** Attempt to create a new user with current input data */
	handleSubmit = event => {
		Database.auth
			.register(this.state.data)
			.then(() => {
				this.props.history.push("/login");
			})
			.catch(errorData => {
				let error = {};
				for (let key in this.state.error) error[key] = errorData[key] || [];
				this.setState({ error: error });
			});

		event.preventDefault();
	};

	render() {
		return (
			<Fragment>
				<Grid container spacing={3}>
					<Grid item xs={12} className={this.props.classes.center}>
						<Typography variant={isWidthUp("sm", this.props.width) ? "h3" : "h4"} component="h1">
							Photo Manager/Fileserver
						</Typography>
					</Grid>
					<Grid item xs={12} sm={10} md={8} lg={6} className={this.props.classes.center}>
						<Paper elevation={4} className={this.props.classes.paper}>
							<Typography variant={isWidthUp("sm", this.props.width) ? "h4" : "h5"} component="h3">
								Register
							</Typography>

							<Typography component="p">Please create an account to access private files.</Typography>

							<br />

							<form onSubmit={this.handleSubmit}>
								<TextField
									className={this.props.classes.textField}
									label="First Name"
									error={this.state.error.first_name.length > 0}
									title="Your first name"
									onChange={this.handleChange.bind(this, "first_name")}
									helperText={this.state.error.first_name}
								/>

								<TextField
									className={this.props.classes.textField}
									label="Last Name"
									error={this.state.error.last_name.length > 0}
									title="Your last name"
									onChange={this.handleChange.bind(this, "last_name")}
									helperText={this.state.error.last_name}
								/>

								<br />
								<br />

								<TextField
									className={this.props.classes.textField}
									label="Username"
									error={this.state.error.username.length > 0}
									title="Username to sign in to your account"
									onChange={this.handleChange.bind(this, "username")}
									helperText={this.state.error.username}
								/>

								<TextField
									className={this.props.classes.textField}
									label="Email Address"
									error={this.state.error.email.length > 0}
									title="Email address (can also be used to sign in)"
									onChange={this.handleChange.bind(this, "email")}
									helperText={this.state.error.email}
								/>

								<br />
								<br />

								<TextField
									className={this.props.classes.textField}
									type="password"
									label="Password"
									error={this.state.error.password.length > 0}
									title="Password to access your account"
									onChange={this.handleChange.bind(this, "password")}
									helperText={this.state.error.password}
								/>

								<TextField
									className={this.props.classes.textField}
									type="password"
									label="Confirm Password"
									error={this.state.error.confirm_password.length > 0}
									title="Re-enter your chosen password"
									onChange={this.handleChange.bind(this, "confirm_password")}
									helperText={this.state.error.confirm_password}
								/>

								<br />
								<br />

								<TextField
									className={this.props.classes.textField}
									label="Access Key"
									error={this.state.error.token.length > 0}
									title="You need an access key to create an account. If you have been invited to join, you will have been sent one."
									onChange={this.handleChange.bind(this, "token")}
									helperText={this.state.error.token}
								/>

								<br />
								<br />

								<br />

								<Button variant="contained" color="primary" type="submit">
									Register
								</Button>
							</form>

							<br />

							<Typography component="p">{this.state.error.non_field_errors}</Typography>

							<br />

							<Typography>
								<Link to="/login">Return to Login</Link>
							</Typography>
						</Paper>
					</Grid>
				</Grid>
			</Fragment>
		);
	}
}

export default withWidth()(withStyles(RegisterPage.styles)(RegisterPage));
