'use strict'

const Credentials = {
  access_token: "",
  bot_uuid: ""
};

const Logger = {
  debug: false,
  log() {
    if(this.debug === true) {
      for(let x = 0; x < arguments.length; x++) {
        console.log(arguments[x], "\n");
      }
    }
    return this;
  }
};

const Helper = {
  	DS_HOST: (process.env.DS_HOST || Config.DS_HOST),
  	DS_URI: (access_token) => `/socket/websocket?access_token=${access_token}&user_agent=hybrid_bot`,
};

module.exports = {
  	Logger,
  	Helper,
  	Credentials
};
