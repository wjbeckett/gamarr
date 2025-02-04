const winston = require('winston');
const { format } = winston;

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, ...metadata }) => {
                    let msg = `${timestamp} [${level}]: ${message}`;
                    if (Object.keys(metadata).length > 0) {
                        msg += JSON.stringify(metadata);
                    }
                    return msg;
                })
            )
        })
    ]
});

module.exports = logger;