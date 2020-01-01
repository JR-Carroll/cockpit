export function CardTemplate (cardData) {
    // Prefill an HTML template with data.  I expect the following"
    // [Object] CardData which has the following properties:
    //  -    [String] DivID
    //  -    [String] WebsiteName
    //  -    [String] ProductionWWW
    //  -    [String] DevelopmentWWW
    //  -    [String] GitID
    //  -    [String] LogID
    //  -    [String] ButtonID
    //  -    [String] MenuID
    // TODO: Need to fill in better description of what these properties are.
    
    var card = `<div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-3" id="${cardData.divId}">
                    <div class="mdc-card demo-card demo-ui-control">
                        <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
                            <div class="demo-card__primary">
                                <h2 class="demo-card__title mdc-typography mdc-typography--headline6">${cardData.card.websiteName}</h2>
                                <h4 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2">${cardData.card.productionWWW}</h2>
                                <h4 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2">${cardData.card.developmentWWW}</h2>
                            </div>
                        </div>
                        <div class="mdc-card__actions">
                            <div class="mdc-card__action-buttons">
                                <button class="mdc-button mdc-card__action mdc-card__action--button gitBtn" id="${cardData.gitId}">Git Update</button>
                                <button class="mdc-button mdc-card__action mdc-card__action--button logBtn" id="${cardData.logId}">Download Logs</button>
                                <div class="mdc-card__action-icons">
                                <div id="demo-menu" class="mdc-menu-surface--anchor">
                                    <button class="material-icons mdc-icon-button mdc-card__action mdc-card__action--icon moreBtn" title="More options" id="${cardData.buttonId}">more_vert</button>
                                    <div class="mdc-menu mdc-menu-surface" id="${cardData.menuId}">
                                        <ul class="mdc-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">
                                            <li class="mdc-list-item" role="menuitem">
                                            <span class="mdc-list-item__text" id="${cardData.branchId}">Update by Branch</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                        
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
    return card;
}

// ADD BACK INTO CARD TEMPATE ONCE READY
//                                            <li class="mdc-list-item" role="menuitem">
//<span class="mdc-list-item__text" id="${cardData.deployId}">Redeploy</span>
//</li>

export function BranchSelection(websiteName, branchNames)  {
    var selectionWrapper = document.createElement('select');
    selectionWrapper.id = `branchFor_${websiteName.replace(/ /g, "_")}`;
    branchNames.forEach(function(branchName) {
        var selectionRow = document.createElement("option");
        selectionRow.value = `branchName_${branchName}`;
        selectionRow.innerText = branchName;
        selectionWrapper.appendChild(selectionRow);
    });

    return selectionWrapper;
}

export function LoadingMessageString() {
    var text = `<div class="d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>`;

    return text;
}

export function RowTemplate(rowData) {
    var row = `<tr class="mdc-data-table__row">
                <td class="mdc-data-table__cell">${rowData.serviceName}</td>
                <td class="mdc-data-table__cell mdc-data-table__cell--numeric">${rowData.status.loaded}</td>
                <td class="mdc-data-table__cell mdc-data-table__cell--numeric">${rowData.status.active}</td>
                <td class="mdc-data-table__cell mdc-data-table__cell--numeric">${rowData.status.sub}</td>
                <td class="mdc-data-table__cell">${rowData.description}</td>
                <td class="mdc-data-table__cell">
                    <div class="mdc-card__action-icons">
                    <div id="demo-menu" class="mdc-menu-surface--anchor">
                        <button class="material-icons mdc-icon-button mdc-card__action mdc-card__action--icon moreBtn" title="More options" id="btn_${rowData.serviceName}">more_vert</button>
                        <div class="mdc-menu mdc-menu-surface" id="menu_${rowData.serviceName}">
                            <ul class="mdc-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">
                                <li class="mdc-list-item" role="menuitem">
                                <span class="mdc-list-item__text">(Re)Start Service</span>
                                </li>
                                <li class="mdc-list-item" role="menuitem">
                                <span class="mdc-list-item__text">Stop Service</span>
                                </li>
                                <li class="mdc-list-item" role="menuitem">
                                <span class="mdc-list-item__text">Download Service Logs</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>`;
    return row;
}