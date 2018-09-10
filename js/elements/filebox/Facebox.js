// Face box element class
class Facebox extends Filebox {
	constructor () {
		super();

		this.template = "#template-facebox";
	}

	generate () {
		$(this).find(".imgthumb").attr("src", serverUrl + "api/images/faces/" + $(this).attr("data-id") + "/200/");

		if (this.face === null) return;

		this.showIcons();

		this.scale();
	}

	scale (scale) {
		scale = parseInt(scale || $("#thumbScaler").val());

		$(this).css({"width": scale * 8 / 15, "height": scale * 2 / 3});
		$(this).find(".face-status").css({"font-size": (scale / 5) + "px", "line-height": (scale * 4 / 15) + "px"});
		$(this).find(".facecheckbox").css("display", pageLoader.config.get("select_mode") == 1 ? "none" : "");
		//$(this).find(".thumbbox").css({"font-size": (scale * 2 / 3) + "px", "line-height": (scale * 2 / 3) + "px"});
		//$(this).find(".fcbox-cont").css("height", "calc(5% + " + (Math.sqrt(scale) * 1.2 + 6) + "px)");
		this.checkbox.setSize(Math.sqrt(scale) * 1.5);

		this.rippleAPI.layout();
	}

	showIcons () {
		if (this.face.status <= 1) $(this).find(".face-status").addClass("material-icons").text("check");
		else $(this).find(".face-status").removeClass("material-icons").text("?");
	}

	get face () { return this.file; }
}

window.customElements.define("face-box", Facebox);
