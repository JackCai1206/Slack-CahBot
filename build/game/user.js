"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(data, opt) {
        this.isJudge = false;
        this.whiteCards = [];
        this.data = data;
        this.isJudge = opt.isJudge;
    }
}
exports.User = User;
