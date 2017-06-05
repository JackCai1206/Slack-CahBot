import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';
const config = require('../config.json');
import { SlackAPI } from './game/slack_api';
import { Game } from './game/game';
import { User } from './game/user';
import { GameOptions } from './interfaces/game.interface';
import { UserData, UserOptions } from './interfaces/user.interface';
import { SlashCommandReq, SlashCommandResponseSender, MessageResponse } from './interfaces/slack_api.interface';

import { Router } from './routes';

class App {
	public express: express.Application;
	private game: Game;
	private slackAPI: SlackAPI;

	constructor () {
		this.express = express();
		this.middleware();
		this.routes();

		this.slackAPI = new SlackAPI({
			authToken: config.oAuthToken,
			commands: {
				endpoint: '/slack/commands'
			},
			actions: {
				endpoint: '/slack/actions'
			}
		});

		this.slackAPI.commands.on('/cah-start', (res: SlashCommandReq, sendMsg: SlashCommandResponseSender) => {
			console.log(res);

			if (this.game) {
				sendMsg({
					text: 'A game is already in progress.'
				});
			} else if (!res.text || res.text.length === 0) {
				sendMsg({
					text: 'You did not specify poeple.'
				});
			} else {
				sendMsg({
					response_type: 'in_channel',
					text: 'Starting new game.'
				});

				let userTokens = res.text.split(' ');
				let judgeNum = Math.floor(Math.random() * userTokens.length);
				let participants = userTokens.map((token, index) => {
						let nameId = token.split('|');
						let userData: UserData = {
							id: nameId[0].slice(nameId[0].indexOf('<') + 1),
							name: nameId[1].substr(0, nameId[1].indexOf('>'))
						}
						let userOptions: UserOptions = {
							isJudge: index === judgeNum
						}
						return new User(userData, userOptions);
					});

				this.slackAPI.sendMessage({
					channel: res.channel_id,
					text: 'Join this thread. Sending invitations to ' + participants.map(user => '@' + user.data.name).join(', ')
				}).then((gameThread: MessageResponse) => {
					const options: GameOptions = {
						channelId: gameThread.channel,
						participants: participants,
						threadId: gameThread.ts
					}

					this.game = new Game(this.slackAPI, options);
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
			} else {
				sendMsg({
					response_type: 'in_channel',
					text: 'There is no game to stop.'
				});
			}
		});

		this.slackAPI.registerRoutes(this.express);
	}

	// Configure Express middleware.
	private middleware(): void {
		this.express.use(logger('dev'));
		this.express.use(bodyParser.json());
		this.express.use(bodyParser.urlencoded({ extended: false }));
		this.express.use('/slack', (req, res, next) => {
			if (req.body.token === config.slackToken) {
				next();
			} else {
				res.status(403);
				res.send('Slack API token mismatch!');
			}
		});
		this.express.use('/slack', (err, req, res, next) => {
			console.log('custom handler', err);
		})
	}

	// Configure API endpoints.
	private routes(): void {
		let router = new Router().router;
		this.express.use('/', router);
	}

}

export default new App().express;
