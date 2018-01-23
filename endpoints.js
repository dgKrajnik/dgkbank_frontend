var cordaEndpoints = (function(){
// Endpoint to get the name of the server.
//
// Should return a promise for a plain string.
function getMeEndpoint(base, endpoint) {
    return fetch(`${base}${endpoint}`)
        .then((response) => {return response.text();});
}

// Endpoint to get all of the tokens that this node has control over.
//
// Should return a promise for an array of objects that contain, at minimum, 
// a .hash and a .index property.
function getTokensEndpoint(base, endpoint) {
    return fetch(`${base}${endpoint}`)
        .then((response) => {return response.json();});
}

// Endpoint to get all of the peers in the network.
//
// Should return a promise for an array of strings which are the 
// short representation of X500 names
function getPeersEndpoint(base, endpoint) {
    return fetch(`${base}${endpoint}`)
        .then((response) => {return response.json();})
        .then((data) => {return data.peers;});
}

// Endpoint to submit an issuance request.
//
// Should be given a JSON request payload.
function postIssueRequest(base, endpoint, data) {
    return fetch(`${base}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })});
}

// Endpoint to submit a move request.
//
// Should be given a JSON request payload.
function postMoveRequest(base, endpoint, data) {
    return fetch(`${base}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })});
}

// 'exports'
return {
    'getMeEndpoint': getMeEndpoint,
    'getTokensEndpoint': getTokensEndpoint,
    'getPeersEndpoint': getPeersEndpoint,
    'postIssueRequest': postIssueRequest,
    'postMoveRequest': postMoveRequest
}
}());