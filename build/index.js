"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express = require("express");
const logger = require("morgan");
const config = require('../config.json');
const slack_api_1 = require("./game/slack_api");
const game_1 = require("./game/game");
const user_1 = require("./game/user");
const routes_1 = require("./routes");
class App {
    // private slackAPIIndex: {[channelId: string]: SlackAPI } = {};
    constructor() {
        this.gameIndex = {};
        this.express = express();
        this.middleware();
        this.routes();
        let slackAPI = new slack_api_1.SlackAPI({
            verificationToken: config.verificationToken,
            authToken: config.oAuthToken,
            commands: {
                endpoint: '/slack/commands'
            },
            actions: {
                endpoint: '/slack/actions'
            }
        });
        slackAPI.commands.on('/cah-start', (res, sendMsg) => {
            if (this.gameIndex[res.channel_id]) {
                sendMsg({
                    text: 'A game is already in progress in this channel.'
                });
            }
            else if (!res.text || res.text.length === 0) {
                sendMsg({
                    text: 'You did not specify poeple.'
                });
            }
            else {
                sendMsg({
                    response_type: 'in_channel',
                    text: 'Starting new game.'
                });
                let userTokens = res.text.split(' ');
                let judgeNum, participants, openGame;
                openGame = parseInt(res.text, 10);
                if (!openGame) {
                    openGame = false;
                    judgeNum = Math.floor(Math.random() * userTokens.length);
                    participants = userTokens.map((token, index) => {
                        let nameId = token.split('|');
                        let userData = {
                            id: nameId[0].slice(nameId[0].indexOf('<@') + 2),
                            name: nameId[1].substr(0, nameId[1].indexOf('>'))
                        };
                        let userOptions = {
                            isJudge: index === judgeNum
                        };
                        return new user_1.User(userData, userOptions);
                    });
                }
                slackAPI.sendMessage({
                    channel: res.channel_id,
                    text: participants ? 'Join this thread. Sending invitations to ' + participants.map(user => '@' + user.data.name).join(', ')
                        : 'Open game, anyone can join'
                }).then((gameThread) => {
                    let options = {
                        channelId: gameThread.channel,
                        participants: participants || [],
                        threadId: gameThread.ts,
                        openGame: openGame
                    };
                    let newSlackAPI = new slack_api_1.SlackAPI({
                        verificationToken: config.verificationToken,
                        authToken: config.oAuthToken,
                        commands: {
                            endpoint: '/slack/commands'
                        },
                        actions: {
                            endpoint: '/slack/actions'
                        },
                        limitTo: { channel: gameThread.channel }
                    });
                    newSlackAPI.registerRoutes(this.express);
                    this.gameIndex[gameThread.channel] = new game_1.Game(newSlackAPI, options);
                    newSlackAPI.commands.on('/cah-stop', (cres, csendMsg) => {
                        let game = this.gameIndex[cres.channel_id];
                        if (game) {
                            game.destroy().then(() => {
                                this.gameIndex[cres.channel_id] = null;
                                delete this.gameIndex[cres.channel_id];
                            });
                        }
                        else {
                            csendMsg({
                                response_type: 'ephemeral',
                                text: 'There is no game to stop.'
                            });
                        }
                    });
                }).catch(err => {
                    console.log('Error sending message', err.message);
                });
            }
        });
        slackAPI.commands.on('/cah-stop', (res, sendMsg) => {
            let game = this.gameIndex[res.channel_id];
            if (game) {
                game.destroy().then(() => {
                    this.gameIndex[res.channel_id] = null;
                    delete this.gameIndex[res.channel_id];
                });
            }
            else {
                sendMsg({
                    response_type: 'ephemeral',
                    text: 'There is no game to stop.'
                });
            }
        });
        slackAPI.registerRoutes(this.express);
    }
    // Configure Express middleware.
    middleware() {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use('/slack', (err, req, res, next) => {
            console.log('custom handler', err);
        });
    }
    // Configure API endpoints.
    routes() {
        let router = new routes_1.Router().router;
        this.express.use('/', router);
    }
}
exports.default = new App().express;
