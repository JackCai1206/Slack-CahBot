"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const events_1 = require("events");
class SlackAPI {
    static responseFactory(res) {
        return (msg) => {
            res.json(msg);
        };
    }
    constructor(config) {
        this.commands = new events_1.EventEmitter();
        this.actions = new events_1.EventEmitter();
        this.config = config;
    }
    sendMessage(msg, options) {
        let body = Object.assign({ token: this.config.authToken }, msg);
        let useUrl = options && options.responseUrl;
        let url = 'https://slack.com/api/chat.postMessage';
        if (options && options.responseUrl) {
            url = options.responseUrl;
        }
        else if (options && options.update && !options.responseUrl) {
            url = 'https://slack.com/api/chat.update';
        }
        if (body.attachments && !useUrl) {
            body.attachments = JSON.stringify(body.attachments);
        }
        else if (useUrl) {
            body = { payload: JSON.stringify(body) };
        }
        return new Promise((resolve, reject) => {
            request.post(url, {
                form: body
            }, (err, resStr) => {
                resStr.body = resStr.body.replace(/&quot;/g, '"');
                console.log(err, resStr.body);
                let res = JSON.parse(resStr.body);
                if (!err && res.ok === true) {
                    resolve(res);
                }
                reject(res);
            });
        });
    }
    registerRoutes(app) {
        let limit = this.config.limitTo;
        if (this.config.commands) {
            app.use(this.config.commands.endpoint, (req, res, next) => {
                if (req.body) {
                    if ((limit && limit.channel === req.body['channel_id']) || !limit) {
                        this.commands.emit(req.body.command, req.body, SlackAPI.responseFactory(res));
                    }
                }
                next();
            });
        }
        if (this.config.actions) {
            app.use(this.config.actions.endpoint, (req, res, next) => {
                if (req.body) {
                    let payload = JSON.parse(req.body.payload);
                    if ((limit && limit.channel === payload.channel.id) || !limit) {
                        this.actions.emit(payload.callback_id, payload, SlackAPI.responseFactory(res));
                    }
                }
                next();
            });
        }
        app.use('/slack', (req, res, next) => {
            let havePayload = !!req.body.payload;
            if (req.body.token === this.config.verificationToken) {
                next();
            }
            else if (havePayload && JSON.parse(req.body.payload).token === this.config.verificationToken) {
                next();
            }
            else {
                res.status(403);
                res.send('Slack API token mismatch!');
            }
        });
    }
}
exports.SlackAPI = SlackAPI;
