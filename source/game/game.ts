import { UserData } from '../interfaces/user.interface';
import { GameOptions } from '../interfaces/game.interface';
import { User } from './user';
import { SlackAPI } from './slack_api';

export class Game {
	botId: string;
	participants: User[] = [];
	gameSize: number;
	expansions;

	channelId: string;
	threadId: string;

	constructor(slackAPI: SlackAPI, options: GameOptions) {
		this.participants = options.participants;
		this.threadId = options.threadId;
		this.channelId = options.channelId;
		slackAPI.commands.on('request-hand', () => {});
	}

	addUser(user: UserData) {

	}
}
