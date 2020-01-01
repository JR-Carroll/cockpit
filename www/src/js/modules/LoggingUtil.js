import {LOGLEVELS} from './CockpitConstants.js';

var DEBUG = true;
var INFO = true;
var WARN = true;
var ERROR = true;

export function LOG(msg, logLevel, ...args) {
	
	switch (logLevel) {
		case LOGLEVELS.DEBUG:
			if (DEBUG) {
				console.debug("DEBUG -> ", msg);
			}
			break;
		case LOGLEVELS.WARN:
			if (WARN) {
				console.warn("WARN -> ", msg);
			}
			break;
		case LOGLEVELS.INFO:
			if (INFO) {
				console.info("INFO -> ", msg);
			}
			break;
		case LOGLEVELS.ERROR:
			if (ERROR) {
				console.error("ERROR -> ", msg);	
			}
			break;
		default:
			console.log(msg);
			break;
	}
}