import * as request from 'request-promise-native';
import * as express from 'express';
import { EventEmitter } from 'events';
import { SlackAPIConfig, SlackMessage, SlashCommandResponseSender, MessageResponse } from '../interfaces/slack_api.interface';

export class SlackAPI {
	commands: EventEmitter;
	actions: EventEmitter;
	config: SlackAPIConfig;

	static responseFactory(res: express.Response): SlashCommandResponseSender {
		return (msg: SlackMessage) => {
			res.json(msg);
		}
	}

	constructor(config: SlackAPIConfig) {
		this.commands = new EventEmitter();
		this.actions = new EventEmitter();
		this.config = config;
	}

	sendMessage(msg: SlackMessage): request.RequestPromise {
		let body = Object.assign({ token: this.config.authToken }, msg);
		return request.post('https://slack.com/api/chat.postMessage', {
			form: Object.assign({ token: this.config.authToken }, msg)
		});
	}

	registerRoutes(app: express.Application) {
		if (this.config.commands) {
			app.use(this.config.commands.endpoint, (req, res, next) => {
				if (req.body) {
					this.commands.emit(req.body.command, req.body, SlackAPI.responseFactory(res));
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
