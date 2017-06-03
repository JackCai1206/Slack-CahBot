"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Game = (function () {
    function Game(slackAPI) {
        this.participants = [];
        slackAPI.commands.on('request-hand', function () { });
    }
    Game.prototype.addUser = function (user) {
    };
    return Game;
}());
exports.Game = Game;
