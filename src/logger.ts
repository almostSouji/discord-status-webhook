import { createLogger, transports, format, addColors } from 'winston';

const loggerLevels = {
	levels: {
		error: 0,
		debug: 1,
		warn: 2,
		info: 3,
		cleanup: 4,
	},
	colors: {
		error: 'red',
		debug: 'blue',
		warn: 'yellow',
		info: 'green',
		cleanup: 'white',
	},
};

addColors(loggerLevels.colors);

export const logger = createLogger({
	levels: loggerLevels.levels,
	format: format.combine(
		format.colorize({ level: true }),
		format.errors({ stack: true }),
		format.splat(),
		format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
		format.printf((data: any) => {
			const { timestamp, level, message, ...rest } = data;
			return `[${timestamp as string}][${level as string}]: ${message as string}${
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
				rest instanceof Error ? rest : Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''
			}`;
		}),
	),
	transports: new transports.Console(),
	level: 'cleanup',
});
