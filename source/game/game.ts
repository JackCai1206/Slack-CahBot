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

		this.gameConfirm()
		.then((res) => this.endGameConfirm(res))
		.then(() => this.newRound())
		.then(() => this.recieveCards())
		.catch(console.log)

	}

	isInvited(id: string): boolean {
		return this.invitedUsers.length === 0 ? true
			: !!this.invitedUsers.find((invitedUser) => {
				return invitedUser.data.id === id;
			})
	}

	gameConfirm(): Promise<MessageResponse> {
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
				this.slackAPI.actions.on('game_confirm', (payload, sendMsg) => {

					let confirmTimeout = setTimeout(() => {
						resolve(res);
					}, 10000);

					if (this.isInvited(payload.user.id)) {
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

					} else {
						sendMsg({
							response_type: 'ephemeral',
							text: 'You are not invited to the game.'
						})
					}
				});
			}).catch(err => {
				reject(err);
			});
		});
	}

	endGameConfirm(res: MessageResponse): Promise<MessageResponse> {
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

	recieveCards(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.slackAPI.actions.on('card_request', (payload: ActionReq, sendMsg) => {
				let targetUser = <User> this.confirmedUsers.find((user) => {
					return user.data.id === payload.user.id;
				})
				if (!targetUser) { reject(); }
				targetUser.whiteCards = targetUser.whiteCards.concat(
					new Array(4 - targetUser.whiteCards.length).fill(0).map(v => this.cards.randomWhite(payload.user.id))
				);
				this.slackAPI.sendMessage({
					response_type: 'ephemeral',
					text: Object.keys(this.cardsPicked).length + ' / ' + this.confirmedUsers.length + ' submitted.',
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
				}, {
					responseUrl: payload.response_url
				})
				.then(() => {
					this.slackAPI.actions.on('card_pick', (_payload: ActionReq, _sendMsg) => {
						let _targetUser = <User> this.confirmedUsers.find((user) => {
							return user.data.id === _payload.user.id;
						});
						this.cardsPicked[_payload.user.id] = [];
						for (let i = 0; i < _payload.actions.length; i++) {
							this.cardsPicked[_payload.user.id].push(_targetUser.whiteCards[parseInt(_payload.actions[i].selected_options[0].value, 10)]);
							_targetUser.whiteCards.splice(parseInt(_payload.actions[i], 10), 1);
						}
						_sendMsg({
							response_type: 'ephemeral',
							text: Object.keys(this.cardsPicked).length + ' / ' + this.confirmedUsers.length + ' players submitted their response.',
							attachments: [
								{
									title: this.blackCard.text,
									fallback: 'You can\'t pick a card.',
									callback_id: 'card_pick',
									fields: this.cardsPicked[_payload.user.id].map((card, index) => {
										return {
											title: 'Your choice ' + (index + 1),
											value: card.text,
											short: true
										}
									})
								}
							]
						})
					});
					resolve()
				})
				.catch(reject)
			});
		})
	}

	destroy(): void {
		this.slackAPI.actions.removeAllListeners();
	}
}
