function prove() {
    var formula = document.getElementById('proveTxt').value;
    var world = document.getElementById('worldTxt').value;
    var outputTable = document.getElementById('truthTable');

    outputTable.innerText = "Error parsing sentence!";

    if (!nodes.getIds().toString().includes(world)) {
        outputTable.innerText = "Invalid world selected!";
        return;
    }
    console.log(formula);
    formula = preprocess(formula);
    console.log(formula);
    console.log(lastParenthesizedSubstring(formula));
    sentences = slice(formula, 'none', []);
    var sentencesDup = sentences.slice(0);


    var truthTable = [];
    var i = 0;
    var j = 0;


    while (true) {
        var s = getSmallestSubformula(sentences, 0);
        sentences.splice(sentences.indexOf(s), 1);

        if (hasNoOperators(s.child) && hasNoFunction(s.child)) {

            if (truthTable[s.child] == null)
                truthTable[s.child] = [];

            for (var j = 0; j < nodes.getIds().length; j++)
                truthTable[s.child].push(atomHoldsAtNode(s, nodes.getIds()[j], truthTable));

        } else if (hasNoFunction(s.child) && !s.child.includes("¬(")) {
            if (truthTable[s.child] == null)
                truthTable[s.child] = [];

            for (var j = 0; j < nodes.getIds().length; j++)
                truthTable[s.child].push(subsentenceHoldsAtNode(s, truthTable, nodes.getIds()[j]));
        }
        if (s.parent == 'none' || i++ >= 1000)
            break;

    }

    while (true) {
        var s = getSmallestSubformula(sentencesDup, 0);
        if (s.parent == 'none' || j++ >= 1000)
            break;
        sentencesDup.splice(sentencesDup.indexOf(s), 1);

        if (hasLogicRule(s)) {

            if (truthTable[s.parent] == null) {
                truthTable[s.parent] = [];
            }

            switch (s.logicRule[0]) {
                case 'K':
                    for (var j = 0; j < nodes.getIds().length; j++)
                        truthTable[s.parent].push(evaluateOperatorK(s.child, s.logicRule[1], nodes.getIds()[j], truthTable));
                    break;
                case 'M':
                    for (var j = 0; j < nodes.getIds().length; j++)
                        truthTable[s.parent].push(evaluateOperatorM(s.child, s.logicRule[1], nodes.getIds()[j], truthTable))
                    break;
                case 'E':
                    for (var j = 0; j < nodes.getIds().length; j++)
                        truthTable[s.parent].push(evaluateOperatorE(s.child, nodes.getIds()[j], truthTable));
                    break;
                case 'I':
                    for (var j = 0; j < nodes.getIds().length; j++)
                        truthTable[s.parent].push(evaluateOperatorI(s.child, nodes.getIds()[j], truthTable));
                    break;
                case 'C':
                    for (var j = 0; j < nodes.getIds().length; j++)
                        truthTable[s.parent].push(evaluateOperatorC(s.child, nodes.getIds()[j], truthTable));
                    break;
                case '¬':
                    for (var j = 0; j < nodes.getIds().length; j++)
                        truthTable[s.parent].push(!truthTable[s.child][j])
                    break;
            }
        } else if (!hasLogicRule(s) && (!hasNoFunction(s.child) || s.child.includes('¬('))) {
            var truthValue = subsentenceHoldsAtNodeWithKECMI(s, truthTable, nodes.getIds()[0])
            if (truthTable[s.parent] == null && truthValue != undefined)
                truthTable[s.parent] = [];

            for (var j = 0; j < nodes.getIds().length; j++)
                if (truthValue != undefined)
                    truthTable[s.parent].push(subsentenceHoldsAtNodeWithKECMI(s, truthTable, nodes.getIds()[j]));
        }
    }
    printTruthTableOutput(truthTable, world);
}

function preprocess(text) {
    text = text.replace(/\s|¬¬/g, '');
    return text;
}


function printTruthTableOutput(pairs, world) {
    var outputTable = document.getElementById('truthTable');
    var keys = Object.keys(pairs);
    var last = keys[keys.length - 1];

    for (var i = 0; i < keys.length; i++) {
        if (keys[i].length == 0) {
            outputTable.innerText = "Error parsing sentence!";
            return;
        }
    }

    if (pairs[last] == null) {
        outputTable.innerText = "Error parsing sentence!";
        return;
    }

    var output = [];
    for (t in pairs)
        output.push("<tr class='selectable'><td class='firstRow'>" + t + "</td><td>" + pairs[t][world - 1] + "</td></tr>");
    outputTable.innerHTML = "<table>" + output.toString().replace(/,/g, '') + "</table>";
}

function getSmallestSubformula(sentences, start) {
    children = hasChild(sentences, sentences[start].child);

    if (children[0])
        return getSmallestSubformula(sentences, children[1]);
    return sentences[start];
}

function hasChild(sentences, parent) {
    for (var i = sentences.length - 1; i >= 0; i--)
        if (sentences[i] && sentences[i].parent == parent)
            return [true, i];

    return [false, 0];
}

function hasNoFunction(sentence) {
    return !sentence.includes("K") && !sentence.includes("E") && !sentence.includes("C") && !sentence.includes("M") && !sentence.includes("I");
}

function hasNoOperators(sentence) {
    return !sentence.includes("∧") && !sentence.includes("∨") && !sentence.includes("→") && !sentence.includes("↔");
}

function hasLogicRule(s) {
    return s.logicRule != 'none' && s.logicRule != undefined;
}

function isAnOperator(character) {
    return character == "∧" || character == "∨" || character == "→" || character == "↔";
}

function slice(text, parent, sentences, logicRule) {
    var brackets = 0;
    var idx = 0;
    var operatorIndxs = [];
    var operatorcount = 0
    var agent = 0

    while (text[0] == '(' && text[text.length - 1] == ')' && (!closedEarly(text))) {
        text = lastParenthesizedSubstring(text);
    }

    sentences.push({ parent: parent, child: text, logicRule: logicRule });
    logicRule = 'none';

    if (hasNoFunction(text) && hasNoOperators(text))
        return sentences;

    if ((text[0] == 'K' || text[0] == 'M') && !closedEarly(text) && text[2] == '(') {
        logicRule = text[0] + text[1];
        temptext = text.substr(2, text.length - 2)
        return slice(temptext, text, sentences, logicRule)
    }

    if ((text[0] == 'C' || text[0] == 'E' || text[0] == 'I' || text[0] == '¬') && !closedEarly(text) && text[1] == '(') {
        logicRule = text[0]
        temptext = text.substr(1, text.length - 1)
        return slice(temptext, text, sentences, logicRule)
    }

    if (text[0] == '¬' && !hasNoFunction(text[1]) && !closedEarly(text)) {
        logicRule = text[0]
        temptext = text.substr(1, text.length - 1)
        return slice(temptext, text, sentences, logicRule)
    }

    for (var i = 0; i < text.length; i++) {
        var c = text[i];

        if (c == '(')
            brackets++;
        if (c == ')')
            brackets--;
        if (brackets == 0 && isAnOperator(c)) {
            operatorIndxs[operatorcount] = i;
            operatorcount++;
        }
    }

    for (i = 0; i < operatorcount; i++) {
        var length = operatorIndxs[i] - idx;

        var subsentence = text.substr(idx, length);
        slice(subsentence, text, sentences, logicRule);

        idx = operatorIndxs[i] + 1;
    }

    var subsentence = text.substr(idx, text.length - 1);
    return slice(subsentence, text, sentences, logicRule);

}

function closedEarly(text) {
    var opencount = 0;
    var closecount = 0;

    for (i = 0; i < text.length; i++) {
        if (text[i] == '(')
            opencount++;
        if (text[i] == ')')
            closecount++;

        if ((closecount == opencount) && (i > 0) && (i != text.length - 1) && (opencount > 0))
            return true;
    }
    return false;
}


function simpleSlice(text) {
    var brackets = 0;
    var operatorIdx = 0;

    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (c == '(') brackets++;
        if (c == ')') brackets--;
        if (brackets == 0 && isAnOperator(c)) {
            var a = text.substr(operatorIdx, i);
            operatorIdx = i;
            break;
        }
    }
    var b = text.substr(operatorIdx + 1, text.length - 1);
    return [a, b, text[operatorIdx]];
}

function countChar(text, token) {
    return text.split(token).length - 1;
}

function lastParenthesizedSubstring(text) {
    if (text[0] != '(' || text[text.length - 1] != ')')
        return text;

    var end = text.lastIndexOf(')');
    var i = end - 1;
    var nesting = 1;

    while (nesting > 0) {
        if (i < 0)
            return null;

        var c = text.charAt(i);

        if (c === ')')
            nesting++;
        else if (c === '(')
            nesting--;
        i--;
    }

    return lastParenthesizedSubstring(text.substring(i + 2, end));
}

function evaluateOperatorK(subsentence, agent, world, truthTable) {
    var connectedNodes = getConnectedNodes(agent, world);
    if (connectedNodes.length == 0)
        return false;

    for (var i = 0; i < connectedNodes.length; i++)
        if (!truthTable[subsentence][connectedNodes[i] - 1])
            return false;
    return true;
}


function evaluateOperatorM(subsentence, agent, world, truthTable) {
    var connectedNodes = getConnectedNodes(agent, world);
    if (connectedNodes.length == 0)
        return false;

    for (var i = 0; i < connectedNodes.length; i++)
        if (truthTable[subsentence][connectedNodes[i] - 1])
            return true;
    return false;
}

function evaluateOperatorE(subsentence, world, truthTable) {
    var connectedNodes = [];
    agents = Object.keys(cbsAgents);
    for (var i = 0; i < agents.length; i++)
        connectedNodes = connectedNodes.concat(getConnectedNodes(agents[i], world));

    if (connectedNodes.length == 0)
        return false;

    for (var i = 0; i < connectedNodes.length; i++)
        if (!truthTable[subsentence][connectedNodes[i] - 1])
            return false;
    return true;
}


function evaluateOperatorI(subsentence, world, truthTable) {
    var connectedNodes = [];
    var x = getNodeEdges(world);

    var agents = [];

    for (var i = 0; i < x.length; i++) {
        agents = agents + ', ' + x[i].label;
    }

    if (agents.includes(',')) {
        agents = agents.replace(/,/g, "");
        var unique = agents.split('').filter(function(item, i, ar) { return ar.indexOf(item) === i; }).join('');
    } else {
        return false
    }


    for (var i = 1; i < (unique.length); i++) {

        connectedNodes = connectedNodes.concat(getConnectedNodes(unique[i], world));
    }

    var counts = {};

    for (var i = 0; i < connectedNodes.length; i++) {
        var num = connectedNodes[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }


    var connectedNodes2 = [];
    for (var i = 1; i <= nodes.getIds().length; i++) {
        if (counts[i] == (unique.length - 1)) {
            connectedNodes2 = connectedNodes2.concat(i);
        }
    }



    if (connectedNodes2.length == 0)
        return false;

    for (var i = 0; i < connectedNodes2.length; i++)
        if (!truthTable[subsentence][connectedNodes2[i] - 1])
            return false;
    return true;
}






function evaluateOperatorC(subsentence, world, truthTable) {
    var connectedNodes = [world];
    agents = Object.keys(cbsAgents);

    for (var j = 0; j < connectedNodes.length; j++) {
        for (var i = 0; i < agents.length; i++) {
            connectedNodes = connectedNodes.concat(getConnectedNodes(agents[i], connectedNodes[j]));
            connectedNodes = connectedNodes.filter(function(item, index, inputArray) {
                return inputArray.indexOf(item) == index;
            });
        }
    }

    if (connectedNodes.length == 0)
        return false;

    for (var i = 0; i < connectedNodes.length; i++)
        if (!truthTable[subsentence][connectedNodes[i] - 1])
            return false;
    return true;
}