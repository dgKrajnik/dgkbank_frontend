const baseUrl ="http://localhost:8081";
const getTokenEndpoint = "/dgkbank/getdaniels";
const getMeEndpoint = "/dgkbank/myname";
const getPeersEndpoint = "/dgkbank/peersnames";
const postIssueEndpoint = "/dgkbank/issue-asset-request";
const postMoveEndpoint = "/dgkbank/issue-move-request";

let tokens = [];
let myname = null;

const actionids = ["issue", "move"];
const actionsuffix = "window";
let actions = {};
let activeAction = null;

// Function to construct the JSON payload for an issue request.
//
// It will recieve a value input from a textbox on the page,
// and a peer in shortform, and expects an object in return.
function constructIssuePayload(value, target) {
    let issuer = parseX500(target);
    let data = {
        "thought": value,
        "issuer": issuer,
    };
    return data;
}

// Function to construct the JSON payload for a move request.
//
// It will recieve a transaction hash and index, to identify a state,
// and a target peer in shortform, and expects an object in return.
function constructMovePayload(hash, index, target) {
    let issuer = parseX500(target);
    let data = {
        "danielHash": hash,
        "danielindex": index,
        "newOwner": issuer
    };
    return data;
}

function initActions() {
    for (let id of actionids) {
        let elid = id + actionsuffix;
        actions[id] = document.getElementById(elid);
        actions[id].setAttribute("hidden", true);
    }
    activeAction = actions[actionids[0]];
    activeAction.removeAttribute("hidden");
}

function parseX500(name) {
    let bits = name.split(",");
    let x500 = {}
    for (let bit of bits) {
        if (bit.startsWith("O=")) {
            x500["organisation"] = bit.slice(2);
        } else if (bit.startsWith("L=")) {
            x500["locality"] = bit.slice(2);
        } else if (bit.startsWith("C=")) {
            x500["country"] = bit.slice(2);
        } else if (bit.startsWith("CN=")) {
            x500["commonName"] = bit.slice(3);
        }
    }
    return x500;
}

function outputError(error) {
    let errorcontainer = document.getElementById("errorcontainer");
    errorcontainer.removeAttribute("hidden");
    errorcontainer.innerHTML += error + "<br/>"; // Injection Vuln
}

function outputSuccess(message) {
    let successcontainer = document.getElementById("successcontainer");
    successcontainer.textContent = message
    successcontainer.style.opacity = 1;
    setTimeout(() => {successcontainer.style.opacity = 0;}, 2500);
}

function populateHeader() {
    let mePromise = cordaEndpoints.getMeEndpoint(baseUrl, getMeEndpoint);
    let header = document.getElementById("pageheader");
    mePromise
        .then((name) => {
            header.textContent = name;
            myname = name;
        })
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                dd.textContent = "--";
                outputError("Could not get server name.");
            }
        });
}

function switchActionMode(action) {
    let nextAction = actions[action];
    if (nextAction === undefined) {
        throw new Error("Undefined Action");
    }
    activeAction.setAttribute("hidden", true);
    nextAction.removeAttribute("hidden")
    activeAction = nextAction;
}

function replaceWithAnchor(parent, id) {
    let anchor = document.createElement("a");
    anchor.setAttribute("href", "#");
    anchor.setAttribute("id", id);
    anchor.innerHTML = parent.innerHTML;
    anchor.setAttribute("class", parent.getAttribute("class"));
    parent.innerHTML = "";
    parent.insertAdjacentElement("afterend", anchor);
    parent.remove();
    return anchor;
}

function updateTokenLists() {
    let tokenPromise = cordaEndpoints.getTokensEndpoint(baseUrl, getTokenEndpoint);
    return tokenPromise
        .then((data) => {
            let tokenmenu = document.getElementById("tokenmenu");
            let movetokenmenu = document.getElementById("movetokenmenu");
            tokens = data; 
            tokenmenu.innerHTML = "";
            movetokenmenu.innerHTML = "";
            for (let token of tokens) {
                tokenmenu.add(new Option(token.hash));
                movetokenmenu.add(new Option(token.hash));
            }
        })
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                outputError("Network failure while retrieving tokens.");
            }
        });
}

function updateTokenDisplay() {
    let tokendisplay = document.getElementById("tokendisplay");
    let tokenmenu = document.getElementById("tokenmenu");
    tokendisplay.textContent = JSON.stringify(tokens[tokenmenu.selectedIndex], null, 4);
}

function updatePeerLists() {
    let peerPromise = cordaEndpoints.getPeersEndpoint(baseUrl, getPeersEndpoint);
    peerPromise
        .then((peers) => {
            let issuepeermenu = document.getElementById("issuepeermenu");
            let movepeermenu = document.getElementById("movetomenu");
            issuepeermenu.innerHTML = "";
            movepeermenu.innerHTML = "";
            for (let peer of peers) {
                movepeermenu.add(new Option(peer));
                if (peer !== myname) {
                    issuepeermenu.add(new Option(peer));
                }
            }
        });
}

function issueRequest(base, endpoint) {
    let payload = document.getElementById("issuepayload").value;
    let peer = document.getElementById("issuepeermenu").selectedOptions[0].textContent;
    let data = constructIssuePayload(payload, peer);

    let issuePromise = cordaEndpoints.postIssueRequest(base, endpoint, data);
    issuePromise
        .then((response) => {
            console.log(response)
            if (response.status !== 200) {
                throw Error("Bad status code");
            }
            outputSuccess("Issue looks like it worked");
        })
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                outputError("Network error while making issue request.");
            } else {
                throw reason;
            }
        })
        .catch((reason) => {
            outputError("Issue request failed for unknown reason:");
            outputError("\t" + reason.message);
        });
}

function moveRequest(base, endpoint) {
    let token = tokens[document.getElementById("movetokenmenu").selectedIndex];
    let peer = document.getElementById("movetomenu").selectedOptions[0].textContent;
    let data = constructMovePayload(token.hash, token.id, peer)

    let movePromise = cordaEndpoints.postMoveRequest(base, endpoint, data);
    movePromise
        .then((response) => {
            console.log(response)
            if (response.status !== 200) {
                throw Error("Bad status code");
            }
            outputSuccess("Move looks like it worked");
        })
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                outputError("Network error while making move request.");
            } else {
                throw reason;
            }
        })
        .catch((reason) => {
            outputError("Move request failed for unknown reason: ");
            outputError("\t" + reason.message);
        });
}

function issueOpen() {updatePeerLists();}
function moveOpen() {updateTokenLists(); updatePeerLists();}


// Init code
initActions();

let reloadbutton = document.getElementById("reloadbutton");
reloadbutton.onclick = () => updateTokenLists();

let tokenmenu = document.getElementById("tokenmenu");
tokenmenu.onchange = (e) => updateTokenDisplay();

let actionlabel = document.getElementById("actionlabel");
let actionanchor = replaceWithAnchor(actionlabel, "actionanchor");

// Issue stuff
let issuelink = document.getElementById("issueaction").firstElementChild;
let issueanchor = replaceWithAnchor(issuelink, "issueaction");
issueanchor.onclick = () => {switchActionMode("issue"); issueOpen();};
let issuebutton = document.getElementById("issuebutton");
issuebutton.onclick = () => issueRequest(baseUrl, postIssueEndpoint);
let issuereloadbutton = document.getElementById("issuereloadbutton");
issuereloadbutton.onclick = () => updatePeerLists();

// Move stuff
let movelink = document.getElementById("moveaction").firstElementChild;
let moveanchor = replaceWithAnchor(movelink, "moveaction");
moveanchor.onclick = () => {switchActionMode("move"); moveOpen();};

let movebutton = document.getElementById("movebutton");
movebutton.onclick = () => moveRequest(baseUrl, postMoveEndpoint);

let movereloadbutton = document.getElementById("movereloadbutton");
movereloadbutton.onclick = () => updatePeerLists();

let movereloadtokenbutton = document.getElementById("movereloadtokenbutton");
movereloadtokenbutton.onclick = () => updateTokenLists();

updateTokenLists().then(() => {updateTokenDisplay();});
updatePeerLists();
populateHeader();

issueOpen();