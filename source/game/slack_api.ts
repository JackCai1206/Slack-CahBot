import * as request from 'request';
import * as express from 'express';
import * as querystring from 'querystring';
import { EventEmitter } from 'events';
import {	SlackAPIConfig,
			SlackMessage,
			SlashCommandResponseSender,
			MessageResponse,
			SendMessageOptions } from '../interfaces/slack_api.interface';

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

	sendMessage(msg: SlackMessage, options?: SendMessageOptions): Promise<MessageResponse> {
		let body: any = Object.assign({ token: this.config.authToken }, msg);
		if (body.attachments) {
			body.attachments = JSON.stringify(body.attachments);
		}

		let url = options ? options.responseUrl : 'https://slack.com/api/chat.postMessage';
		return new Promise((resolve, reject) => {
			request.post(url, {
				form: body
			}, (err, resStr: request.RequestResponse) => {
				resStr.body = resStr.body.replace(/&quot;/g, '"');
				let res = JSON.parse(resStr.body);
				if (!err && res.ok === true) {
					resolve(res);
				}
				reject(res);
			})
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
					let payload = JSON.parse(req.body.payload);
					this.actions.emit(payload.callback_id, payload, SlackAPI.responseFactory(res));
				}
			});
		}
		app.use('/slack', (req, res, next) => {
			if (req.body.token === this.config.verificationToken) {
				next();
			} else {
				res.status(403);
				res.send('Slack API token mismatch!');
			}
		});
	}
}
