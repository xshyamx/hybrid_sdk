const Avaamo = require("./index");
const bot_uuid = "<YOUR_BOT_UUID>",
	access_token = "<YOUR_BOT_ACCESS_TOKEN>";

new Avaamo(bot_uuid, access_token, {
	create_ticket: (response) => {
		console.log("Request from designer", JSON.stringify(response));
		return {
			ticket_id: "My Ticket ID"
		};
	},
	edit_ticket: (response) => {
		return response;
	}
}, true);
