export interface SlackAPIConfig {
	verificationToken: string;
	authToken: string;
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

export interface ActionReq {
	actions: any;
	callback_id: string;
	channel: {
		id: string;
		domain: string;
	};
	user: {
		id: string;
		name: string;
	};
	action_ts: string;
	message_ts: string;
	attachment_id: string;
	token: string;
	is_app_unfurl: boolean;
	original_message: SlackMessage;
	response_url: string;
}

export interface SlackMessage {
	response_type?: 'in_channel' | 'ephemeral';
	text?: string;
	attachments?: {
		title?: string;
		fallback: string;
		callback_id: string;
		color?: string;
		actions?: {
			name: string;
			text: string;
			type: string;
			value?: string;
			confirm?: any;
			style?: 'default' | 'primary' | 'danger';
			options?: {
				text: string;
				value: string;
			}[];
			option_groups?: string;
			data_source?: string;
			selected_options?: any[];
			min_query_length?: number;
		}[];
		fields?: {
			title: string;
			value: string;
			short: boolean;
		}[]
		attachment_type?: string;
	}[];
	channel?: string;
	thread_ts?: string;
}

export interface MessageResponse {
	ok: boolean;
	ts: string;
	channel: string;
	message: any;
}

export type SlashCommandResponseSender = (msg: SlackMessage) => void;

export interface SendMessageOptions {
	responseUrl: string;
}
