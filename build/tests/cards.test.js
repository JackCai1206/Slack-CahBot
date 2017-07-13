"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cards_1 = require("../game/cards");
let cards = new cards_1.Cards();
console.log(cards.cleanText('You have my sword. &quot;And you have my bow.&quot; &quot;And <i>my</i> _______!&quot;'));
