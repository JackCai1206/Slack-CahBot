"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var express = require("express");
var logger = require("morgan");
var config = require('../config.json');
var slack_api_1 = require("./game/slack_api");
var game_1 = require("./game/game");
var routes_1 = require("./routes");
var App = (function () {
    function App() {
        this.express = express();
        this.middleware();
        this.routes();
        var slackAPI = new slack_api_1.SlackAPI({
            commands: {
                endpoint: '/slack/commands'
            },
            actions: {
                endpoint: '/slack/actions'
            }
        });
        slackAPI.commands.on('/start', function (sendMsg) {
            sendMsg({
                response_type: 'in_channel',
                text: 'started'
            });
            var game = new game_1.Game(slackAPI);
        });
        slackAPI.registerRoutes(this.express);
    }
    // Configure Express middleware.
    App.prototype.middleware = function () {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use('/slack', function (req, res, next) {
            if (req.body.token === config.slackToken) {
                next();
            }
            else {
                next('Slack API token mismatch!');
            }
        });
    };
    // Configure API endpoints.
    App.prototype.routes = function () {
        var router = new routes_1.Router().router;
        this.express.use('/', router);
    };
    return App;
}());
exports.default = new App().express;
