"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var Router = (function () {
    function Router() {
        this.router = express.Router();
        this.routes();
    }
    Router.prototype.routes = function () {
        this.router.post('/events', function (req, res, next) {
            if (req.body) {
                console.log(req.body);
            }
            console.log('pls');
            res.json({});
        });
    };
    return Router;
}());
exports.Router = Router;
