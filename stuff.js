const base_url ="http://localhost:8081";
const get_token_endpoint = "/dgkbank/getdaniels";
const get_me_endpoint = "/dgkbank/myname";
const get_peers_endpoint = "/dgkbank/peersnames";
const post_issue_endpoint = "/dgkbank/issue-asset-request";

let tokens = [];
let myname = null;

const actionids = ["issue", "move"];
const actionsuffix = "window";
let actions = {};
let activeAction = null;

function initActions() {
    for (let id of actionids) {
        let elid = id+actionsuffix;
        actions[id] = document.getElementById(elid);
        actions[id].setAttribute("hidden", true);
    }
    activeAction = actions[actionids[0]];
    activeAction.removeAttribute("hidden");
}

function outputError(error) {
    let errorcontainer = document.getElementById("errorcontainer");
    errorcontainer.removeAttribute("hidden");
    errorcontainer.innerHTML += error + "<br/>";
}

function getAPIMeEndpoint(base, endpoint) {
    let dd = document.getElementById("pageheader");
    return fetch(`${base}${endpoint}`)
        .then((response) => {return response.text();})
        .then((data) => {dd.textContent = data; myname = data;})
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                dd.textContent = "--";
                outputError("Could not get server name.");
            }
        });
}

function getAPIGetTokensEndpoint(base, endpoint) {
    let dd = document.getElementById("apidump");
    return fetch(`${base}${endpoint}`)
        .then((response) => {return response.json();})
        .then((data) => {
            tokens = [] //Global tokens
            for (let x of data) {
                tokens.push(x)
            }
        })
        .then(() => {
            tokenmenu.innerHTML = "";
            for (let x of tokens) {
                tokenmenu.add(new Option(x.hash));
            }
        })
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                dd.textContent = "--";
                outputError("Network failure while retrieving tokens.");
            }
        });
}

function getPeerGetEndpoint(base, endpoint) {
    return fetch(`${base}${endpoint}`)
        .then((response) => {return response.json();})
        .then((data) => {return data.peers;}) //Global peers
        .catch((reason) => {
            if (reason.message.startsWith("NetworkError")) {
                outputError("Could not get peers");
            }
        });
}

function switchActionMode(action) {
    let nextAction = actions[action];
    if (nextAction === undefined) {
        throw new Error("Undefined Action");
    }
    activeAction.setAttribute("hidden", true);
    activeAction = nextAction;
    activeAction.removeAttribute("hidden");
}

function updateTokenDisplay() {
    let dd = document.getElementById("apidump");
    let tokenmenu = document.getElementById("tokenmenu");
    dd.textContent = JSON.stringify(tokens[tokenmenu.selectedIndex], null, 4);
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

function issueReloadPeers() {
    let peerPromise = getPeerGetEndpoint(base_url, get_peers_endpoint);
    peerPromise.then((peers) => {
        let peermenu = document.getElementById("issuepeermenu");
        peermenu.innerHTML = "";
        for (let peer of peers) {
            if (peer === myname) {
                continue;
            }
            peermenu.add(new Option(peer));
        }
    });
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
        }
    }
    return x500;
}

function issueMakeRequest(base, endpoint) {
    let payload = document.getElementById("issuepayload").value;
    let peer = document.getElementById("issuepeermenu").selectedOptions[0].textContent;
    let issuer = parseX500(peer);
    let data = {
        "thought": payload,
        "issuer": issuer
    };

    fetch(`${base}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })})
    .then((response) => {
        console.log(response)
        if (response.status !== 200) {
            throw Error("Bad status code");
        }
    })
    .catch((reason) => {
        if (reason.message.startsWith("NetworkError")) {
            outputError("Network error while making issue request.");
        } else {
            throw reason;
        }
    })
    .catch((reason) => {
        outputError("Issue request failed for unknown reason: ");
        outputError("\t" + reason.message);
    });
}

function issueOpen() {issueReloadPeers();}
function moveOpen() {}


initActions();

let reloadbutton = document.getElementById("reloadbutton");
reloadbutton.onclick = () => getAPIGetTokensEndpoint(base_url, get_token_endpoint);

let tokenmenu = document.getElementById("tokenmenu");
tokenmenu.onchange = (e) => updateTokenDisplay(e.target.selectedIndex);

let actionlabel = document.getElementById("actionlabel");
let actionanchor = replaceWithAnchor(actionlabel, "actionanchor");

// Issue stuff
let issuelink = document.getElementById("issueaction").firstElementChild;
let issueanchor = replaceWithAnchor(issuelink, "issueaction");
issueanchor.onclick = () => {switchActionMode("issue"); issueOpen();};
let issuebutton = document.getElementById("issuebutton");
issuebutton.onclick = () => issueMakeRequest(base_url, post_issue_endpoint);
let issuereloadbutton = document.getElementById("issuereloadbutton");
issuereloadbutton.onclick = () => issueReloadPeers();

// Move stuff
let movelink = document.getElementById("moveaction").firstElementChild;
let moveanchor = replaceWithAnchor(movelink, "moveaction");
moveanchor.onclick = () => {switchActionMode("move"); moveOpen();};

getAPIGetTokensEndpoint(base_url, get_token_endpoint).then(() => updateTokenDisplay());
getAPIMeEndpoint(base_url, get_me_endpoint);

issueOpen();