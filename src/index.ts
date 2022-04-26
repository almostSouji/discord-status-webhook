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
	API_BASE,
} from './constants';
import { logger } from './logger';
const incidentData: Keyv<DataEntry> = new Keyv(`sqlite://./data/data.sqlite`);

interface DataEntry {
	messageID: string;
	incidentID: string;
	lastUpdate: string;
	resolved: boolean;
}

const hook = new WebhookClient(process.env.DISCORD_WEBHOOK_ID!, process.env.DISCORD_WEBHOOK_TOKEN!);
logger.info(`Starting with ${hook.id}`);

function embedFromIncident(incident: StatusPageIncident): MessageEmbed {
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

	const affectedNames = incident.components.map((c) => c.name);

	const embed = new MessageEmbed()
		.setColor(color)
		.setTimestamp(new Date(incident.started_at))
		.setURL(incident.shortlink)
		.setTitle(incident.name)
		.setFooter(incident.id);

	for (const update of incident.incident_updates.reverse()) {
		const updateDT = DateTime.fromISO(update.created_at);
		const timeString = `<t:${Math.floor(updateDT.toSeconds())}:R>`;
		embed.addField(`${update.status.charAt(0).toUpperCase()}${update.status.slice(1)} (${timeString})`, update.body);
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
		logger.debug(`setting: ${incident.id} to message: ${message.id}`);
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
	logger.info('heartbeat');
	try {
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

void check();
setInterval(() => void check(), 60_000 * 5);
