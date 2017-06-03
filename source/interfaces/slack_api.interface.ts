export interface SlackAPIConfig {
	events?: {};
	commands?: {
		endpoint: string;
	};
	actions?: {
		endpoint: string;
	}
}

export interface SlashCommandReq {
	token: string;
	team_id: string;
	team_domain: string;
	channel_id: string;
	channel_name: string;
	user_id: string;
	user_name: string;
	command: string;
	text: string;
	response_url: string;
}

export interface SlackMessage {
	response_type: 'in_channel' | 'ephemeral';
	text: string;
	attachments: {[key: string]: any}
}
