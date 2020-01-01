var $ = require('jquery');

export const LOGLEVELS = {DEBUG: "DEBUG",
                          INFO: "INFO",
                          WARN: "WARN",
                          ERROR: "ERROR"};

export const SERVICE_ROW_MENU = {RESTART: "(Re)Start Service",
                                 STOP: "Stop Service",
                                 DL_LOGS: "Download Service Logs"};

export const SERVICE_PAGE = $('#servicePage');
export const WEBSITE_PAGE = $('#websitePage');
export const DASHBOARD_PAGE = $('#dashboardPage');

export const PAGE_NAMES = {WEBSITE: 'websitePage',
                           SERVICE: 'servicePage',
                           DASHBOARD: 'dashboardPage'};

export const SERVICE_PROTOCOL = "http";
export const SERVICE_URL = "127.0.0.1:8000";
export const FULL_SERVICE_URL = `${SERVICE_PROTOCOL}://${SERVICE_URL}`;
export const SERVICE_DELAY_REQUEST_TIME_MS = 5000; // 5 seconds


