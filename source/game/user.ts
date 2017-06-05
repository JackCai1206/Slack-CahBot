import { UserData, UserOptions } from '../interfaces/user.interface';

export class User {
	data: UserData;
	isJudge = false;

	constructor(data: UserData, opt: UserOptions) {
		this.data = data;
		this.isJudge = opt.isJudge;
	}
}
