const Avaamo = require("./index"),
	UUID = require("uuid");
 // const bot_uuid = "9235844f-78ee-45ea-b285-5367a71f2808",
 //  	access_token = "O7wyIr9i44f43mMvW3lvBqtNAUeaw0-D",
const bot_uuid = "36a39928-7a82-4450-9fc7-760207ab6b71",
	access_token = "3RnVNLZjLh55jXDcm6wU6X5bXZD8t72_";

new Avaamo(bot_uuid, access_token, {
	create_ticket: (response) => {
		console.log("Request from bot engine", JSON.stringify(response));
		return {
			ticket_id: UUID.v4()
		};
	},
	edit_ticket: (response) => {
		return response;
	}
}, true);
