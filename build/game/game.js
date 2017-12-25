"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("./user");
const cards_1 = require("./cards");
class Game {
    constructor(slackAPI, options) {
        this.slackAPI = slackAPI;
        this.invitedUsers = [];
        this.confirmedUsers = [];
        this.roundCount = 0;
        this.cardsPicked = {};
        this.confirmedUsers = [];
        this.invitedUsers = options.participants;
        this.threadId = options.threadId;
        this.channelId = options.channelId;
        this.gameSize = options.openGame || options.participants.length;
        this.cards = new cards_1.Cards();
        let addNewRound = () => {
            this.roundCount++;
            confirmPromise = confirmPromise
                .then(() => this.newRound())
                .then(() => this.pickCards())
                .then(() => this.collectCards())
                .then(() => this.endCollectCards())
                .then(() => this.examineCards())
                .then(() => this.promptContinue())
                .then(() => this.continueOrEnd())
                .then(() => addNewRound())
                .catch((e) => {
                console.log(e);
                this.slackAPI.commands.emit('/cah-stop', { channel_id: this.channelId });
            });
        };
        let confirmPromise = this.gameConfirm()
            .then((res) => this.endGameConfirm(res))
            .then(() => addNewRound())
            .catch(() => this.slackAPI.commands.emit('/cah-stop', { channel_id: this.channelId }));
    }
    isInvited(id) {
        return this.invitedUsers.length === 0 ? true
            : !!this.invitedUsers.find((invitedUser) => {
                return invitedUser.data.id === id;
            });
    }
    gameConfirm() {
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
            }).then((res) => {
                let confirmTimeout = setTimeout(() => {
                    console.log('confirmation closed');
                    if (this.confirmedUsers.length <= 1) {
                        reject();
                    }
                    resolve(res);
                }, 30000);
                let judgeNum = Math.ceil(Math.random() * this.invitedUsers.length);
                this.slackAPI.actions.on('game_confirm', (payload, sendMsg) => {
                    let isInvited = this.isInvited(payload.user.id);
                    let isDown = payload.actions[0].value === 'yes';
                    let isConfirmed = this.confirmedUsers.find(u => u.data.id === payload.user.id);
                    if (isInvited && isDown && !isConfirmed) {
                        this.confirmedUsers.push(new user_1.User(payload.user, {
                            isJudge: this.confirmedUsers.length === judgeNum ? true : false
                        }));
                        sendMsg({
                            channel: this.channelId,
                            text: 'Waiting on ' + (this.gameSize - this.confirmedUsers.length) + ' other users. ('
                                + this.confirmedUsers.length + '/' + this.gameSize + ')',
                            thread_ts: this.threadId,
                            attachments: [
                                {
                                    title: this.confirmedUsers.map(user => '@' + user.data.name).join(', ') + ' accepted the request.',
                                    attachment_type: 'default',
                                    fallback: 'This message cannot be displayed.'
                                },
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
                        });
                        if (this.confirmedUsers.length === this.gameSize) {
                            clearTimeout(confirmTimeout);
                            resolve(res);
                        }
                    }
                    else if (isInvited && !isDown && !isConfirmed) {
                        sendMsg({
                            response_type: 'ephemeral',
                            text: 'Rip.'
                        });
                    }
                    else if (isInvited && !isConfirmed) {
                        sendMsg({
                            response_type: 'ephemeral',
                            replace_original: false,
                            text: 'You have already confirmed.'
                        });
                    }
                    else if (!isInvited) {
                        sendMsg({
                            response_type: 'ephemeral',
                            replace_original: false,
                            text: 'You are not invited to the game.'
                        });
                    }
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    endGameConfirm(res) {
        console.log('end gameconfirm');
        this.slackAPI.actions.removeAllListeners('game_confirm').addListener('game_confirm', (payload, sendMsg) => {
            sendMsg({
                response_type: 'ephemeral',
                replace_original: false,
                text: 'You are either not invited or that the 30 sencond limit was exceeded.'
            });
        });
        return this.slackAPI.sendMessage({
            channel: this.channelId,
            text: 'Confirmation closed.',
            thread_ts: this.threadId,
            ts: res.ts,
            attachments: []
        }, { update: true });
    }
    newRound() {
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
        });
    }
    pickCards() {
        return new Promise((resolve, reject) => {
            this.slackAPI.actions.on('card_request', (payload, sendMsg) => {
                let targetUser = this.confirmedUsers.find((user) => {
                    return user.data.id === payload.user.id;
                });
                if (!targetUser) {
                    reject('user did not accept invitation.');
                }
                else {
                    targetUser.whiteCards = targetUser.whiteCards.concat(new Array(4 - targetUser.whiteCards.length).fill(0).map(v => this.cards.randomWhite(payload.user.id)));
                    sendMsg();
                    // temporary disable judge check
                    this.slackAPI.sendMessage(!targetUser.isJudge ? {
                        response_type: 'ephemeral',
                        replace_original: false,
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
                                    };
                                }),
                                actions: [{
                                        name: 'card_menu_0',
                                        text: 'Pick a card',
                                        type: 'select',
                                        options: targetUser.whiteCards.map((card, index) => {
                                            return {
                                                text: targetUser.whiteCards[index].text,
                                                value: index.toString()
                                            };
                                        })
                                    }]
                            }
                        ]
                    } : {
                        response_type: 'ephemeral',
                        replace_original: false,
                        text: Object.keys(this.cardsPicked).length + ' / ' + (this.confirmedUsers.length - 1) + ' submitted.',
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
                        // this.slackAPI.sendMessage({
                        // 	channel: this.channelId,
                        // 	thread_ts: this.threadId,
                        // 	text: Object.keys(this.cardsPicked).length + ' / ' + (this.confirmedUsers.length - 1) + ' submitted.'
                        // }).then(() => {
                        resolve();
                        // })
                    })
                        .catch(reject);
                }
            });
        });
    }
    collectCards() {
        this.cardsPicked = {};
        return new Promise((resolve, reject) => {
            this.slackAPI.actions.on('card_pick', (payload, sendMsg) => {
                let targetUser = this.confirmedUsers.find((user) => {
                    return user.data.id === payload.user.id;
                });
                this.cardsPicked[payload.user.id] = this.cardsPicked[payload.user.id] || [];
                for (let i = 0; i < payload.actions.length; i++) {
                    let pickNum = parseInt(payload.actions[i].selected_options[0].value, 10);
                    this.cardsPicked[payload.user.id].push(targetUser.whiteCards[pickNum]);
                    targetUser.whiteCards.splice(pickNum, 1);
                }
                sendMsg({
                    response_type: 'ephemeral',
                    text: Object.keys(this.cardsPicked).length + ' / ' + (this.confirmedUsers.length - 1) + ' players submitted their response.',
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
                                };
                            }),
                            actions: (() => {
                                let cardsPickedNum = this.cardsPicked[payload.user.id].length;
                                if (cardsPickedNum !== this.blackCard.pick) {
                                    return [{
                                            name: 'card_menu_' + cardsPickedNum,
                                            text: 'Pick a card',
                                            type: 'select',
                                            options: targetUser.whiteCards.map((card, index) => {
                                                return {
                                                    text: targetUser.whiteCards[index].text,
                                                    value: index.toString()
                                                };
                                            })
                                        }];
                                }
                            })()
                        }
                    ]
                });
                if (Object.keys(this.cardsPicked).length === (this.confirmedUsers.length - 1) &&
                    Object.keys(this.cardsPicked).map(userId => {
                        return this.cardsPicked[userId].length === this.blackCard.pick;
                    }).reduce((pre, cur) => pre && cur)) {
                    resolve();
                }
            });
        });
    }
    endCollectCards() {
        this.slackAPI.actions.removeAllListeners('card_request');
        this.slackAPI.actions.removeAllListeners('card_pick');
        console.log(this.confirmedUsers);
        let judge = this.confirmedUsers.find(u => u.isJudge);
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
                        };
                    }),
                    actions: [{
                            name: 'judge_menu',
                            text: 'Pick a card',
                            type: 'select',
                            options: Object.keys(this.cardsPicked).map((userId, index) => {
                                let user = this.confirmedUsers.find(u => u.data.id === userId);
                                return {
                                    text: this.cardsPicked[userId].map(c => c.text).reduce((pre, cur) => pre + '\n' + cur),
                                    value: user.data.id
                                };
                            })
                        }]
                }
            ]
        });
    }
    examineCards() {
        return new Promise((resolve, reject) => {
            this.slackAPI.actions.on('judge_pick', (payload, sendMsg) => {
                let picker = this.confirmedUsers.find(u => u.data.id === payload.user.id);
                if (picker.isJudge) {
                    let userId = payload.actions[0].selected_options[0].value;
                    let user = this.confirmedUsers.find(u => u.data.id === userId);
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
                                    };
                                })
                            }
                        ]
                    });
                    resolve();
                }
                else {
                    sendMsg({
                        response_type: 'ephemeral',
                        replace_original: false,
                        text: 'You are not the judge'
                    });
                }
            });
        });
    }
    promptContinue() {
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
    continueOrEnd() {
        return new Promise((resolve, reject) => {
            this.slackAPI.actions.on('continue_confirm', (payload, sendMsg) => {
                sendMsg();
                if (payload.actions[0].value === 'yes') {
                    resolve();
                }
                else {
                    reject();
                }
            });
        });
    }
    destroy() {
        this.slackAPI.actions.removeAllListeners();
        this.slackAPI.commands.removeAllListeners();
        return this.slackAPI.sendMessage({
            channel: this.channelId,
            text: 'Game in current channel ended.'
        });
    }
}
exports.Game = Game;
