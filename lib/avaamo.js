/*
 * Filename: avaamo.js
 * Author: Jebin B V
 * Created Date: 18 May 2017
 * Description: Hybrid Bot SDK main class
 */
/* jshint node: true, devel: true */
"use strict";

const WebSocket = require("ws"),
  Promise = require("promise"),
  Utils = require("./utils"),
  url = require("url"),
  HttpsProxyAgent = require("https-proxy-agent");

const Logger = Utils.Logger,
  Helper = Utils.Helper,
  credentials = Utils.Credentials;

function Avaamo(bot_uuid, access_token, services, logger) {
  if (!bot_uuid) {
    throw "Bot UUID cannot be empty";
  }

  if (!access_token) {
    throw "Access Token cannot be empty";
  }

  credentials.bot_uuid = this.bot_uuid = bot_uuid;
  credentials.access_token = this.access_token = access_token;
  this.logger = logger = logger === undefined ? true : logger;
  this.services = services || {};
  this.ref = 1;

  this.messages_channel = "hybrid_messages." + bot_uuid;
  this.server_hybrid_messages_channel = "server.hybrid_messages";
  this.channels = [this.messages_channel, this.server_hybrid_messages_channel];

  this.url = Helper.DS_HOST + Helper.DS_URI(this.access_token);
  this.isClosing = false;
  this.pingTimer = [];

  this.init(logger);
  return this;
}

Avaamo.prototype.init = function init(logger) {
  Logger.debug = logger;
  console.log("Bot listening...");
  var opts = {};
  if (!!process.env.https_proxy) {
    // setup proxy
    opts.agent = new HttpsProxyAgent(url.parse(process.env.https_proxy));
  }
  this.socket = new WebSocket(this.url, opts);
  this.join();
};

Avaamo.prototype.destroy = function destroy(logger) {
  Logger.debug = logger;
  this.isClosing = true;
  this.pingTimer &&
    this.pingTimer.forEach(function(timer) {
      clearTimeout(timer);
    });
  this.socket && this.socket.close();
  this.socket = null;
  this.services = null;
};

Avaamo.prototype.join = function join() {
  let joinRef = this.ref;
  this.socket.on(
    "open",
    function open() {
      Logger.log("Connection successfully opened");
      //join channel
      this.channels.forEach(
        function(channel, key) {
          Logger.log(`Joining ${key} channel`);
          let data = {
            topic: channel,
            event: "phx_join",
            payload: {},
            ref: this.ref++
          };
          this.socket.send(JSON.stringify(data), function(error) {
            if (error) {
              Logger.log("Join failed", error);
            } else {
              Logger.log("Join request sent successfully");
            }
          });
        }.bind(this)
      );
    }.bind(this)
  );
  this.socket.on("error", function error(error) {
    Logger.log("Error in socket", error);
  });
  this.socket.on(
    "message",
    function message(event) {
      let payload = JSON.parse(event);
      if (
        payload.topic === this.messages_channel &&
        payload.event === "phx_reply" &&
        payload.ref === joinRef
      ) {
        if (payload.payload.status === "ok") {
          Logger.log("Joined messages channel successfully");
          this.ping();
        } else {
          Logger.log("Unable to join messages channel");
        }
      }
      if (
        payload.topic === this.messages_channel && payload.event === "message"
      ) {
        this._executeService(payload.payload);
      }
      if (
        payload.topic === this.server_hybrid_messages_channel &&
        payload.event === "phx_reply" &&
        payload.ref === joinRef
      ) {
        if (payload.payload.status === "ok") {
          Logger.log("Joined server channel successfully");
          this.ping();
        } else {
          Logger.log("Unable to join server channel");
        }
      }
    }.bind(this)
  );
  this.socket.on(
    "close",
    function close(event) {
      Logger.log("Socket closed", event);
      if (this.isClosing !== true) {
        this.init(Logger.debug);
      }
    }.bind(this)
  );
};

Avaamo.prototype._executeService = function(payload) {
  if (this.services && this.services[payload.service_name]) {
    if (typeof this.services[payload.service_name] === "function") {
      let serviceResult = this.services[payload.service_name](
        payload.message,
        this
      );
      return Promise.resolve(serviceResult).then(res => {
        return this.send({
          service_name: payload.service_name,
          message_uuid: payload.message_uuid,
          conversation_uuid: payload.conversation_uuid,
          message: res
        });
      });
    } else {
      return this.send({
        service_name: payload.service_name,
        message_uuid: payload.message_uuid,
        conversation_uuid: payload.conversation_uuid,
        message: {
          error: 403,
          message: `Service "${payload.service_name}" is not a method`
        }
      });
    }
  } else {
    return this.send({
      service_name: payload.service_name,
      message_uuid: payload.message_uuid,
      conversation_uuid: payload.conversation_uuid,
      message: {
        error: 404,
        message: `Service "${payload.service_name}" not found`
      }
    });
  }
};

Avaamo.prototype.ping = function ping() {
  Logger.log("Pinging server...");
  let data = {
    topic: "phoenix",
    event: "heartbeat",
    payload: {},
    ref: this.ref++
  };
  this.socket.send(JSON.stringify(data), function pingSend(error) {
    if (error) {
      Logger.log("Error in sending ping message", error);
    }
  });
  this.pingTimer.push(
    setTimeout(
      function() {
        this.ping();
      }.bind(this),
      30000
    )
  );
};

Avaamo.prototype.send = function _send(data) {
  data.bot_uuid = this.bot_uuid;
  let _data = {
    topic: this.server_hybrid_messages_channel,
    event: "message",
    ref: Math.floor(Math.random() * 1000),
    payload: data
  };
  return this.socket.send(JSON.stringify(_data), error => {
    if (error) {
      Logger.log("Error in sending paylod to server", error);
    }
  });
};

module.exports = Avaamo;
