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
	cardsPicked: WhiteCard[] = [];

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
				let whiteCards: WhiteCard[] = new Array(4).fill(0).map(v => this.cards.randomWhite());
				sendMsg({
					response_type: 'ephemeral',
					text: this.cardsPicked.length + ' / ' + this.confirmedUsers.length + ' submitted.',
					attachments: [
						{
							title: this.blackCard.text,
							fallback: 'You can\'t pick a card.',
							callback_id: 'card_pick',
							fields: [
								{
									title: '1',
									value: whiteCards[0].text,
									short: true
								},
								{
									title: '2',
									value: whiteCards[1].text,
									short: true
								},
								{
									title: '3',
									value: whiteCards[2].text,
									short: true
								},
								{
									title: '4',
									value: whiteCards[3].text,
									short: true
								}
							],
							actions: new Array(this.blackCard.pick).fill(0).map(v => {
								return {
									name: 'card_menu',
									text: 'Pick a card',
									type: 'select',
									options: [
										{
											text: whiteCards[0].text,
											value: '0'
										},
										{
											text: whiteCards[1].text,
											value: '1'
										},
										{
											text: whiteCards[2].text,
											value: '2'
										},
										{
											text: whiteCards[3].text,
											value: '3'
										},
									]
								}
							})
						}
					]
				})
				.then(resolve)
				.catch(reject)
			});
		})
	}

	destroy(): void {
		this.slackAPI.actions.removeAllListeners();
	}
}
