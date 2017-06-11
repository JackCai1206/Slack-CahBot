import { CardsData, BlackCard, WhiteCard } from '../interfaces/cards.interface';

export class Cards {
	cardsData: CardsData;

	constructor () {
		this.cardsData = require('../../cards-data.json');
	}

	cleanText(txt): string {
		return txt.replace(/<small>(.*?)<\/small>/, '').replace(/<b>/, '').replace(/<br\/>/, '').replace(/<\/b>/, '');
	}

	randomBlack(): BlackCard {
		let index = Math.floor(Math.random() * this.cardsData.blackCards.length);
		let card = this.cardsData.blackCards[index];
		card.text = this.cleanText(card.text);
		return Object.assign({ index }, card);
	}

	randomWhite(): WhiteCard {
		let index = Math.floor(Math.random() * this.cardsData.whiteCards.length);
		let text = this.cardsData.whiteCards[index];
		text = this.cleanText(text);
		return Object.assign({ index }, { text });
	}

	combineCards(bCard: BlackCard, wCard: WhiteCard): string {
		return '';
	}
}
