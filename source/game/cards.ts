import { CardsData, BlackCard, WhiteCard } from '../interfaces/cards.interface';

export class Cards {
	cardsData: CardsData;

	constructor () {
		this.cardsData = require('../../cards-data.json');
		// this.cardsData = {
		// 	blackCards: [{
		// 		text: '',
		// 		pick: 3
		// 	}],
		// 	whiteCards: ['1', '2', '3', '4']
		// }
	}

	cleanText(txt): string {
		return txt
			.replace(/<small>(.*?)<\/small>/, '')
			.replace(/<b>/, '')
			.replace(/<br\/>/, '')
			.replace(/<\/b>/, '')
			.replace(/(_){1}(?!_)/, '_______');
	}

	randomBlack(): BlackCard {
		let index = Math.floor(Math.random() * this.cardsData.blackCards.length);
		let card = this.cardsData.blackCards[index];
		card.text = this.cleanText(card.text);
		return Object.assign({ index }, card);
	}

	randomWhite(ownerId): WhiteCard {
		let index = Math.floor(Math.random() * this.cardsData.whiteCards.length);
		let text = this.cardsData.whiteCards[index];
		text = this.cleanText(text);
		return { index, text, ownerId };
	}

	combineCards(bCard: BlackCard, wCard: WhiteCard): string {
		return '';
	}
}
