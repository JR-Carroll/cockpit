import {MDCList} from "@material/list";
import {MDCDataTable} from '@material/data-table';
import VanillaModal from 'vanilla-modal';
import {MDCMenu} from '@material/menu';
import * as Templates from './modules/CockpitTemplates';
import * as CONSTANTS from './modules/CockpitConstants.js';
import './modules/liquidFillGauge.mjs';
import * as GaugeChart from 'gauge-chart';
import {MDCLinearProgress} from '@material/linear-progress';
import {LOG} from './modules/LoggingUtil.js';

var $ = require("jquery");
var cardHolder = $('#spaceForWebsiteCards')[0];
var modal;
var memGauge;
var diskGauge;
var swapGauge;

const linearProgress = new MDCLinearProgress($('.mdc-linear-progress')[0]);
const linearProgress2 = new MDCLinearProgress($('.mdc-linear-progress')[1]);
const updateBranchBtn = $('#updateByBranchBtn')[0];
const tableElement = $('#serviceTable')[0];

function init() {
	_setup_MDC_Components();
	_setup_Modal();
	_attach_ToMenuButtons();
	create_cockpitFillGauge();
	// Premptively get the serviceData ahead of the page view (so the rows can populate).  
	get_serviceData();
	get_stats();
	setInterval(get_stats, CONSTANTS.SERVICE_DELAY_REQUEST_TIME_MS);
	return true;
}

function _setup_MDC_Components() {
	new MDCDataTable($('.mdc-data-table')[0]);
	MDCList.attachTo($('.mdc-list')[0]).wrapFocus = true;	
	return true;
}

function _setup_Modal() {
	// Modal defaults.  
	modal = new VanillaModal({modal: '.modal',
							  modalInner: '.modal-inner',
							  modalContent: '.modal-content',
							  open: '[data-modal-open]',
							  close: '[data-modal-close]',
							  page: 'body',
							  class: 'modal-visible',
							  loadClass: 'vanilla-modal',
							  clickOutside: true,
							  closeKeys: [27],
							  transitions: true,
							  transitionEnd: null,
							  onBeforeOpen: null,
							  onBeforeClose: null,
							  onOpen: null,
							  onClose: null});	
	return true;
}

function create_cockpitFillGauge() {
	LOG("Attempting to create the various gauges for the dashboard...", CONSTANTS.LOGLEVELS.DEBUG);
	// Properties of the gauge
	var gaugeOptions = {
		hasNeedle: true,
		needleColor: 'gray',
		needleUpdateSpeed: 1000,
		arcColors: ['rgb(44, 151, 222)', 'rgb(80, 22, 100)', 'rgb(151, 22, 100)'],
		arcDelimiters: [33, 66, 99.9],
		arcOverEffect: true,
		rangeLabel: ['0%', '100%'],
		centralLabel: "N/A"
	};
	
	memGauge = GaugeChart.gaugeChart($('#fillgauge1')[0], 400, gaugeOptions);
	diskGauge = GaugeChart.gaugeChart($('#fillgauge2')[0], 400, gaugeOptions);
	swapGauge = GaugeChart.gaugeChart($('#fillgauge3')[0], 400, gaugeOptions);
	return true;
}

function _attach_ToMenuButtons() {
	LOG("Entering the _attach_ToMenuButtons fn()...", CONSTANTS.LOGLEVELS.DEBUG);
	
	$('#serviceBtn')[0].addEventListener("click", _change_PageView);
	$('#websiteBtn')[0].addEventListener("click", _change_PageView);
	$('#dashboardBtn')[0].addEventListener("click", _change_PageView);
	$('#serviceTable')[0].addEventListener("click", function(evt) {
		return handle_serviceRowButtonEvents(evt);
	});
	
	cardHolder.addEventListener("click", function(evt) {
		return handle_websiteCardButtonEvents(evt);
	});

	return true;
}

function _change_PageView(evt) {
	LOG(`Will try to load this page => ${pageName}`, CONSTANTS.LOGLEVELS.INFO);
	
	var pageName = evt.currentTarget.getAttribute("targetPage");
	
	switch (pageName){
		case CONSTANTS.PAGE_NAMES.WEBSITE:
			get_websiteData();
			CONSTANTS.WEBSITE_PAGE.show();
			CONSTANTS.DASHBOARD_PAGE.hide();
			CONSTANTS.SERVICE_PAGE.hide();
			break;
		case CONSTANTS.PAGE_NAMES.SERVICE:
			get_serviceData();
			CONSTANTS.WEBSITE_PAGE.hide();
			CONSTANTS.DASHBOARD_PAGE.hide();
			CONSTANTS.SERVICE_PAGE.show();
			break;
		case CONSTANTS.PAGE_NAMES.DASHBOARD:
			CONSTANTS.WEBSITE_PAGE.hide();
			CONSTANTS.DASHBOARD_PAGE.show();
			CONSTANTS.SERVICE_PAGE.hide();
			break;
		default:
			LOG(`You tried to change to a page that isn't mapped! ${pageName}`, CONSTANTS.LOGLEVELS.WARN)
			break;
	}
	return pageName;
}

function create_WWWCard(data, addToWebsite=true) {
	// Create the rawHTML block with the preformatted text, with the optional ability of placing
	// on the webpage itself.
	LOG(`cardData: ${data} & autoAdd: ${addToWebsite}`, CONSTANTS.LOGLEVELS.DEBUG);

	var websiteName = data.websiteName.replace(/ /g,"_");
	var cardData = {
		card 	 : data,
		gitId 	 : `id-${websiteName}`,
		logId 	 : `log-${websiteName}`,
		divId 	 : `div-${websiteName}`,
		buttonId : `menuButton-${websiteName}`,
		menuId 	 : `menu-${websiteName}`,
		branchId : `branchButton-${websiteName}`,
		deployId : `deployButton-${websiteName}`
	};

	var templateData = Templates.CardTemplate(cardData);
	var domData = new DOMParser().parseFromString(templateData, 'text/html');
	
	new MDCMenu(domData.getElementById(cardData.menuId));

	// Default is to assume that we want this placed on the page.
	if (addToWebsite) {
		place_WWWCard(templateData);
	}

	// Return preformatted HTML data.
	return {cardData, domData};
};		

function place_WWWCard(htmlCardData) {
	cardHolder.innerHTML += htmlCardData;
	return true;
}

function get_websiteData() {
	// Fetch the website status/information for websites being tracked
	// on the server. 
	LOG("Attempting to get Website Data.", CONSTANTS.LOGLEVELS.DEBUG);

	var websiteData = new XMLHttpRequest();
	websiteData._create_WWWCard = create_WWWCard;
	
	websiteData.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			LOG("Successfully got website data from the server.", CONSTANTS.LOGLEVELS.DEBUG);
			LOG(`Here is the data: ${websiteData.responseText}`, CONSTANTS.LOGLEVELS.DEBUG);

			// Clear existing website cards prior to adding new ones...
			cardHolder.innerHTML = _emptyString();

			websiteData._rawParsedData = JSON.parse(websiteData.responseText);
			var data = websiteData._rawParsedData.websites;
			var dataKeys = Object.keys(data);
			
			for (let i=0; i < dataKeys.length; i++) {
				websiteData._create_WWWCard(data[dataKeys[i]]);
			}
		} 
		else if (this.status >= 400) {
			LOG(`Tried to get website cards, but something failed => ${this}`, CONSTANTS.LOGLEVELS.ERROR);		
		}
	}

	websiteData.open('GET', `${CONSTANTS.FULL_SERVICE_URL}/websites`, true);
	websiteData.send();
};

function clear_allModalTextArea() {
	_clear_stdOutBranchTextArea();
	_clear_stdOutTextArea();
}

function _clear_stdOutTextArea() {
	var modalTextField = $('#stdOutCapture')[0];
	modalTextField.value = _emptyString();
	return true;
}

function _clear_stdOutBranchTextArea() {
	var modalTextField = $('#stdOutBranchCapture')[0];
	modalTextField.value = _emptyString();
	return true;
}

function append_newMessageToModal(modal, message) {
	modal.value += "\n"+message;
}

function show_GitBranchSelectionModal(evt) {
	clear_allModalTextArea();
	append_newMessageToModal($('#stdOutBranchCapture')[0], "1.  Select a branch name. \n2.  Click update branch button \n3. Wait for confirmation of update.");
	start_linearProgressBars();
	
	// Open modal and disable buttons until we are finished loading
	modal.open("#serverUpdateByBranch");
	updateBranchBtn.disabled = true;
	
	var selection = $('#selectionForBranch')[0];
	selection.removeChild(selection.children[1]);
	
	var loadingText = document.createElement('span');
	loadingText.innerText = "Loading...";
	selection.appendChild(loadingText);

	var branchData = new XMLHttpRequest();
	
	branchData.onreadystatechange = function(req, res) {
		if (this.readyState == 4 && this.status == 200) {
			var websiteData = JSON.parse(this.response);
			var newSelection = Templates.BranchSelection(websiteData.websiteName, websiteData.branches);
			selection.removeChild(selection.children[1]);
			selection.appendChild(newSelection);
			updateBranchBtn.disabled = false;
			updateBranchBtn.addEventListener('click', function () {
				get_latestGitVersion(websiteData)
			}); 
			stop_linearProgressBars();
		}
	};

	branchData.open("GET", `${CONSTANTS.FULL_SERVICE_URL}/branches?websiteName=${evt.target.id.split("-")[1].split("_").join(" ")}`, true);
	branchData.send();
}

function handle_websiteCardButtonEvents(evt) {
	LOG(`Got a button event request on the cards -> ${evt}`, CONSTANTS.LOGLEVELS.DEBUG);

	var handled = true;

	function _doesEventContain(str) {
		// Note to the Future:  Opted for ternary instead of a switch/case statement onpurpose!
		return true ? evt.target.classList.contains(str) : false;
	}

	function _create_menuOnTheFly(evt) {
		var menuBtn = $('#' + evt.target.id)[0];
		var menu = new MDCMenu(menuBtn.nextElementSibling);
		menu.open = true;
	}

	if (_doesEventContain('gitBtn')) {
		// Git Button was pressed, do action.
		modal.open("#serverStdOutModal");
		get_latestGitVersion(evt.target.id.split("-")[1].split("_").join(" ")); 
	} 
	else if (_doesEventContain('logBtn')) {
		get_logs(evt.target);
	} 
	else if (_doesEventContain('moreBtn')) {
		// HACK(JRCarroll): This is a memory leak, and should be moved to a class obj so we aren't recreating every single time!
		_create_menuOnTheFly(evt);
	} 
	else if (_doesEventContain('mdc-list-item__text')) {
		show_GitBranchSelectionModal(evt);
	} 
	else {
		LOG("Ruh oh!  You attempted to capture a button event, but it's unhandled!", CONSTANTS.LOGLEVELS.DEBUG);
		// Only in an unhandled state do we change `handled` to false.  Simplier!
		handled = false;
	}

	return handled;
}

function handle_serviceRowButtonEvents(evt) {
	LOG(`Received a button event on service rows...${evt}`, CONSTANTS.LOGLEVELS.DEBUG);

	var handled = true;
	// HACK(JRCarroll): This is probably a memory leak, and should be moved to a class obj so we aren't recreating every single time!
	// For Service events, we only have event type we need to work in.
	var menuBtn = document.getElementById(evt.target.id);
	
	function _which_service(data) {
		return data.target.parentNode.parentNode.parentNode.id.split("_")[1];
	}

	if (menuBtn == null && evt.target.classList.contains('mdc-list-item__text')) {
		var newPostRequest = new XMLHttpRequest();
		var service = _which_service(evt);
		var action;

		// TODO(JRCarroll): Need to change to an ENUM for both the presentation and the switch/case	
		switch(evt.target.innerHTML) {
			case CONSTANTS.SERVICE_ROW_MENU.RESTART:
				action = 'restart';
				LOG("Trying to restart the service...", CONSTANTS.LOGLEVELS.INFO);
				break;
			case CONSTANTS.SERVICE_ROW_MENU.STOP:
				action = 'stop';
				LOG("trying to stop the service...", CONSTANTS.LOGLEVELS.INFO);
				break;
			case CONSTANTS.SERVICE_ROW_MENU.DL_LOGS:
				action = 'logs';
				LOG("trying to d/l logs.. this isn't implemented yet.", CONSTANTS.LOGLEVELS.INFO);
				break;
			default:
				LOG(`No event handler/case for ths action: ${evt.target.innerHTML}`, CONSTANTS.LOGLEVELS.WARN);

		newPostRequest.onreadystatechange = function(req, res) {
			if (this.readyState == 4 && this.status == 200) {
				LOG(newPostRequest.response, CONSTANTS.LOGLEVELS.INFO);
			}
		};

		newPostRequest.open("POST", `${CONSTANTS.FULL_SERVICE_URL}/services?serviceName=${service}&serviceAction=${action}`, true);
		newPostRequest.send();
		}
	}
	else if (menuBtn != null) {
		var menu = new MDCMenu(menuBtn.nextElementSibling);
		menu.open = true;
	}
	
	return handled;
}

function start_linearProgressBars() {
	linearProgress.open();
	linearProgress2.open();
}

function stop_linearProgressBars() {
	linearProgress.close();
	linearProgress2.close();
}

function get_latestGitVersion(websiteName) {
	LOG(`Attempting to get the latest GIT version of: ${websiteName}`, CONSTANTS.LOGLEVELS.INFO);
	start_linearProgressBars();
	var updateRequest = new XMLHttpRequest();
	var branchName;	

	var _modalTextField = function () {
		if (typeof websiteName == 'string') {
			return $('#stdOutCapture')[0];
		} else { 
			return $('#stdOutBranchCapture')[0];
		}
	}();

	if (typeof websiteName != 'string') {
		websiteName = websiteName.websiteName;
		branchName = function() {
			var branchSelection = $(`#branchFor_${websiteName.replace(/ /g, "_")}`)[0];
			return branchSelection.options[branchSelection.selectedIndex].text;
		}();
	}

	updateRequest.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			//_modalTextField.value += `\r\n\r\n${"=".repeat(6)}RESULTS BELOW${"=".repeat(6)}r\n\r\n${updateRequest.responseText}`;
			append_newMessageToModal(_modalTextField, `\r\n${"=".repeat(6)}RESULTS BELOW${"=".repeat(6)}\r\n\r\n${updateRequest.responseText}`);
			stop_linearProgressBars();
		}
	};

	var requestStr = `${CONSTANTS.FULL_SERVICE_URL}/websites?websiteName=${websiteName}`;
	
	if (branchName) {
		requestStr += `&branchName=${branchName}`;
	}

	updateRequest.open("POST", requestStr, true);
	updateRequest.send();
}

function process_statsRequest(APIResponse) {
	var parsedData = JSON.parse(APIResponse.response);
	var memPerc = parseFloat(parsedData.memory.usedRAM.split(" ")[0])/parseFloat(parsedData.memory.totalRAM.split(" ")[0]);
	
	// Drawing and updating the chart
	memGauge.updateNeedle(memPerc*100);
	$('#fillgauge1')[0].getElementsByTagName("text")[2].innerHTML = (memPerc*100).toFixed(0) + "%";
	$('#memFraction')[0].innerHTML = `${parsedData.memory.usedRAM.split(" ")[0]} GiB / ${parsedData.memory.totalRAM.split(" ")[0]} GiB`;

	diskGauge.updateNeedle(parsedData.disk.usedPerc[0]);
	$('#fillgauge2')[0].getElementsByTagName("text")[2].innerHTML = parsedData.disk.usedPerc;
	$('#diskFraction')[0].innerHTML = `${parsedData.disk.used.split("G")[0]} GB / ${parsedData.disk.size.split("G")[0]} GB`;

	var swapPerc = parseFloat(parsedData.memory.usedSwap.split(" ")[0])/parseFloat(parsedData.memory.totalSwap.split(" ")[0]);
	swapPerc = swapPerc.toFixed(0)*100;
	swapGauge.updateNeedle(swapPerc);
	$('#fillgauge3')[0].getElementsByTagName("text")[2].innerHTML = swapPerc + "%";
	$('#swapFraction')[0].innerHTML = `${parsedData.memory.usedSwap.split(" ")[0]} GiB / ${parsedData.memory.totalSwap.split(" ")[0]} GiB`;
}

function get_stats() {
	var statsData = new XMLHttpRequest();
	
	statsData.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			process_statsRequest(statsData);
		}
	}

	statsData.open('GET', `${CONSTANTS.FULL_SERVICE_URL}/stats`, true);
	statsData.send();
}

function get_logs(buttonDiv) {
	// FIXME(JRCarroll): Not sure why it takes so long for a tar to get created and sent - especially when it is local.  Need to research and enhance this.
	LOG("Attempting to get website/service logs.", CONSTANTS.LOGLEVELS.DEBUG);
	clear_allModalTextArea();
	
	function _get_buttonID(node) {
		return node.id.split("-")[1].split("_").join(" ");
	}
	
	var logData = new XMLHttpRequest();
	var name = _get_buttonID(buttonDiv);
	var modalTextField = $('#stdOutCapture')[0];
	
	modal.open("#serverStdOutModal");

	append_newMessageToModal(modalTextField, `Please wait... getting response from server...\r\n${"=".repeat(6)}RESULTS BELOW${"=".repeat(6)}\r\n\r\n"Getting TAR of logs, please wait..."`);
	
	logData.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var blob = new Blob([logData.response], {type: "octet/stream"});
			var fileName = "new.tar";
			
			if (navigator.msSaveOrOpenBlob) {
				navigator.msSaveOrOpenBlob(blob, fileName);
			} else {
				var a = document.createElement("a");
				document.body.appendChild(a);
				a.style = "display:none";
				var url = window.URL.createObjectURL(blob);
				a.href = url;
				a.download = fileName;
				a.click();
				window.URL.revokeObjectURL(url);
				a.remove();
			}
			modal.close();
			}
		else if (this.status >= 400) {
			LOG("Unable to get service data, something has gone wrong!", CONSTANTS.LOGLEVELS.ERROR);
			}
		}	
	logData.open('GET', `${CONSTANTS.FULL_SERVICE_URL}/logs?websiteName=${name}`, true);
	logData.send();
}

// Move ALL SERVICE RELATED CODE TO IT'S OWN MODULE!!!
function get_serviceData() {
	// Fetch service data from the hosted machine and return the statuses for each
	// service line.
	LOG("Attempting to get Service Data.", CONSTANTS.LOGLEVELS.DEBUG);
	var serviceData = new XMLHttpRequest();
	
	tableElement.innerHTML = Templates.LoadingMessageString();

	serviceData.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			tableElement.innerHTML = _emptyString();

			JSON.parse(serviceData.responseText).allServices.services.forEach(function(rowData, index, ...args) {
				LOG("Trying to create the markup for the service row", CONSTANTS.LOGLEVELS.DEBUG);
				tableElement.innerHTML += Templates.RowTemplate(rowData);
			});
		}
		else if (this.status >= 400) {
			LOG("Unable to get service data, something has gone wrong!", CONSTANTS.LOGLEVELS.ERROR);
		}
	}	

	// TODO: The final service should be without a port and/or hostname.
	// This ideally should be abstracted out to a higher level for easier
	// configuration.  
	serviceData.open('GET', `${CONSTANTS.FULL_SERVICE_URL}/services`, true);
	serviceData.send();
}

function _emptyString() {
	return "";
}

init();

