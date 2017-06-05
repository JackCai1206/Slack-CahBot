"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise-native");
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
    sendMessage(msg) {
        let body = Object.assign({ token: this.config.authToken }, msg);
        return request.post('https://slack.com/api/chat.postMessage', {
            form: Object.assign({ token: this.config.authToken }, msg)
        });
    }
    registerRoutes(app) {
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
exports.SlackAPI = SlackAPI;
