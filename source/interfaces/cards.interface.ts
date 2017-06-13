export interface CardsData {
	blackCards: {
		text: string;
		pick: number;
	}[];
	whiteCards: string[];
}

export interface BlackCard {
	index: number;
	text: string;
	pick: number;
}

export interface WhiteCard {
	index: number;
	text: string;
	ownerId: string;
}
