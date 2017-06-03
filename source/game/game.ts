import { UserData } from '../interfaces/user.interface';
import { User } from './user';
import { SlackAPI } from './slack_api';

export class Game {
	participants: UserData[] = [];
	gameSize: number;
	expansions;

	threadId: string;

	constructor(slackAPI: SlackAPI) {
		slackAPI.commands.on('request-hand', () => {})
	}

	addUser(user: UserData) {

	}
}
