import { User } from '../game/user';

export interface GameOptions {
	channelId: string;
	threadId: string;
	participants: User[];
	openGame: number | undefined;
}
