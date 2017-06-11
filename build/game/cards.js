"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cards {
    constructor() {
        this.cardsData = require('../../cards-data.json');
    }
    cleanText(txt) {
        return txt.replace(/<small>(.*?)<\/small>/, '').replace(/<b>/, '').replace(/<br\/>/, '').replace(/<\/b>/, '');
    }
    randomBlack() {
        let index = Math.floor(Math.random() * this.cardsData.blackCards.length);
        let card = this.cardsData.blackCards[index];
        card.text = this.cleanText(card.text);
        return Object.assign({ index }, card);
    }
    randomWhite() {
        let index = Math.floor(Math.random() * this.cardsData.whiteCards.length);
        let text = this.cardsData.whiteCards[index];
        text = this.cleanText(text);
        return Object.assign({ index }, { text });
    }
    combineCards(bCard, wCard) {
        return '';
    }
}
exports.Cards = Cards;
