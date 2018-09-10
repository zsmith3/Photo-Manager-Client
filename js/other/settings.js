//Fetch config on document ready
$(document).ready(function () {
	fetchConfig(1000);
});

//Fetch config settings from server
function fetchConfig(currentTimeout) {
	$.ajax({
		url: serverUrl + "api/config",
		success: function (data, status) {
			setupPage(data);
		},
		error: function (xhr, error) {
			if (error == "timeout" && currentTimeout < 10000) {
				console.log("Request timed out. Retrying...");
				fetchConfig(currentTimeout * 2);
			} else {
				$("#status").text("An unknown error occurred.");
			}
		},
		timeout: currentTimeout
	});
}

//Set up the page from data retrieved
function setupPage(data) {
	for (setting in data.defaultConfig) {
		row = $("<tr></tr>").appendTo("#config-options tbody");
		$("<td></td>").text(data.defaultConfig[setting].name).appendTo(row);
		inpspan = $("<td class='inputspan'></td>").appendTo(row);
		inp = $("<div></div>").appendTo(inpspan);

		switch (data.defaultConfig[setting].type) {
		case "boolean":
			$("<input type='checkbox' class='filled-in' />").attr("id", setting + "_input").attr("name", setting).val(true).attr("checked", data.config[setting][data.platform]).appendTo(inp);
			$("<label></label>").attr("for", setting + "_input").appendTo(inp);
			$("<input type='hidden' />").attr("id", setting + "_hidden").attr("name", setting).val(false).attr("disabled", data.config[setting][data.platform]).appendTo(inp);

			break;
		case "set":
			inp.addClass("input-field");
			sel = $("<select></select>").attr("name", setting).appendTo(inp);

			for (ind in data.defaultConfig[setting].val_options) {
				option = data.defaultConfig[setting].val_options[ind];
				$("<option></option>").val(option).attr("selected", data.config[setting][data.platform] == ind).text(option).appendTo(sel);
			}

			break;
		case "range":
			inp.addClass("input-field");
			$("<input type='text' />").attr("id", setting + "_out").val(data.config[setting][data.platform]).appendTo(inp);
			$("<input type='range' />").attr("id", setting + "_in").attr("name", setting).val(data.config[setting][data.platform]).attr("min", data.defaultConfig[setting].val_options[0]).attr("max", data.defaultConfig[setting].val_options[1]).appendTo(inp);

			break;
		}
	}

	$("input[type=checkbox]").click(function () {
		$("#" + this.id.substr(0, this.id.lastIndexOf("_")) + "_hidden").attr("disabled", this.checked);
	});

	$("input[type=text]").on("input", function () {
		$("#" + this.id.substr(0, this.id.lastIndexOf("_")) + "_in").val(this.value);
	});

	$("input[type=range]").on("input", function () {
		$("#" + this.id.substr(0, this.id.lastIndexOf("_")) + "_out").val(this.value);
	});

	$("select").material_select();
}

//Submit the changed config settings
function submitConfig(currentTimeout) {
	$.ajax({
		url: serverUrl + "api/config",
		type: "post",
		data: $("#configform").serialize(),
		success: function () {
			$("#status").text("Changes Saved.");
		},
		error: function (xhr, error) {
			if (error == "timeout" && currentTimeout < 10000) {
				console.log("POST request timed out. Retrying...");
				submitConfig(currentTimeout * 2);
			} else {
				$("#status").text("An unknown error occurred.");
			}
		},
		timeout: currentTimeout
	});
}
