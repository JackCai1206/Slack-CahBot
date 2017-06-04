import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';
const config = require('../config.json');
import { SlackAPI } from './game/slack_api';
import { Game } from './game/game';

import { Router } from './routes';

class App {
	public express: express.Application;

	constructor () {
		this.express = express();
		this.middleware();
		this.routes();

		const slackAPI = new SlackAPI({
			commands: {
				endpoint: '/slack/commands'
			},
			actions: {
				endpoint: '/slack/actions'
			}
		});

		slackAPI.commands.on('/cah-start', (sendMsg) => {
			sendMsg({
				response_type: 'in_channel',
				text: 'started'
			});
			const game = new Game(slackAPI);
		})

		slackAPI.registerRoutes(this.express);
	}

	// Configure Express middleware.
	private middleware(): void {
		this.express.use(logger('dev'));
		this.express.use(bodyParser.json());
		this.express.use(bodyParser.urlencoded({ extended: false }));
		this.express.use('/slack', function(req, res, next) {
			console.log(req.body);
			if (req.body.token === config.slackToken) {
				next();
			} else {
				next('Slack API token mismatch!');
			}
		})
	}

	// Configure API endpoints.
	private routes(): void {
		let router = new Router().router;
		this.express.use('/', router);
	}

}

export default new App().express;
