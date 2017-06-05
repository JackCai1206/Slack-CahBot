"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
class Router {
    constructor() {
        this.router = express.Router();
        this.routes();
    }
    routes() {
        this.router.post('/slack/events', (req, res, next) => {
            if (req.body) {
                console.log(req.body);
                let ch = req.body.challenge;
                res.type('text/plain');
                res.send(ch);
            }
        });
    }
}
exports.Router = Router;
