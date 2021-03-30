export interface StatusPageResult {
	page: StatusPagePageInformation;
	incidents: StatusPageIncident[];
}

export interface StatusPagePageInformation {
	id: string;
	name: string;
	url: string;
	time_zone: string;
	updated_at: string;
}

export interface StatusPageIncident {
	id: string;
	name: string;
	status: StatusPageIncidentStatus;
	created_at: string;
	updated_at: string | null;
	monitoring_at: string | null;
	resolved_at: string | null;
	impact: StatusPageIncidentImpact;
	shortlink: string;
	started_at: string;
	page_id: string;
	incident_updates: StatusPageIncidentUpdate[];
	components: StatusPageComponent[];
}

export interface StatusPageIncidentUpdate {
	id: string;
	status: string;
	body: string;
	incident_id: string;
	created_at: string;
	update_at: string;
	display_at: string;
	affected_components: StatusPageComponentUpdate[];
	deliver_notifications: boolean;
	custom_tweet: string | null;
	tweet_id: string | null;
}

export type StatusPageIncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem';
export type StatusPageIncidentImpact = 'none' | 'minor' | 'major' | 'critical';

export interface StatusPageComponent {
	id: string;
	name: string;
	status: string;
	created_at: string;
	updated_at: string;
	position: number;
	description: string;
	showcase: boolean;
	start_date: string | null;
	group_id: string | null;
	page_id: string;
	group: boolean;
	only_show_if_degraded: boolean;
}

export interface StatusPageComponentUpdate {
	code: string;
	name: string;
	old_status: string;
	new_status: string;
}
