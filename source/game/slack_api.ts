import * as request from 'request';
import * as express from 'express';
import { EventEmitter } from 'events';
import { SlackAPIConfig, SlackMessage } from '../interfaces/slack_api.interface';

export class SlackAPI {
	commands: EventEmitter;
	actions: EventEmitter;
	config: SlackAPIConfig;

	static responseFactory(res: express.Response): Function {
		return (msg: SlackMessage) => {
			res.json(JSON.stringify(msg));
		}
	}

	constructor(config: SlackAPIConfig) {
		this.commands = new EventEmitter();
		this.actions = new EventEmitter();
		this.config = config;
	}

	sendMessage(): void {

	}

	registerRoutes(app: express.Application) {
		if (this.config.commands) {
			app.use(this.config.commands.endpoint, (req, res, next) => {
				if (req.body) {
					this.commands.emit(req.body.command, SlackAPI.responseFactory(res));
				}
			});
		}
		if (this.config.actions) {
			app.use(this.config.actions.endpoint, (req, res, next) => {
				if (req.body) {

				}
			});
		}
	}
}
