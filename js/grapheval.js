//Returns all edges that flow from a specific node
//Format: Array with elements containing [from, to, label]
function getNodeEdges(nodeId) {
    var fromTo = edges.get({ fields: ['from', 'to', 'label'] });
    var connectedEdges = [];

    for (var i = 0; i < fromTo.length; i++)
        if (fromTo[i].from == nodeId)
            connectedEdges.push(fromTo[i]);

    return connectedEdges;
}

//Returns the nodes atoms with their value
//Format: String containing for example "p, ¬q"
function getNodeAtoms(nodeId) {
    return nodeAtoms[nodeId];
}

//Returns if certain atom holds at node
//Format: Enter for example 'p' for node 1
function atomHoldsAtNode(sentence, nodeId, truthTable) {
    if (sentence.child == '⊥')
        return false;
    if (sentence.child == '¬⊥')
        return true;
    if (sentence.child == '⊤')
        return true;
    if (sentence.child == '¬⊤')
        return false;
    return evaluateAtom(sentence.child, nodeId);
}


function evaluateAtom(atom, nodeId) {
    return getNodeAtoms(nodeId).includes(atom) && !getNodeAtoms(nodeId).includes("¬" + atom);
}


function subsentenceHoldsAtNode(sentence, truthTable, nodeId) {
    var sliced = simpleSlice(sentence.child);

    var a = truthTable[lastParenthesizedSubstring(sliced[0])];
    var b = truthTable[lastParenthesizedSubstring(sliced[1])];

    return evaluate(a[nodeId - 1], b[nodeId - 1], sliced[2]);
}


function subsentenceHoldsAtNodeWithKECMI(sentence, truthTable, nodeId) {
    var sliced = simpleSlice(sentence.parent);

    var a = truthTable[lastParenthesizedSubstring(sliced[0])];
    var b = truthTable[lastParenthesizedSubstring(sliced[1])];

    if (a == undefined || b == undefined)
        return;
    return evaluate(a[nodeId - 1], b[nodeId - 1], sliced[2]);
}

//Returns all connected nodes for a certain agent
//Format: Array of node ids [1, 5, 4]
function getConnectedNodes(agent, nodeId) {
    var connectedEdges = getNodeEdges(nodeId);
    var connectedNodes = [];
    for (var i = 0; i < connectedEdges.length; i++)
        if (connectedEdges[i].label.includes(agent))
            connectedNodes.push(connectedEdges[i].to);
    return connectedNodes;
}

//Returns edge label from edgeId
//Format: Returns a string
function edgeLabelFromId(edgeId) {
    return edges.get(edgeId).label;
}

function evaluate(a, b, operator) {
    switch (operator) {
        case '∧':
            return a && b;
            break;
        case '∨':
            return a || b;
            break;
        case '→':
            return !a || b;
            break;
        case '↔':
            return a == b;
            break;
    }
}