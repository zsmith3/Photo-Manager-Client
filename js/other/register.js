$(document).ready(function () {
	mdc.ripple.MDCRipple.attachTo($(".mdc-button").get(0));
});

function submitRegistration () {
	data = Object.assign(...$("#input-cont").find("mdc-text").map(function () { return {[this.id]: this.value}; }));

	apiRequest("membership/register/", "POST", data).then(function (data) {
		window.location = getPageUrl("login");
	}).catch(function (error) {
		$("#status").text("Invalid registration.");
	});
}
