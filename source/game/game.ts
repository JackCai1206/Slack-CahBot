import { UserData } from '../interfaces/user.interface';
import { GameOptions } from '../interfaces/game.interface';
import { BlackCard, WhiteCard } from '../interfaces/cards.interface';
import { MessageResponse, ActionReq } from '../interfaces/slack_api.interface';
import { User } from './user';
import { SlackAPI } from './slack_api';
import { Cards } from './cards';

export class Game {
	invitedUsers: User[] = [];
	confirmedUsers: User[] = [];
	gameSize: number;
	expansions;

	channelId: string;
	threadId: string;

	cards: Cards;
	blackCard: BlackCard;
	cardsPicked: {[userId: string]: WhiteCard[]} = {};

	constructor(private slackAPI: SlackAPI, options: GameOptions) {
		this.confirmedUsers = [];
		this.invitedUsers = options.participants;
		this.threadId = options.threadId;
		this.channelId = options.channelId;
		this.gameSize = options.openGame || options.participants.length;
		this.cards = new Cards();

		let addNewRound = () => {
			confirmPromise = confirmPromise
			.then(() => this.newRound())
			.then(() => this.pickCards())
			.then(() => this.collectCards())
			.then(() => this.endCollectCards())
			.then(() => this.examineCards())
			.then(() => this.promptContinue())
			.then(() => this.continueOrEnd())
			.then(() => addNewRound())
			.catch(() => this.slackAPI.commands.emit('/cah-stop', { channel_id: this.channelId }))
		}

		let confirmPromise = this.gameConfirm()
		.then((res) => this.endGameConfirm(res))
		.then(() => addNewRound())
		.catch(() => this.slackAPI.commands.emit('/cah-stop', { channel_id: this.channelId }))
	}

	isInvited(id: string): boolean {
		return this.invitedUsers.length === 0 ? true
			: !!this.invitedUsers.find((invitedUser) => {
				return invitedUser.data.id === id;
			})
	}

	gameConfirm(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.slackAPI.sendMessage({
				channel: this.channelId,
				text: 'You have been invited to play a game of Cards Against Humanity',
				thread_ts: this.threadId,
				attachments: [
					{
						title: 'Please confirm this request.',
						attachment_type: 'default',
						fallback: 'You are unable to confirm the game.',
						callback_id: 'game_confirm',
						actions: [
							{
								name: 'confirm',
								text: 'Yes',
								type: 'button',
								value: 'yes',
								style: 'primary'
							},
							{
								name: 'confirm',
								text: 'No',
								type: 'button',
								value: 'no'
							}
						]
					}
				]
			}).then((res: MessageResponse) => {
				let confirmTimeout = setTimeout(() => {
					console.log('confirmation closed');
					if (this.confirmedUsers.length === 0) {
						reject();
					}
					resolve(res);
				}, 10000);
				this.slackAPI.actions.on('game_confirm', (payload: ActionReq, sendMsg) => {
					console.log(payload.actions);

					if (this.isInvited(payload.user.id) && payload.actions[0].value === 'yes') {
						this.confirmedUsers.push(new User(payload.user, {
							isJudge: this.confirmedUsers.length > 0 ? false : true
						}));

						sendMsg({
							response_type: 'ephemeral',
							channel: this.channelId,
							text: 'Waiting on ' + (this.gameSize - this.confirmedUsers.length) + ' other users. ('
								+ this.confirmedUsers.length + '/' + this.gameSize + ')',
							thread_ts: this.threadId,
							attachments: [
								{
									title: this.confirmedUsers.map(user => '@' + user.data.name).join(', ') + ' accepted the request.',
									attachment_type: 'default',
									fallback: 'This message cannot be displayed.'
								}
							]
						});

						if (this.confirmedUsers.length === this.gameSize) {
							clearTimeout(confirmTimeout);
							resolve(res);
						}

					} else if (this.isInvited(payload.user.id) && payload.actions[0].value === 'no') {
						sendMsg({
							response_type: 'ephemeral',
							text: 'Rip.'
						});
					} else {
						sendMsg({
							response_type: 'ephemeral',
							text: 'You are not invited to the game.'
						});
					}
				});
			}).catch(err => {
				reject(err);
			});
		});
	}

	endGameConfirm(res: MessageResponse): Promise<any> {
		console.log('end gameconfirm');
		this.slackAPI.actions.removeAllListeners('game_confirm').addListener('game_confirm', (payload, sendMsg) => {
			sendMsg({
				response_type: 'ephemeral',
				text: 'You are either not invited or that the 10 sencond limit was exceeded.'
			})
		});
		return this.slackAPI.sendMessage({
			channel: this.channelId,
			text: 'Confirmation closed.',
			thread_ts: res.ts
		});
	}

	newRound(): Promise<any> {
		this.blackCard = this.cards.randomBlack();
		return this.slackAPI.sendMessage({
			channel: this.channelId,
			text: 'Press button to recieve cards',
			thread_ts: this.threadId,
			attachments: [
				{
					title: this.blackCard.text,
					attachment_type: 'default',
					fallback: 'Message is unable to display.',
					callback_id: 'card_request',
					actions: [
						{
							name: 'cards',
							text: 'Your hand',
							type: 'button',
							value: ''
						}
					]
				}
			]
		})
	}

	pickCards(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.slackAPI.actions.on('card_request', (payload: ActionReq, sendMsg) => {
				let targetUser = <User> this.confirmedUsers.find((user) => {
					return user.data.id === payload.user.id;
				})
				if (!targetUser) { reject(); }
				targetUser.whiteCards = targetUser.whiteCards.concat(
					new Array(4 - targetUser.whiteCards.length).fill(0).map(v => this.cards.randomWhite(payload.user.id))
				);
				sendMsg();
				// temporary disable judge check
				this.slackAPI.sendMessage(targetUser.isJudge ? {
					response_type: 'ephemeral',
					text: Object.keys(this.cardsPicked).length + ' / ' + (this.confirmedUsers.length - 1) + ' submitted.',
					attachments: [
						{
							title: this.blackCard.text,
							fallback: 'You can\'t pick a card.',
							callback_id: 'card_pick',
							fields: targetUser.whiteCards.map((card, index) => {
								return {
									title: (index + 1).toString(),
									value: targetUser.whiteCards[index].text,
									short: true
								}
							}),
							actions: new Array(this.blackCard.pick).fill(0).map((v, i) => {
								return {
									name: 'card_menu_' + i,
									text: 'Pick a card',
									type: 'select',
									options: targetUser.whiteCards.map((card, index) => {
										return {
											text: targetUser.whiteCards[index].text,
											value: index.toString()
										}
									})
								}
							})
						}
					]
				} : {
					response_type: 'ephemeral',
					text: Object.keys(this.cardsPicked).length + ' / ' + this.confirmedUsers.length + ' submitted.',
					attachments: [
						{
							title: this.blackCard.text,
							fallback: 'You can\'t pick a card.',
							callback_id: 'card_pick',
							fields: [
								{
									title: 'You are the judge.',
									value: 'Please wait until the cards are submitted.',
									short: false
								}
							]
						}
					]
				}, {
					responseUrl: payload.response_url
				})
				.then(() => {
					resolve()
				})
				.catch(reject)
			});
		});
	}

	collectCards(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.slackAPI.actions.on('card_pick', (payload: ActionReq, sendMsg) => {
				let targetUser = <User> this.confirmedUsers.find((user) => {
					return user.data.id === payload.user.id;
				});
				this.cardsPicked[payload.user.id] = [];
				for (let i = 0; i < payload.actions.length; i++) {
					this.cardsPicked[payload.user.id].push(targetUser.whiteCards[parseInt(payload.actions[i].selected_options[0].value, 10)]);
					targetUser.whiteCards.splice(parseInt(payload.actions[i], 10), 1);
				}
				sendMsg({
					response_type: 'ephemeral',
					text: Object.keys(this.cardsPicked).length + ' / ' + this.confirmedUsers.length + ' players submitted their response.',
					attachments: [
						{
							title: this.blackCard.text,
							fallback: 'You can\'t pick a card.',
							callback_id: 'card_pick',
							fields: this.cardsPicked[payload.user.id].map((card, index) => {
								return {
									title: 'Your choice ' + (index + 1),
									value: card.text,
									short: true
								}
							})
						}
					]
				});
				if (Object.keys(this.cardsPicked).length === this.confirmedUsers.length &&
					Object.keys(this.cardsPicked).map(userId => {
						return this.cardsPicked[userId].length === this.blackCard.pick;
					}).reduce((pre, cur) => pre && cur)) {
					resolve();
				}
			});
		})
	}

	endCollectCards(): Promise<any> {
		this.slackAPI.actions.removeAllListeners('card_request');
		this.slackAPI.actions.removeAllListeners('card_pick');

		let judge = <User> this.confirmedUsers.find(u => u.isJudge);
		return this.slackAPI.sendMessage({
			channel: this.channelId,
			thread_ts: this.threadId,
			text: '@' + judge.data.name + ' is the judge! Pick the most funny combination from below.',
			attachments: [
				{
					title: this.blackCard.text,
					attachment_type: 'default',
					fallback: 'You are unable to pick a card.',
					callback_id: 'judge_pick',
					fields: Object.keys(this.cardsPicked).map((userId, index) => {
						return {
							title: (index + 1).toString(),
							value: this.cardsPicked[userId].map(c => c.text).reduce((pre, cur) => pre + '\n' + cur),
							short: true
						}
					}),
					actions: [{
						name: 'judge_menu',
						text: 'Pick a card',
						type: 'select',
						options: Object.keys(this.cardsPicked).map((userId, index) => {
							let user = <User> this.confirmedUsers.find(u => u.data.id === userId);
							return {
								text: this.cardsPicked[userId].map(c => c.text).reduce((pre, cur) => pre + '\n' + cur),
								value: user.data.id
							}
						})
					}]
				}
			]
		});
	}

	examineCards(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.slackAPI.actions.on('judge_pick', (payload: ActionReq, sendMsg) => {
				let userId = payload.actions[0].selected_options[0].value;
				let user = <User> this.confirmedUsers.find(u => u.data.id === userId);
				user.awesomePts += 1;
				sendMsg({
					text: '@' + user.data.name + ' won!',
					channel: this.channelId,
					thread_ts: this.threadId,
					attachments: [
						{
							title: 'Awesome points count:',
							attachment_type: 'default',
							fallback: 'Awsome points unable to display.',
							callback_id: 'awsome_points',
							fields: this.confirmedUsers.map(u => {
								return {
									title: '@' + u.data.name,
									value: u.awesomePts + ' Pts',
									short: true
								}
							})
						}
					]
				})
				resolve();
			});
		})
	}

	promptContinue(): Promise<any> {
		this.slackAPI.actions.removeAllListeners('judge_pick');
		return this.slackAPI.sendMessage({
			channel: this.channelId,
			thread_ts: this.threadId,
			attachments: [
				{
					title: 'Continue for another round?',
					attachment_type: 'default',
					fallback: 'Confirm unable to display.',
					callback_id: 'continue_confirm',
					actions: [
						{
							name: 'confirm',
							text: 'Yes',
							type: 'button',
							value: 'yes',
							style: 'primary'
						},
						{
							name: 'confirm',
							text: 'No',
							type: 'button',
							value: 'no'
						}
					]
				}
			]
		});
	}

	continueOrEnd(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.slackAPI.actions.on('continue_confirm', (payload: ActionReq, sendMsg) => {
				sendMsg();
				if (payload.actions[0].value === 'yes') {
					resolve();
				} else {
					reject();
				}
			});
		});
	}

	destroy(): Promise<any> {
		this.slackAPI.actions.removeAllListeners();
		return this.slackAPI.sendMessage({
			channel: this.channelId,
			thread_ts: this.threadId,
			text: 'Game in current channel ended.'
		})
	}
}
