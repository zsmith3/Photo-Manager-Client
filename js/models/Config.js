// Config class
class Config {
	constructor (data) {
		this.defaults = data.default_settings;
		this.platform = data.platform;
		delete data.default_settings;
		delete data.platform;

		this.userConfig = {desktop: {}, mobile: {}};
		for (var setting in data) {
			let settingPlatform = setting.substr(0, setting.indexOf("_"));
			let settingName = setting.substr(setting.indexOf("_") + 1);
			this.userConfig[settingPlatform][settingName] = data[setting];

			if (settingName.substr(0, settingName.indexOf("_")) == "show" && data[setting]) {
				if (window.innerWidth < 800 && settingName == "show_toolBar") continue;
				$("#" + settingName.substr(settingName.indexOf("_") + 1)).get(0).show(true);
			}
		}
	}

	get (setting) {
		return this.userConfig[this.platform][setting];
	}

	set (setting, value) {
		this.userConfig[this.platform][setting] = value;
		let data = {};
		data[this.platform + "_" + setting] = value;

		this.onUpdate(setting, value);

		apiRequest("membership/config/", "PATCH", data);
	}

	onUpdate (setting, value) {
		switch (setting) {
		case "select_mode":
			pageLoader.filesContainer.scaleFiles();
			$("#select-mode").val(value);
			break;
		}
	}
}
