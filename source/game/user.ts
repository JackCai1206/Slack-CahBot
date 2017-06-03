import { UserData } from '../interfaces/user.interface';

export class User {
	data: UserData;
	isJudge = false;

	constructor(data: UserData) {
		this.data = data;
	}
}
