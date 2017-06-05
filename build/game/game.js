"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Game {
    constructor(slackAPI, options) {
        this.participants = [];
        this.participants = options.participants;
        this.threadId = options.threadId;
        this.channelId = options.channelId;
        slackAPI.commands.on('request-hand', () => { });
    }
    addUser(user) {
    }
}
exports.Game = Game;
