// Face box element class
class Personbox extends Filebox {
	constructor () {
		super();

		this.template = "#template-personbox";

		this.classes = "mdc-elevation--z1";
	}

	connectedCallback () {
		super.connectedCallback();

		this.onclick = null;
		this.ondblclick = null;
	}

	generate () {
		var person = this.person;

		if (person.thumbnail !== null) {
			this.imageLoader = new ImageLoader($(this).find(".imgthumb").get(0), {id: person.thumbnail, type: "face"}, 2, function () { $(this.image).removeClass("imgthumb-loading"); });
		}

		$(this).find(".filelink").attr("href", "/people/" + person.full_name).attr("data-api", "/people/" + person.id);

		$(this).find(".personbox-name").text(person.full_name);
		$(this).find(".personbox-count").text("(" + person.face_count + ")");

		this.scale();
	}

	scale (scale) {
		scale = parseInt(scale || $("#thumbScaler").val());

		$(this).css({"width": scale * 4 / 5, "height": scale + Math.sqrt(scale) * 1.8});

		// TODO test all this stuff with /people/
		// fix the server

		let updates = {
			".imgthumb": {"height": scale + "px"},
			".filename": {"fontSize": Math.sqrt(scale) * 1.2, "margin-top": (Math.pow(scale, 1 / 4) - 4) + "px"},
			".face-alt": {"font-size": scale * 4 / 5 + "px", "line-height": scale + "px"}
		};

		for (var selector in updates) $(this).find(selector).css(updates[selector]);
	}

	get person () { return this.file; }
}

window.customElements.define("person-box", Personbox);
