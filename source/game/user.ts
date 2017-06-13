import { UserData, UserOptions } from '../interfaces/user.interface';
import { WhiteCard } from '../interfaces/cards.interface';

export class User {
	data: UserData;
	isJudge = false;
	whiteCards: WhiteCard[] = [];

	constructor(data: UserData, opt: UserOptions) {
		this.data = data;
		this.isJudge = opt.isJudge;
	}
}
