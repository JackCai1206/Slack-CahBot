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
    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
        this.slackAPI = new slack_api_1.SlackAPI({
            authToken: config.oAuthToken,
            commands: {
                endpoint: '/slack/commands'
            },
            actions: {
                endpoint: '/slack/actions'
            }
        });
        this.slackAPI.commands.on('/cah-start', (res, sendMsg) => {
            console.log(res);
            if (this.game) {
                sendMsg({
                    text: 'A game is already in progress.'
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
                let judgeNum = Math.floor(Math.random() * userTokens.length);
                let participants = userTokens.map((token, index) => {
                    let nameId = token.split('|');
                    let userData = {
                        id: nameId[0].slice(nameId[0].indexOf('<') + 1),
                        name: nameId[1].substr(0, nameId[1].indexOf('>'))
                    };
                    let userOptions = {
                        isJudge: index === judgeNum
                    };
                    return new user_1.User(userData, userOptions);
                });
                this.slackAPI.sendMessage({
                    channel: res.channel_id,
                    text: 'Join this thread. Sending invitations to ' + participants.map(user => '@' + user.data.name).join(', ')
                }).then((gameThread) => {
                    const options = {
                        channelId: gameThread.channel,
                        participants: participants,
                        threadId: gameThread.ts
                    };
                    this.game = new game_1.Game(this.slackAPI, options);
                }).catch(err => {
                    console.log(err.message);
                });
            }
        });
        this.slackAPI.commands.on('/cah-stop', (res, sendMsg) => {
            if (this.game) {
                sendMsg({
                    response_type: 'in_channel',
                    text: 'Current game ended.'
                });
                delete this.game;
            }
            else {
                sendMsg({
                    response_type: 'in_channel',
                    text: 'There is no game to stop.'
                });
            }
        });
        this.slackAPI.registerRoutes(this.express);
    }
    // Configure Express middleware.
    middleware() {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use('/slack', (req, res, next) => {
            if (req.body.token === config.slackToken) {
                next();
            }
            else {
                res.status(403);
                res.send('Slack API token mismatch!');
            }
        });
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
