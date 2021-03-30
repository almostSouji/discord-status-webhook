import { WebhookClient, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import { StatusPageIncident, StatusPageResult } from './interfaces/StatusPage';
import { DateTime } from 'luxon';
import Keyv from 'keyv';
import {
	EMBED_COLOR_GREEN,
	EMBED_COLOR_RED,
	EMBED_COLOR_ORANGE,
	EMBED_COLOR_YELLOW,
	EMBED_COLOR_BLACK,
	AVATAR_GREEN,
	AVATAR_RED,
	AVATAR_ORANGE,
	AVATAR_YELLOW,
	AVATAR_BLACK,
	API_BASE,
} from './constants';
import { logger } from './logger';
const incidentData: Keyv<DataEntry> = new Keyv(`sqlite://./data.sqlite`);

interface DataEntry {
	messageID: string;
	incidentID: string;
	lastUpdate: string;
	resolved: boolean;
}

const hook = new WebhookClient(process.env.DISCORD_WEBHOOK_ID!, process.env.DISCORD_WEBHOOK_TOKEN!);
logger.info(`Starting with ${hook.id}`);

function embedFromIncident(incident: StatusPageIncident): MessageEmbed {
	const incidentDT = DateTime.fromISO(incident.started_at);
	const color =
		incident.status === 'resolved' || incident.status === 'postmortem'
			? EMBED_COLOR_GREEN
			: incident.impact === 'critical'
			? EMBED_COLOR_RED
			: incident.impact === 'major'
			? EMBED_COLOR_ORANGE
			: incident.impact === 'minor'
			? EMBED_COLOR_YELLOW
			: EMBED_COLOR_BLACK;

	const avatar =
		incident.status === 'resolved' || incident.status === 'postmortem'
			? AVATAR_GREEN
			: incident.impact === 'critical'
			? AVATAR_RED
			: incident.impact === 'major'
			? AVATAR_ORANGE
			: incident.impact === 'minor'
			? AVATAR_YELLOW
			: AVATAR_BLACK;

	const affectedNames = incident.components.map((c) => c.name);

	const embed = new MessageEmbed()
		.setColor(color)
		.setTimestamp(new Date(incident.started_at))
		.setFooter('started at')
		.setAuthor(incident.name, avatar, incident.shortlink);

	for (const update of incident.incident_updates.reverse()) {
		const updateDT = DateTime.fromISO(update.created_at);
		const timeString = updateDT.hasSame(incidentDT, 'day')
			? updateDT.toUTC().toFormat('HH:mm ZZZZ')
			: updateDT.toUTC().toFormat('yyyy/LL/dd HH:mm ZZZZ');
		embed.addField(`${update.status} (${timeString})`, update.body);
	}

	const descriptionParts = [`• Impact: ${incident.impact}`];

	if (affectedNames.length) {
		descriptionParts.push(`• Affected Components: ${affectedNames.join(', ')}`);
	}

	embed.setDescription(descriptionParts.join('\n'));

	return embed;
}

async function updateIncident(incident: StatusPageIncident, messageID?: string) {
	const embed = embedFromIncident(incident);
	try {
		const message = await (messageID ? hook.editMessage(messageID, embed) : hook.send(embed));
		await incidentData.set(incident.id, {
			incidentID: incident.id,
			lastUpdate: DateTime.now().toISO(),
			messageID: message.id,
			resolved: incident.status === 'resolved' || incident.status === 'postmortem',
		});
	} catch (error) {
		if (messageID) {
			logger.error(`error during hook update on incident ${incident.id} message: ${messageID}\n`, error);
			return;
		}
		logger.error(`error during hook sending on incident ${incident.id}\n`, error);
	}
}

async function check() {
	try {
		logger.info('fetching incident reports');
		const json = (await fetch(`${API_BASE}/incidents.json`).then((r) => r.json())) as StatusPageResult;
		const { incidents } = json;

		for (const incident of incidents.reverse()) {
			const data = await incidentData.get(incident.id);
			if (!data) {
				logger.info(`new incident: ${incident.id}`);
				void updateIncident(incident);
				continue;
			}

			const incidentUpdate = DateTime.fromISO(incident.updated_at ?? incident.created_at);
			if (DateTime.fromISO(data.lastUpdate) < incidentUpdate) {
				logger.info(`update incident: ${incident.id}`);
				void updateIncident(incident, data.messageID);
			}
		}
	} catch (error) {
		logger.error(`error during fetch and update routine:\n`, error);
	}
}

logger.info(`starting interval`);
setInterval(() => void check(), 60_000 * 5);
