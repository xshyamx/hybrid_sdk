"use strict";
const UUID = require("uuid");
const Promise = require("promise");
const fs = require("fs");
const Utils = require("./utils");

let buildCardJson = function(card, credentials) {
	if (!card.title && !card.description && !card.showcase_image_path && !card.links && !card.inputs && !card.showcase_image_uuid) {
		throw "Atleast title is required";
	}

	if ((card.links || []).length) {
		card.links.forEach(function(link, index) {
			link.position = index;
		});
	}

	if ((card.inputs || []).length) {
		card.inputs.forEach(function(input, index) {
			input.position = index;
		});
	}
	return new Promise(function(resolve, reject) {
		if (card.showcase_image_path) {
			let data = { data: fs.createReadStream(card.showcase_image_path) };
			console.log("Sending showcase image...");
			Utils.sendAttachment(data, credentials, Utils.Helper.APP_SERVER_FILES_URI).then(
				function(res) {
					card.showcase_image_uuid = res.file.uuid;
					resolve(card);
				},
				function(err) {
					console.error("Failed to upload the Showcase Image", err);
					reject(err);
				}
			);
		} else {
			resolve(card);
		}
	});
};

module.exports = {
	liveAgentControl: Utils.liveAgentControl,
	sendMessage(content, conversation_uuid, credentials, request_message_uuid) {
		let data = {
			message: {
				uuid: UUID.v4(),
				content: content,
				content_type: "text",
				request_message_uuid: request_message_uuid,
				user: {
					layer_id: credentials.layer_id
				},
				conversation: {
					uuid: conversation_uuid
				}
			}
		};
		return Utils.sendJSON(data, credentials);
	},
	acknowledgeMessage(payload, credentials) {
		let data = {
			read_acks: [
				{
					read_at: Date.now() / 1000,
					message: {
						uuid: payload.message.uuid,
						user: {
							layer_id: payload.user.layer_id
						},
						conversation_uuid: payload.conversation.uuid
					}
				}
			]
		};
		return Utils.sendJSON(data, credentials, Utils.Helper.APP_SERVER_READ_ACK);
	},

	sendCard(card, content, conversation_uuid, credentials, request_message_uuid) {
		let bot_uuid = credentials.layer_id;

		if (!card.title && !card.description && !card.showcase_image_path && !card.links && !card.inputs && !card.showcase_image_uuid) {
			throw "Atleast title is required";
		}

		if ((card.links || []).length) {
			card.links.forEach(function(link, index) {
				link.position = index;
			});
		}

		if ((card.inputs || []).length) {
			card.inputs.forEach(function(input, index) {
				input.position = index;
			});
		}
		let sendCard = () => {
			return Utils.sendJSON(
				{
					message: {
						uuid: UUID.v4(),
						content: content,
						content_type: "default_card",
						request_message_uuid: request_message_uuid,
						attachments: {
							default_card: card
						},
						user: {
							layer_id: bot_uuid
						},
						conversation: {
							uuid: conversation_uuid
						}
					}
				},
				credentials
			);
		};

		let send = (resolve, reject) => {
			sendCard().then(
				res => {
					resolve(res);
					console.log("Card sent successfully");
				},
				err => {
					reject(err);
					console.error("Card sending failed", err);
				}
			);
		};

		return new Promise(function(resolve, reject) {
			if (card.showcase_image_path) {
				let data = { data: fs.createReadStream(card.showcase_image_path) };
				console.log("Sending showcase image...");
				Utils.sendAttachment(data, credentials, Utils.Helper.APP_SERVER_FILES_URI).then(
					function(res) {
						card.showcase_image_uuid = res.file.uuid;
						send(resolve, reject);
					},
					function(err) {
						console.error("Failed to upload the Showcase Image", err);
					}
				);
			} else {
				send(resolve, reject);
			}
		});
	},
	sendQuickReply(quick_reply, content, conversation_uuid, credentials, request_message_uuid) {
		let bot_uuid = credentials.layer_id;
		let sendQReply = () => {
			return Utils.sendJSON(
				{
					message: {
						uuid: UUID.v4(),
						content: content,
						content_type: "quick_reply",
						request_message_uuid: request_message_uuid,
						attachments: {
							quick_reply: quick_reply
						},
						user: {
							layer_id: bot_uuid
						},
						conversation: {
							uuid: conversation_uuid
						}
					}
				},
				credentials
			);
		};

		let send = (resolve, reject) => {
			sendQReply().then(
				res => {
					resolve(res);
					console.info("Quick Reply sent successfully");
				},
				err => {
					reject(err);
					console.error("Quick Reply sending failed", err);
				}
			);
		};
		return new Promise(function(resolve, reject) {
			buildCardJson(quick_reply, credentials).then(
				function(json) {
					if (!json.links || !json.links.length) {
						// throw "Atleast One link is required";
						reject("Atleast One link is required");
					} else {
						quick_reply = json;
						send(resolve, reject);
					}
				},
				function(err) {
					reject(err);
					console.error("Quick Reply Json Build failed");
				}
			);
		});
	},
	sendCarousel(carousel, content, conversation_uuid, credentials, request_message_uuid) {
		let bot_uuid = credentials.layer_id;
		let showcaseImages = [];

		if (carousel.cards && carousel.cards.length) {
			carousel.cards.forEach((card, index) => {
				card.uuid = UUID.v4();
				if (!card.title && !card.description && !card.showcase_image_path && !card.showcase_image_uuid && !card.links && !card.inputs) {
					throw "At least title is required";
				}

				if (card.showcase_image_path) {
					showcaseImages.push({ idx: index, path: card.showcase_image_path });
				}

				if ((card.links || []).length) {
					card.links.forEach((link, index) => {
						link.position = index;
					});
				}

				if ((card.inputs || []).length) {
					card.inputs.forEach((card, index) => {
						card.position = index;
					});
				}
			});
		}

		let send = () => {
			let data = {
				message: {
					uuid: UUID.v4(),
					content: content,
					content_type: "card_carousel",
					request_message_uuid: request_message_uuid,
					attachments: {
						card_carousel: carousel
					},
					user: {
						layer_id: bot_uuid
					},
					conversation: {
						uuid: conversation_uuid
					}
				}
			};
			return Utils.sendJSON(data, credentials);
		};

		let sendCarouselJSON = (resolve, reject) => {
			send().then(
				function(res) {
					console.info("Carousel sent successfully");
					resolve(res);
				},
				function(err) {
					console.error("Carousel Sending failed", err);
					reject(err);
				}
			);
		};

		return new Promise(function(resolve, reject) {
			console.log("showcaseImages ::" + JSON.stringify(showcaseImages));
			if (showcaseImages.length > 0) {
				let attachmentPromises;
				attachmentPromises = showcaseImages.map(cardImage => {
					let data = { data: fs.createReadStream(cardImage.path) };
					console.log("Sending image...");
					return Utils.sendAttachment(data, credentials, Utils.Helper.APP_SERVER_FILES_URI).then(
						function(res) {
							carousel.cards[cardImage.idx].showcase_image_uuid = res.file.uuid;
							return res;
						},
						function(err) {
							console.error("Failed to upload the Showcase Image", err);
						}
					);
				});
				Promise.all(attachmentPromises).then(
					function() {
						sendCarouselJSON(resolve, reject);
					},
					function(e) {
						console.error("Failed to upload the Showcase Image", e);
					}
				);
			} else {
				sendCarouselJSON(resolve, reject);
			}
		});
	},
	sendListView(listView, content, conversation_uuid, credentials, request_message_uuid) {
		let bot_uuid = credentials.layer_id;
		let showcaseImages = [];

		if (!listView.items && !listView.items.length && (!listView.links && !listView.links.length)) {
			throw "Atleast one item or link is required";
		}

		if (listView.items && listView.items.length) {
			listView.items.forEach((item, index) => {
				item.uuid = UUID.v4();
				item.position = index;
				if (!item.title && !item.subtitle && !item.image_path && !item.image_id && !item.links) {
					throw "At least title is required";
				}

				if (item.image_path) {
					showcaseImages.push({ idx: index, path: item.image_path });
				}

				if (item.default_action && !item.default_action.type && !item.default_action.url) {
					throw "Default action is invalid";
				}

				if ((item.links || []).length) {
					item.links.forEach((link, lindex) => {
						if (!link.title || !link.type) {
							throw "Link must have title, type";
						}
						link.position = lindex;
					});
				}
			});
		}

		if (listView.links && listView.links.length) {
			listView.links.forEach((link, lindex) => {
				if (!link.title || !link.type) {
					throw "Link must have title, type";
				}
				link.position = lindex;
			});
		}

		let send = () => {
			let data = {
				message: {
					uuid: UUID.v4(),
					content: content,
					content_type: "list_view",
					request_message_uuid: request_message_uuid,
					attachments: {
						list_view: listView
					},
					user: {
						layer_id: bot_uuid
					},
					conversation: {
						uuid: conversation_uuid
					}
				}
			};
			return Utils.sendJSON(data, credentials);
		};

		let sendListViewJSON = (resolve, reject) => {
			send().then(
				function(res) {
					console.info("ListView sent successfully");
					resolve(res);
				},
				function(err) {
					console.error("ListView Sending failed", err);
					reject(err);
				}
			);
		};

		return new Promise(function(resolve, reject) {
			console.log("showcaseImages ::" + JSON.stringify(showcaseImages));
			if (showcaseImages.length > 0) {
				let attachmentPromises;
				attachmentPromises = showcaseImages.map(cardImage => {
					let data = { data: fs.createReadStream(cardImage.path) };
					console.log("Sending image...");
					return Utils.sendAttachment(data, credentials, Utils.Helper.APP_SERVER_FILES_URI).then(
						function(res) {
							listView.items[cardImage.idx].image_id = res.file.id;
							return res;
						},
						function(err) {
							console.error("Failed to upload the Showcase Image", err);
						}
					);
				});
				Promise.all(attachmentPromises).then(
					function() {
						sendListViewJSON(resolve, reject);
					},
					function(e) {
						console.error("Failed to upload the Showcase Image", e);
					}
				);
			} else {
				sendListViewJSON(resolve, reject);
			}
		});
	}
};
