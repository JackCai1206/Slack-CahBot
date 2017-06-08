"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("./user");
class Game {
    constructor(slackAPI, options) {
        this.slackAPI = slackAPI;
        this.invitedUsers = [];
        this.confirmedUsers = [];
        this.confirmedUsers = [];
        this.invitedUsers = options.participants;
        this.threadId = options.threadId;
        this.channelId = options.channelId;
        this.gameSize = options.openGame || options.participants.length;
        slackAPI.sendMessage({
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
        }).then(res => {
        }).catch(err => {
            console.error(err);
        });
        slackAPI.actions.on('game_confirm', (payload, sendMsg) => {
            console.log(this.confirmedUsers);
            if (this.isInvited(payload.user.id)) {
                this.confirmedUsers.push(new user_1.User(payload.user, {
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
            }
            else {
                sendMsg({});
            }
        });
    }
    isInvited(id) {
        return this.invitedUsers.length === 0 ? true
            : !!this.invitedUsers.find((invitedUser) => {
                return invitedUser.data.id === id;
            });
    }
    addUser(user) {
    }
    destroy() {
        this.slackAPI.actions.removeAllListeners();
    }
}
exports.Game = Game;
