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
	private gameIndex: {[channelId: string]: Game | null } = {};
	// private slackAPIIndex: {[channelId: string]: SlackAPI } = {};

	constructor () {
		this.express = express();
		this.middleware();
		this.routes();

		let slackAPI = new SlackAPI({
			verificationToken: config.verificationToken,
			authToken: config.oAuthToken,
			commands: {
				endpoint: '/slack/commands'
			},
			actions: {
				endpoint: '/slack/actions'
			}
		});

		slackAPI.commands.on('/cah-start', (res: SlashCommandReq, sendMsg: SlashCommandResponseSender) => {

			if (this.gameIndex[res.channel_id]) {
				sendMsg({
					text: 'A game is already in progress in this channel.'
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
				let judgeNum, participants, openGame;
				openGame = parseInt(res.text, 10);
				if (!openGame) {
					openGame = false;
					judgeNum = Math.floor(Math.random() * userTokens.length);
					participants = userTokens.map((token, index) => {
							let nameId = token.split('|');
							let userData: UserData = {
								id: nameId[0].slice(nameId[0].indexOf('<@') + 2),
								name: nameId[1].substr(0, nameId[1].indexOf('>'))
							}
							let userOptions: UserOptions = {
								isJudge: index === judgeNum
							}
							return new User(userData, userOptions);
						});
				}

				slackAPI.sendMessage({
					channel: res.channel_id,
					text: participants ? 'Join this thread. Sending invitations to ' + participants.map(user => '@' + user.data.name).join(', ')
					: 'Open game, anyone can join'
				}).then((gameThread: MessageResponse) => {
					let options: GameOptions = {
						channelId: gameThread.channel,
						participants: participants || [],
						threadId: gameThread.ts,
						openGame: openGame
					}

					let newSlackAPI = new SlackAPI({
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
					this.gameIndex[gameThread.channel] = new Game(newSlackAPI, options);
					newSlackAPI.commands.on('/cah-stop', (cres: SlashCommandReq, csendMsg) => {
						let game = this.gameIndex[cres.channel_id];
						if (game) {
							csendMsg();
							game.destroy().then(() => {
								this.gameIndex[cres.channel_id] = null;
								delete this.gameIndex[cres.channel_id];
							})
						} else {
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

		slackAPI.commands.on('/cah-stop', (res: SlashCommandReq, sendMsg) => {
			let game = this.gameIndex[res.channel_id];
			if (game) {
				sendMsg();
				game.destroy().then(() => {
					this.gameIndex[res.channel_id] = null;
					delete this.gameIndex[res.channel_id];
				})
			} else {
				sendMsg({
					response_type: 'ephemeral',
					text: 'There is no game to stop.'
				});
			}
		});

		slackAPI.registerRoutes(this.express);
	}

	// Configure Express middleware.
	private middleware(): void {
		this.express.use(logger('dev'));
		this.express.use(bodyParser.json());
		this.express.use(bodyParser.urlencoded({ extended: false }));
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
