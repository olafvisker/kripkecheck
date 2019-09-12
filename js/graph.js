var container = document.getElementById('graphCanvas');

var cbsAtoms = {
    'p': document.getElementById('p'),
    'q': document.getElementById('q'),
    'r': document.getElementById('r'),
    's': document.getElementById('s'),
    't': document.getElementById('t'),
};

var cbsAgents = {
    'a': document.getElementById('a'),
    'b': document.getElementById('b'),
    'c': document.getElementById('c'),
    'd': document.getElementById('d'),
    'e': document.getElementById('e'),
};

var nodes = new vis.DataSet([
    { id: 1, label: '1' },
    { id: 2, label: '2' },
    { id: 3, label: '3' },
    { id: 4, label: '4' },
    { id: 5, label: '5' }
]);

var edges = new vis.DataSet([
    { from: 1, to: 1, label: 'a, b' },
    { from: 1, to: 3, label: 'a' },
    { from: 1, to: 2, label: 'b' },
    { from: 2, to: 4, label: 'a, c' },
    { from: 2, to: 5, label: 'a' },
    { from: 5, to: 2, label: 'b' }
]);

var nodeAtoms = {
    1: "p, q",
    2: "¬p, q",
    3: "p, ¬q",
    4: "¬p, ¬q",
    5: "p, ¬q"
};

var data = {
    nodes: nodes,
    edges: edges
};

var options = {
    nodes: {
        borderWidth: 0,
        shape: 'circle',
        labelHighlightBold: false,
        widthConstraint: {
            minimum: 25,
            maximum: 25
        },
        font: {
            strokeWidth: 1,
            color: '#ffffff',
            strokeColor: '#ffffff'
        },
        color: {
            background: '#f6323e',
            highlight: '#f9be02',
        }
    },
    edges: {
        color: '#032a3b',
        arrowStrikethrough: false,
        width: 3,
        selectionWidth: 1,
        labelHighlightBold: false,
        arrows: {
            to: { enabled: true, scaleFactor: 0.25, type: 'arrow' },
        },
        font: {
            strokeWidth: 0,
            align: 'top',
            color: 'rgba(255, 255, 255, .9)'
        }
    },
    physics: {
        minVelocity: 0.08,
    }
};

var network = new vis.Network(container, data, options);

network.on("afterDrawing", function(ctx) {
    for (index = 0; index < nodes.length; index++) {
        var nodeId = nodes.getIds()[index];
        var nodePosition = network.getPositions([nodeId]);
        ctx.shadowColor = 'rgba(0, 0, 0, .2)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(nodeAtoms[nodeId], nodePosition[nodeId].x, nodePosition[nodeId].y + 30);
    }
});