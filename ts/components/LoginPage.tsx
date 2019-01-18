import { Button, Checkbox, FormControlLabel, Grid, Paper, TextField, Typography, withStyles, withWidth } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import { isWidthUp } from "@material-ui/core/withWidth";
import React from "react";
import { Database } from "../controllers/Database";
import { Link } from "react-router-dom";

/** Separate page for logging in */
class LoginPage extends React.Component<{ classes: { center: string, paper: string }, width: Breakpoint, history: any }> {
	static styles = {
		center: {
			margin: "auto",
			textAlign: "center" as "center"
		},
		paper: {
			padding: 50,
			boxSizing: "border-box" as "border-box"
		}
	}

	state = {
		username: "",
		password: "",
		remain_in: true,
		error: { username: [], password: [], non_field_errors: [] }
	}

	/** Attempt to log in with current input data */
	handleSubmit (event: Event) {
		Database.auth.logIn(this.state.username, this.state.password, this.state.remain_in).then(() => {
			this.props.history.push("/folders/");
		}).catch((error) => {
			this.setState({ error: { username: error.username || [], password: error.password || [], non_field_errors: error.non_field_errors || [] } })
		});

		event.preventDefault();
	}

	render () {
		let Fragment = React.Fragment;
		return <Fragment>
				<Grid container spacing={24}>
					<Grid item xs={12} className={ this.props.classes.center }>
						<Typography variant={isWidthUp("sm", this.props.width) ? "h3" : "h4"} component="h1">
							Photo Manager/Fileserver
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4} lg={3} className={ this.props.classes.center }>
						<Paper elevation={4} className={ this.props.classes.paper }>
							<Typography variant={isWidthUp("sm", this.props.width) ? "h4" : "h5"} component="h3">
								Login
							</Typography>

							<Typography component="p">
								Please log in to access private files.
							</Typography>

							<br />

							<form onSubmit={ this.handleSubmit.bind(this) }>
								<TextField label="Username" error={ this.state.error.username.length > 0 } title="Please enter your username" onChange={(event) => this.setState({ username: event.target.value })} helperText={ this.state.error.username } />

								<br /><br />

								<TextField label="Password" error={ this.state.error.password.length > 0 } type="password" title="Please enter your password" onChange={(event) => this.setState({ password: event.target.value })} helperText={ this.state.error.password } />

								<br /><br />

								<FormControlLabel control={ <Checkbox checked={this.state.remain_in} onChange={(event) => this.setState({ remain_in: event.target.checked })} /> } label="Remain logged in" />

								<br /><br /><br />

								<Button variant="contained" color="primary" type="submit">Log in</Button>
							</form>

							<br />

							<Typography component="p">{ this.state.error.non_field_errors }</Typography>

							<br />

							<Typography><Link to="/register">Create Account</Link></Typography>
						</Paper>
					</Grid>
				</Grid>
			</Fragment>;
	}
}

export default withWidth()(withStyles(LoginPage.styles)(LoginPage));
