"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var SlackAPI = (function () {
    function SlackAPI(config) {
        this.commands = new events_1.EventEmitter();
        this.actions = new events_1.EventEmitter();
        this.config = config;
    }
    SlackAPI.responseFactory = function (res) {
        return function (msg) {
            res.json(JSON.stringify(msg));
        };
    };
    SlackAPI.prototype.sendMessage = function () {
    };
    SlackAPI.prototype.registerRoutes = function (app) {
        var _this = this;
        if (this.config.commands) {
            app.use(this.config.commands.endpoint, function (req, res, next) {
                if (req.body) {
                    console.log(req.body);
                    _this.commands.emit(req.body.command, SlackAPI.responseFactory(res));
                }
            });
        }
        if (this.config.actions) {
            app.use(this.config.actions.endpoint, function (req, res, next) {
                if (req.body) {
                }
            });
        }
    };
    return SlackAPI;
}());
exports.SlackAPI = SlackAPI;
