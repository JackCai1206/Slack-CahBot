"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cards_1 = require("../game/cards");
let cards = new cards_1.Cards();
console.log(cards.cleanText('<b>X-Rays</b><br/><small>X-Rays were discovered in 1895 by the German physicist Wilhelm Conrad Roentgen. Now if they could just get those X-ray glasses down.</small>'));
