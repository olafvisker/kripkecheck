    var addNodeMode = false;
    var addEdgeMode = false;
    var prevSelectedNodeId = null;

    document.onreadystatechange = function() {
        if (document.readyState === 'complete') {
            numberOfAtomsChanged(2);
            numberOfAgentsChanged(2);
        }
    }

    network.on("click", function(params) {
        var selectedNodeId = params["nodes"][0];
        var selectedEdgesIds = params["edges"];

        if (addNodeMode)
            addNode(params["pointer"]["canvas"]["x"], params["pointer"]["canvas"]["y"]);

        if (selectedNodeId == null)
            prevSelectedNodeId = null;
        else
            updateAtomCheckbox(selectedNodeId);

        if (selectedEdgesIds.length == 1 && network.getSelectedNodes().length == 0)
            updateAgentCheckbox(edgeLabelFromId(selectedEdgesIds[0]))

        if (addEdgeMode && prevSelectedNodeId != null && !alreadyHasRelation(prevSelectedNodeId, selectedNodeId))
            addEdge(prevSelectedNodeId, selectedNodeId);

        prevSelectedNodeId = selectedNodeId;
    });

    function addNode(x, y) {
        var newNodeId = 1;
        if (nodes.length > 0)
            var newNodeId = nodes.getIds()[nodes.length - 1] + 1;

        nodes.add({ id: newNodeId, label: String(newNodeId), x: x, y: y });
        nodeAtoms[newNodeId] = "";
        for (var k in cbsAtoms)
            if (!cbsAtoms[k].disabled)
                nodeAtoms[newNodeId] += k + ", ";
        nodeAtoms[newNodeId] = nodeAtoms[newNodeId].slice(0, -2);
    }

    function addEdge(from, to) {
        var agentString = "";
        for (var k in cbsAgents)
            if (!cbsAgents[k].disabled)
                agentString += k + ", "
        agentString = agentString.slice(0, -2);
        edges.add({ from: from, to: to, label: agentString });
    }

    function updateAtomCheckbox(selectedNodeId) {
        for (var k in cbsAtoms)
            cbsAtoms[k].checked = nodeAtoms[selectedNodeId].includes('¬' + k);
    }

    function updateAgentCheckbox(selectedEdgeLabel) {
        for (var k in cbsAgents)
            cbsAgents[k].checked = !selectedEdgeLabel.includes(k);
    }

    function changeAtom(cb) {
        var selectedNodeId = network.getSelectedNodes()[0];
        if (cb != null && selectedNodeId != null) {
            if (cb.checked)
                nodeAtoms[selectedNodeId] = nodeAtoms[selectedNodeId].replace(cb.id, "¬" + cb.id);
            else
                nodeAtoms[selectedNodeId] = nodeAtoms[selectedNodeId].replace("¬" + cb.id, cb.id);
            network.redraw();
        }
    }

    function changeAgent() {
        var selectedEdgesIds = network.getSelectedEdges();
        var agentString = "";

        if (selectedEdgesIds.length == 1 && network.getSelectedNodes().length == 0) {
            for (var k in cbsAgents)
                if (!cbsAgents[k].checked && !cbsAgents[k].disabled)
                    agentString += k + ", "

            agentString = agentString.slice(0, -2);
            if (agentString.length > 0)
                edges.update({ id: selectedEdgesIds[0], label: agentString });
            else
                network.deleteSelected();
        }
    }

    function numberOfAtomsChanged(value) {
        for (var i = 0; i < value; i++) {
            var cb = cbsAtoms[Object.keys(cbsAtoms)[i]];
            cb.disabled = false;
            cb.parentElement.style.opacity = 1;

            for (var j = 0; j < nodes.length; j++) {
                if (!nodeAtoms[nodes.getIds()[j]].includes(cb.id))
                    nodeAtoms[nodes.getIds()[j]] += ", " + cb.id;
            }
        }

        for (var i = value; i < Object.keys(cbsAtoms).length; i++) {
            var cb = cbsAtoms[Object.keys(cbsAtoms)[i]];
            cb.disabled = true;
            cb.parentElement.style.opacity = .25;

            for (var j = 0; j < nodes.length; j++) {
                if (nodeAtoms[nodes.getIds()[j]].includes("¬" + cb.id))
                    nodeAtoms[nodes.getIds()[j]] = nodeAtoms[nodes.getIds()[j]].replace(", ¬" + cb.id, "");
                if (nodeAtoms[nodes.getIds()[j]].includes(cb.id))
                    nodeAtoms[nodes.getIds()[j]] = nodeAtoms[nodes.getIds()[j]].replace(", " + cb.id, "");
            }
        }

        network.redraw();
    }

    function numberOfAgentsChanged(value) {
        for (var i = 0; i < value; i++) {
            var cb = cbsAgents[Object.keys(cbsAgents)[i]];
            cb.disabled = false;
            cb.parentElement.style.opacity = 1;
        }

        for (var i = value; i < Object.keys(cbsAgents).length; i++) {
            var cb = cbsAgents[Object.keys(cbsAgents)[i]];
            cb.disabled = true;
            cb.parentElement.style.opacity = .25;
            cb.checked = true;

            for (var j = 0; j < edges.length; j++) {
                var edgeId = edges.getIds()[j];
                var label = edgeLabelFromId(edgeId).trim().replace(cb.id, "").trim().replace(/,+$/, "");;
                edges.update({ id: edgeId, label: label });
            }
        }

        network.redraw();
    }

    function alreadyHasRelation(from, to) {
        relations = edges.get({ fields: ['from', 'to'] });
        for (var i = 0; i < relations.length; i++) {
            if (relations[i]["from"] == from && relations[i]["to"] == to)
                return true;
        }
        return false;
    }

    document.onkeydown = function(evt) {
        evt = evt || window.event;
        addNodeMode = (evt.which || evt.keyCode) == 16;
        addEdgeMode = (evt.which || evt.keyCode) == 17;

        if ((evt.which || evt.keyCode) == 46) {
            var selectedNodeId = network.getSelectedNodes()[0];
            if (selectedNodeId != null)
                delete nodeAtoms[selectedNodeId];
            network.deleteSelected();
        }
    };

    document.onkeyup = function(evt) {
        evt = evt || window.event;
        addNodeMode = false;
        addEdgeMode = false;
    };

    document.getElementById('proveTxt').onkeypress = function(e) {
        var event = e || window.event;
        var charCode = event.which || event.keyCode;

        if (charCode == '13') {
            prove();
            return false;
        }
    }

    function autoCorrect(txt) {
        var position = txt.selectionStart;
        txt.value = txt.value.replace(/~|!/, "¬");
        txt.value = txt.value.replace(/\^|&/, "∧");
        txt.value = txt.value.replace(/v|\|/, "∨");
        txt.value = txt.value.replace(/>/, "→");
        txt.value = txt.value.replace(/=/, "↔");
        txt.value = txt.value.replace(/T/, "⊤");
        txt.value = txt.value.replace(/F/, "⊥");
        txt.selectionEnd = position;
    }