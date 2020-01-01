/** Cockpit Server: a nodeJS:express server designed to monitor server resources and deploy code.
* @module CockpitMainServer
* @author Justin Carroll (jrc.csus@gmail.com)
* @requires Express
* @since Nov 15, 2019
*/

// FIXME(JRCarroll): Need to throttle all requests so it doesn't spam the server!


const express = require('express');
const { promisify } = require('util');
const archiver = require('archiver');

const app = express();
const exec = promisify(require('child_process').exec);
const fsRead = promisify(require('fs').readFile);
const fs = require('fs');
const memory = require('./SystemResourceMonitor.js');

const PORT = 8000;

//////////////////////////////
/*		   ROOT APP		    */
//////////////////////////////

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

/**
 * Root path for top level Express Server.
 * @name GET '/'
 * @global
 * @param {object} req request objet as sent by Express.
 * @param {object} res response objet as sent by Express.
 * @example "https://<host>/"
 */
app.get('/', async function(req, res) {
 	res.send("go away!");
});


/**
 * Re-read the service config object on the server.  This is necessary for when you need to update
 * the service configuration to exclude or include new services that should be monitored.  This is a 
 * helper function/wrapper to loading the config.
 * @function
 * @static
 * @category Configuration Management
 * @yields load_serviceConfig()
 */
async function reload_serviceConfig() {
	await load_serviceConfig();
}


/**
 * Load the service config from the file system.
 * @function
 * @category Configuration Management
 * @returns {object} The service config object.  
 */
async function load_serviceConfig() {
	// Load the website config file.
	// TODO: If no services.conf exists, we'll need to create a new file for it!
	console.log(__dirname);
	var data = await fsRead(__dirname + '/services.conf', 'utf8');
	data = read_serviceConfig(null, data);
	return data;
}

/**
 * Runs JSON.parse() on the raw fs.read() of the service config value.
 * @function
 * @category Configuration Management
 * @param {object} err 
 * @param {object} data 
 * @returns {object} The parsed service config object.
 * @todo need to have error handling here.
 */
function read_serviceConfig(err, data) {
	serviceConfig = JSON.parse(data);
	serviceConfig.lastLoadedDT = new Date().toISOString();
	return serviceConfig;
}

/**
 * Get the running services on the machine, grep'ed against the service.conf file for allowed
 * serices.  Ultimately using systemctl under the hood.
 * @category Service Management
 * @function
 * @returns {object} allServices
 * @todo There is a current cybersecurity flaw here that will allow "*" to return all services. Need to do data santization.
 */
async function get_runningServices() {
	// get all the keys from the service.conf to filter the list down.
	var serviceKeys = Object.keys(serviceConfig.services);

	var serviceData = [];

	for (var i=0; i<serviceKeys.length; i++) {
		serviceData.push(serviceConfig.services[serviceKeys[i]].serviceName);
	}

	const _services = await exec(`systemctl | grep -E -- "${serviceData.join("|")}"`);
	console.log(`systemctl | grep -E -- "${serviceData.join("|")}"`);

	const serviceLineArray = [];

	// Slicing Information
	// =========================
    // serviceName:  slice(0,89)
	// status:  slice(89,110)
	// description: slice(113,)
	const preparsedServices = _services.stdout.split('\n');

	// FIXME(JRCarroll): Currently, if we STOP a service, and refresh, we LOSE the service entry in the Web App.  That's not correct.  The row should remain after stopping.
	for (var i = 0; i < preparsedServices.length; i++) {
		let serviceLine = {};
		serviceLine.status = {};
		serviceLine.serviceName = preparsedServices[i].slice(0, 89).trim();
		if (serviceLine.serviceName == "") {
			//pass
		} else {
			_protoServices = preparsedServices[i].slice(89, 110).split(' ');
			serviceLine.status.loaded = _protoServices[0];
			serviceLine.status.active = _protoServices[1];
			serviceLine.status.sub = _protoServices[2];
			serviceLine.description = preparsedServices[i].slice(113, ).trim();
			serviceLineArray.push(serviceLine)
		}
	}

	// Removig the last 8 elements because they are empty!
	var allServices = {};
	allServices.services = serviceLineArray;
	allServices.lasteUpdatedDT = new Date().toISOString();
	return {allServices};
}

/**
 * API GET request for services running on the server, as filtered by the services.conf
 * @name GET '/services'
 * @global
 * @param {object} req request objet as sent by Express.
 * @param {object} res response objet as sent by Express.
 * @example "https://<host>/services"
 */
// Return currently running services on server.
app.get('/services', async function(req, res) {
	if (req.query.reloadConfig){
		console.log("...Reloading service config...");
		// TODO(JRCarroll): Need to add specific logging for anyone who makes an edit to this config or attempts to reload.  Also consider putting a watch such that this config reloads if a write takes place.
		var _ = await reload_serviceConfig();
		res.send("Serice Config Reloaded");
		console.log(serviceConfig);
	} else {
		var data = await get_runningServices();
	}
	
	res.send(data);
});

/**
 * API POST to services to interact with the approved services (where approved means those in the services.conf file),
 * @name POST '/services'
 * @global
 * @param {object} req request objet as sent by Express.
 * @param {object} res response objet as sent by Express.
 * @example "https://<host>/"
 */
app.post('/services', async function(req, res) {
	//console.log(req.query);
	//console.log(serviceConfig.services);

	// This will eventually be used to git pull by branch name, and deploy/restart a new service.
	var serviceName = req.query.serviceName;
	var serviceAction = req.query.serviceAction;
	// serviceObject is an object of service allowable actions as per the service.conf file.
	var serviceObject = serviceConfig.services[req.query.serviceName];

	var status = 500;

	if (!serviceName | !serviceAction) {
		status = 400;
	} else if (!serviceObject) {
		status = 404;
	} else if (serviceObject && serviceObject.serviceSettings[0]=='all') {
		// FIXME(JRCarroll): Need to data sanitize as it's probably a point of ingress for code injection.  Need to check if exec is dealing with this only.  
		var result = await exec(`sudo systemctl ${serviceAction} ${serviceName}`, ).then().catch((err) => {
			console.log(err);
			res.sendStatus(500);
		});
		status = 200;
		console.log("results", result.stdout, result.stderr);
	}

	res.sendStatus(status);

	//console.log("ServiceData", serviceName, "ServiceAction", serviceAction);
});

app.get('/stats', async function(req, res) {
	var data = {}; 
	data.memory = await memory.get_freeMemory();
	data.disk = await memory.get_freeDiskSpace();
	res.send(data);
})

/**
 * Update website on server with a git pull request.
 * @param {string} websiteName The human readible website name as configured in the website.conf file.
 * @returns stdout from the git pull command.
 */
async function update_websiteGitPull (websiteName, branchName) {
	// Update a directory by issuing a git-pull request. 
	// Note: this requires an SSH key added to the git repo + ssh-agent.
	console.log(websiteName);
	console.log(websiteConfig);
	console.log(branchName);
	// debugger;
	var pathToGitRepo = websiteConfig.websites[websiteName].gitPathOnServer;
	var branch = branchName ? branchName : await exec(`git -C ${pathToGitRepo} symbolic-ref --short HEAD`);
	branch = typeof branch == 'string' ? branch : branch.stdout.trim();
	
	var rtnVal;
	try {
		rtnVal = await exec(`git -C ${pathToGitRepo} checkout ${branch}`).then(await exec(`git -C ${pathToGitRepo} pull origin ${branch}`));
		rtnVal = rtnVal.stdout;
	} catch (e) {
		rtnVal = 404;
	}
	// debugger;
	return rtnVal
}

/**
 * Invoking this function will reload the website.conf file from the server.  This is useful when you 
 * deploy a new website. This is a promisified wrapper for the real function.
 * @yields load_websiteConfig()
 */
async function reload_websiteConfig() {
	await load_websiteConfig();
}

/**
 * This will reload the entire website.conf file from the filesystem. This both returns the config values as well as
 * invokes read_websiteConfig() to parse and store (in memory) the website configuration.
 * @returns {object} data website.conf (JSON) parsed data object.
 */
async function load_websiteConfig() {
	// Load the website config file.
	// TODO: If no websites.config exists, we'll need to create a new file for it!
	console.log(__dirname);
	var data = await fsRead(__dirname + '/websites.conf', 'utf8');
	data = read_websiteConfig(null, data)
	return data;
}

/**
 * Reads/parses the website.conf file.  JSON data is underlying.  
 * @param {object} err 
 * @param {object} data 
 * @returns {object} websiteConfig (parsed JSON)
 */
function read_websiteConfig(err, data) {
	websiteConfig= JSON.parse(data);
	websiteConfig.lastLoadedDT = new Date().toISOString();
	return websiteConfig;
}

/**
 * Returns a list of monitored websites.
 * @global
 * @name GET /websites
 * @param {object} req request objet as sent by Express.
 * @param {object} res response objet as sent by Express.
 * @example "https://<host>/websites"
 */
// Get list & status of websites that are currently being monitored.
app.get('/websites', async function (req, res) {
  if (req.query.reloadConfig){
  	var data = await reload_websiteConfig()
  }
  res.send(websiteConfig);
});

/**
 * Interact with monitored websites based on a set of permissions as configured in the website.conf file.
 * @global
 * @param {object} req request objet as sent by Express.
 * @param {object} res response objet as sent by Express.
 * @name POST /websites
 * @example "https://<host>/websites"
 */
app.post('/websites', async function(req, res) {
	console.log(`Trying to update: ${req.query.websiteName}`);
	try {
		var output  = await update_websiteGitPull(req.query.websiteName, req.query.branchName);
	} catch(error) {
		var output = `Invalid request ${error}`;
	}
	res.send(output);
	// This will eventually be used to git pull by branch name, and deploy.
});


//////////////////////////////
/*			LOGS		    */
//////////////////////////////

/**
 * Retrieve the logs for a website or service based on permissions alloted to the requested resource.
 * @global
 * @name GET /logs
 * @param {object} req request objet as sent by Express.
 * @param {object} res response objet as sent by Express.
 * @example "https://<host>/logs"
 */
app.get('/logs', (req, res) => {
	var archive = archiver('tar', {
		zlib: { level: 9 } // Sets the compression level.
	  });

	var logsDir = websiteConfig.websites[req.query.websiteName].logPath;
	console.log(logsDir);
	archive.directory(logsDir, "/logs", "");
	
	res.set('Content-Type','application/octet-stream');
	res.set('Content-Disposition',`attachment; filename=download.tar`);
	res.set('Content-Length',archive.length);
	res.attachment("download.tar");
	archive.pipe(res);
	archive.finalize();
});

app.get('/branches', async function(req, res) {
	if (!req.query.websiteName) {
		res.sendStatus(400);
	} else {
		var data = await get_allWebsiteBranches(req.query.websiteName);
		res.send(data);
	}
});

async function get_allWebsiteBranches(websiteName) {
	var pathToGitRepo = websiteConfig.websites[websiteName].gitPathOnServer;
	await exec(`git -C ${pathToGitRepo} fetch --all`);
	var data = await exec(`git -C ${pathToGitRepo} branch -r`);
	//console.log(data.stdout);
	data = data.stdout.split("\n").slice(1,);
	var newArray = [];
	data.forEach(function(ele, index) { 
		var scrubbedBranch = data[index].split("/")[1];
		
		if ((scrubbedBranch !== undefined) && (scrubbedBranch !="")) {
			newArray[index] = scrubbedBranch;
		}
	})

	console.log("boom", newArray);
	return { "websiteName": websiteName, "branches": newArray };
}

//////////////////////////////////
/*			INIT DEFAULTS		*/
//////////////////////////////////
var websiteConfig = {};
var serviceCOnfig = {};

load_websiteConfig();
load_serviceConfig();

//////////////////////////////////
/*			APP DEFAULTS		*/
//////////////////////////////////

// Default promisify error handling.
process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
	// Stack Trace
	console.log(reason.stack);
  });

app.listen(PORT, () => {
  console.log('Example app listening on port 8000!')
});