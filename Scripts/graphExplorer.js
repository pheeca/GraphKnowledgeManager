var graphExplorer = graphExplorer || {};
var EventBus = EventBus || {};
var AppConfig = AppConfig || {};
var utilities = utilities || {};
graphExplorer.ctx = graphExplorer.ctx || {};

graphExplorer.graphConfig = {
    defaultNodeColor: '#97c2fc',
    searchtag: '#searchtag',
    tagContextGlobal: '#tagContextGlobal',
    changeparent: '#changeparent',
    linkNodes: '#linkNodes',
    modal: {
        property: '#myModal'
    }
};

EventBus.removeEventListener('selectNode');
EventBus.addEventListener('selectNode', function (params) {
    graphExplorer.data.selectedNode = params.target.nodes[0] || null;
    if (graphExplorer.onlyNeighbour) {
        console.log("selectNode", graphExplorer.data.selectedNode);
        EventBus.dispatch('graphUpdated');
    }
    EventBus.dispatch('refreshPanel');
});

EventBus.removeEventListener('deselectNode');
EventBus.addEventListener('deselectNode', function () {
    graphExplorer.data.selectedNode = null;
    graphExplorer.data.currentProperty = null;
    if (graphExplorer.onlyNeighbour) {
        setTimeout(() => {
            if (!graphExplorer.data.selectedNode) {
                EventBus.dispatch('graphUpdated');
            }
        }, 100)
    } else {
        EventBus.dispatch('refreshPanel');
    }
});

EventBus.removeEventListener('refreshPanel');
EventBus.addEventListener('refreshPanel', function () {
    $('#panel,#generalpanel').hide();
    if (graphExplorer.data.selectedNode) {
        $('#panel').show();
        let localProps = (graphExplorer.data.nodes.filter(node => node.id == graphExplorer.data.selectedNode)[0] || {}).Properties || [];
        EventBus.dispatch('refreshPanelProps', localProps);
        EventBus.dispatch('refreshPanelGraphEditor');
        EventBus.dispatch('refreshPanelCustomize');
        EventBus.dispatch('refreshPanelAdvanceAction');
    } else {
        $('#generalpanel').show();
    }
});

EventBus.removeEventListener('refreshPanelAdvanceAction');
EventBus.addEventListener('refreshPanelAdvanceAction', function (params) {
    var _node = (graphExplorer.data.nodes.filter(node => node.id == graphExplorer.data.selectedNode)[0] || {});
    //for async, taking over half second on 1k nodes
    var optionNodes = graphExplorer.data.nodes;
    var _html = `<option value="">Select</option>` + optionNodes.map(e => createOption(e)).reduce((a, b) => a + b, '');
    $(graphExplorer.graphConfig.changeparent).html(_html);
    $(graphExplorer.graphConfig.changeparent).val(_node.parentId);
    document.querySelector(graphExplorer.graphConfig.changeparent).fstdropdown.rebind();
    $(graphExplorer.graphConfig.linkNodes).html(_html);
    var linkedNodes = optionNodes.filter(o => o.nodeUnit == _node.nodeUnit && _node.nodeUnit && o.id != graphExplorer.data.selectedNode);
    var linkedNodesid = linkedNodes.map(e => e.id)[0] || '';
    $(graphExplorer.graphConfig.linkNodes).val(linkedNodesid);
    document.querySelector(graphExplorer.graphConfig.linkNodes).fstdropdown.rebind();
    $('#linkNodesInfo').html('');
    $('#deleteLinkNode').hide();
    if(_node.nodeUnit){
        $('#deleteLinkNode').show();
    }
    if (linkedNodes.length > 0) {
        linkedNodes.forEach(function (_linkedNode) {
            var parent = optionNodes.filter(f => f.id == _linkedNode.parentId)[0] || {};
            let linkedHtml =`<tr data-id='${JSON.stringify(_linkedNode)}'>
            <td>${_linkedNode.label || ''}</td>
            <td>${parent.label || ''}</td>
            <td>${_linkedNode.nodeUnit || ''}</td>
            <td> <button type="button" class="mb-1 btn btn-warning" onclick='EventBus.dispatch("redirectNode",JSON.stringify(${JSON.stringify(_linkedNode)}))'>Redirect</button>
            <button type="button" class="mb-1 btn btn-warning" onclick='EventBus.dispatch("deleteLinkNode",JSON.stringify(${JSON.stringify(_linkedNode)}))'>Delete Link</button>
            </td>
          </tr>`;
            $('#linkNodesInfo').append(linkedHtml);
        });
    }
    var linkUrl = location.origin + '/#' + AppConfig.GraphUrl + '/' + sessionStorage.getItem("UserSchemaId") + '/' + graphExplorer.data.selectedNode;
    linkUrl += '/' + window.btoa(linkUrl);
    $('#sharelink').val(linkUrl);


});

EventBus.removeEventListener('refreshPanelCustomize');
EventBus.addEventListener('refreshPanelCustomize', function (params) {
    var node = (graphExplorer.data.nodes.filter(node => node.id == graphExplorer.data.selectedNode)[0] || {});
    //Reference:https://www.jqueryscript.net/form/Bootstrap-4-Tag-Input-Plugin-jQuery.html
    var tagsTextbox = $('#tags').tagsinput()[$('#tags').tagsinput().length - 1];
    tagsTextbox.removeAll();
    tagsTextbox.add((node.tags || []).toString());
    $('#customizecolor').val(node.color || graphExplorer.graphConfig.defaultNodeColor);
});

EventBus.removeEventListener('refreshPanelGraphEditor');
EventBus.addEventListener('refreshPanelGraphEditor', function (params) {
    var _edges = graphExplorer.data.edges.filter(e => e.to == graphExplorer.data.selectedNode || e.from == graphExplorer.data.selectedNode);
    $('#edges').html('');
    for (var i = 0; i < _edges.length; i++) {
        var connectedNodeId = _edges[i].to == graphExplorer.data.selectedNode ? _edges[i].from : _edges[i].to;
        $('#edges').append(`<tr data-id='${JSON.stringify(_edges[i])}'>
            <td>${_edges[i].label || ''}</td>
            <td>${(graphExplorer.data.nodes.filter(e => e.id == connectedNodeId)[0] || {}).label || ''}</td>
            <td> <button type="button" class="btn btn-danger" onclick=EventBus.dispatch("deleteEdge",'${JSON.stringify(_edges[i])}')>Delete</button></td>
          </tr>`);
    }
});

EventBus.removeEventListener('readEdge');
EventBus.addEventListener('readEdge', function (e) {

    $('#myModal3').modal("show");
    var connectedNodeId = 0;
    var edgeVal = '';
    if (e.target) {
        if ($(e.target.target).is('button')) {
            $('#myModal3').modal("hide");
            return;
        }
        connectedNodeId = $(e.target.currentTarget).data('id').to == graphExplorer.data.selectedNode ? $(e.target.currentTarget).data('id').from : $(e.target.currentTarget).data('id').to;
        edgeVal = $(e.target.currentTarget).data('id').label || '';
        graphExplorer.data.currentEdge = e.target.currentTarget;
    }
    var siblingNodes = graphExplorer.data.nodes.filter(f => f.id != graphExplorer.data.selectedNode && f.id != graphExplorer.data.selectedNode && (f.parentId || 0) == (graphExplorer.data.parentNode || 0));
    $('#Edge').html(siblingNodes.map(e => createOptionToSiblings(e, siblingNodes)).reduce((a, b) => a + b, ''));
    $('#Edge').val(connectedNodeId);
    $('#EdgeValue').val(edgeVal);
    document.querySelector("#Edge").fstdropdown.rebind();
    //let siblingNodeIds = siblingNodes.map(e => e.id);
    //let edgeValueHelper = graphExplorer.data.edges.filter(e => siblingNodeIds.indexOf(e.from) > -1 || siblingNodeIds.indexOf(e.to) > -1).map(e => e.label).filter((v, i, a) => a.indexOf(v) === i);

    // $("#EdgeValue").autocomplete({
    //     source: edgeValueHelper
    // });
});


EventBus.removeEventListener('addEdge');
EventBus.addEventListener('addEdge', function (e) {
    if (!graphExplorer.data.currentEdge) {
        graphExplorer.data.edges[graphExplorer.data.edges.length] = { id: uuidv4(), to: graphExplorer.data.selectedNode, from: parseInt($('#Edge').val()), label: $('#EdgeValue').val() };
    } else {
        var oldEdgeJSON = JSON.stringify($(graphExplorer.data.currentEdge).data('id'));
        for (var i = 0; i < graphExplorer.data.edges.length; i++) {
            if (JSON.stringify(graphExplorer.data.edges[i]) == oldEdgeJSON) {
                var edge = graphExplorer.data.edges[i];
                if (($('#Edge').val() || $('#EdgeValue').val())) {
                    if (graphExplorer.data.currentEdge) {
                        if (edge.to == graphExplorer.data.selectedNode) {
                            edge.from = parseInt($('#Edge').val());
                        } else {
                            edge.to = parseInt($('#Edge').val());
                        }
                        edge.label = $('#EdgeValue').val();
                    }
                }
                graphExplorer.data.edges[i] = edge;
            }
        }
    }
    $('#myModal3').modal('hide');
    $('#myModal3 input').val('');
    graphExplorer.data.currentEdge = null;
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('deleteEdge');
EventBus.addEventListener('deleteEdge', function (e) {
    if (e.target) {
        for (var i = 0; i < graphExplorer.data.edges.length; i++) {
            if (JSON.stringify(graphExplorer.data.edges[i]) == e.target) {
                graphExplorer.data.edges.splice(i, 1);
                EventBus.dispatch('graphUpdated');
                return;
            }
        }
    }
});

EventBus.removeEventListener('customizeNode');
EventBus.addEventListener('customizeNode', function (e) {
    for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
        if (graphExplorer.data.nodes[i].id == graphExplorer.data.selectedNode) {

            graphExplorer.data.nodes[i].color = $('#customizecolor').val() || graphExplorer.graphConfig.defaultNodeColor;
            graphExplorer.data.nodes[i].tags = $('#tags').val().split(',');

        }
    }
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('refreshPanelProps');
EventBus.addEventListener('refreshPanelProps', function (params) {
    params = params.target || [];
    $('#properties').html('');
    for (var i = 0; i < params.length; i++) {
        let potentialUrl=(params[i].value||'').split('/');
        potentialUrl=(potentialUrl.pop()||potentialUrl.pop()).split('?')[0];
        potentialUrl=potentialUrl.replace(/_|-/g, " ");
        $('#properties').append(`<tr>
            <td>${params[i].key}</td>
            <td data-val="${params[i].value}">${utilities.validateURL(params[i].value)?`<a  target="_blank" href="${params[i].value}">${potentialUrl}</a>`:params[i].value}</td>
            <td>${params[i].date}</td>
          </tr>`);
    }
});

EventBus.removeEventListener('readPropperty');
EventBus.addEventListener('readPropperty', function (e) {
    if (!e.target || e.target.target.nodeName=='A') {
        return;
    }
    $('#Property').val($(e.target.currentTarget).find('td').eq(0).text());
    $('#Value').val($(e.target.currentTarget).find('td').eq(1).data('val'));
    $('#Date').val($(e.target.currentTarget).find('td').eq(2).text());
    $(graphExplorer.graphConfig.modal.property).modal("show");
    graphExplorer.data.currentProperty = e.target.currentTarget;
});

EventBus.removeEventListener('addPropperty');
EventBus.addEventListener('addPropperty', function () {

    var props = [];
    for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
        if (graphExplorer.data.selectedNode == graphExplorer.data.nodes[i].id) {

            props = graphExplorer.data.nodes[i].Properties || [];
            var p = null;
            if (($('#Property').val() || $('#Value').val() || $('#Date').val())) {
                if (graphExplorer.data.currentProperty && props[$(graphExplorer.data.currentProperty).prevAll().length]) {
                    props[$(graphExplorer.data.currentProperty).prevAll().length].key = $('#Property').val() || '';
                    props[$(graphExplorer.data.currentProperty).prevAll().length].value = $('#Value').val() || '';
                    props[$(graphExplorer.data.currentProperty).prevAll().length].date = $('#Date').val() || '';
                } else {
                    p = { key: $('#Property').val() || '', value: $('#Value').val() || '', date: $('#Date').val() || '' };
                    props.push(p);
                }
            }
            graphExplorer.data.nodes[i].Properties = props;
        }
    }
    EventBus.dispatch('refreshPanelProps', props);
    $(graphExplorer.graphConfig.modal.property).modal('hide');
    $(graphExplorer.graphConfig.modal.property + ' input').val('');
    graphExplorer.data.currentProperty = null;
});


EventBus.removeEventListener('openNode');
EventBus.addEventListener('openNode', function () {
    graphExplorer.data.parentNode = graphExplorer.data.selectedNode;
    EventBus.dispatch('deselectNode');
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('closeNode');
EventBus.addEventListener('closeNode', function () {
    var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));
    if (graphExplorer.data.parentNode && routeParams.NodeId != graphExplorer.data.parentNode) {
        graphExplorer.data.parentNode = ((graphExplorer.data.nodes.filter(e => e.id == graphExplorer.data.parentNode)[0] || {}).parentId || null);

        EventBus.dispatch('graphUpdated');
    }
});


EventBus.removeEventListener('readNode');
EventBus.addEventListener('readNode', function () {
    $('#myModal4').modal("show");
    $('#NodeName').val(((graphExplorer.data.nodes.filter(f => f.id == graphExplorer.data.selectedNode)[0] || {}).label || ''));
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('addNode');
EventBus.addEventListener('addNode', function (params) {
    if (graphExplorer.data.selectedNode) {
        for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
            if (graphExplorer.data.nodes[i].id == graphExplorer.data.selectedNode) {
                graphExplorer.data.nodes[i].label = $('#NodeName').val();
            }
        }
    } else {
        graphExplorer.data.nodes[graphExplorer.data.nodes.length] = { id: (graphExplorer.data.nodes[graphExplorer.data.nodes.length - 1].id + 1), label: $('#NodeName').val(), parentId: graphExplorer.data.parentNode };

    }
    EventBus.dispatch('graphUpdated');
    $('#myModal4').modal("hide");
});

EventBus.removeEventListener('removeNode');
EventBus.addEventListener('removeNode', function (params) {
    graphExplorer.data.nodes = graphExplorer.data.nodes.filter(f => f.id != graphExplorer.data.selectedNode && f.parentId != graphExplorer.data.selectedNode);
    graphExplorer.data.edges = graphExplorer.data.edges.filter(f => f.from != graphExplorer.data.selectedNode && f.to != graphExplorer.data.selectedNode);
    graphExplorer.data.selectedNode = null;
    $('#myModal2').modal('hide');
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('modifyNode');
EventBus.addEventListener('modifyNode', function (params) {
    console.log('modifyNode Event:', params);
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('saveGraph');
EventBus.addEventListener('saveGraph', function () {
    if (graphExplorer.isOffline) {
        localStorage.setItem('graphExplorer.data', JSON.stringify(graphExplorer.data));
        $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);
    } else {
        var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));
        if (!routeParams.UserSchemaId || window.btoa(location.href.substring(0, location.href.lastIndexOf('/'))) == routeParams.key) {
            $.ajax({
                url: graphExplorer.url,
                type: 'POST',
                data: {
                    SchemaInfo:JSON.stringify(graphExplorer.data),
                    ModifiedBy:sessionStorage.getItem("UserId")
                },
                success: function (data) {
                    //do something
                    if (data) {
                        $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);
                    }
                }
            });
        }
    }
    // 
    console.log('saveGraph Event:called');
});

EventBus.removeEventListener('loadGraph');
EventBus.addEventListener('loadGraph', function (params) {
    var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));
    console.log('loadGraph Event:', params, routeParams);
    if (graphExplorer.isOffline) {
        initialize(localStorage.getItem('graphExplorer.data'));
    } else {
        if (!routeParams.UserSchemaId || window.btoa(location.href.substring(0, location.href.lastIndexOf('/'))) == routeParams.key) {
            $.ajax({
                url: graphExplorer.url,
                type: 'GET',
                success: initialize
            });
        }
    }
});
function getCurrentNodes(_data) {

    var tagFilter = $(graphExplorer.graphConfig.searchtag).val() || null;
    var tagContextGlobal = $(graphExplorer.graphConfig.tagContextGlobal).is(':checked');

    var _tempNodes = [];
    if (!tagContextGlobal) {

        if (graphExplorer.data.parentNode) {
            _tempNodes = _data.nodes.filter(e => e.parentId == graphExplorer.data.parentNode && ValidateNeighbouringNode(e, _data));
        } else {
            _tempNodes = _data.nodes.filter(e => !e.parentId && ValidateNeighbouringNode(e, _data));
        }
    } else {
        _tempNodes = _data.nodes;
    }
    if (tagFilter) {
        _tempNodes = _tempNodes.filter(e => (e.tags || []).filter(t => t.indexOf(tagFilter) > -1).length > 0);
    }
    for (var i = 0; i < _tempNodes.length; i++) {
        if (_data.nodes.map(e => e.parentId).filter(e => e).indexOf(_tempNodes[i].id) > -1) {
            _tempNodes[i].shape = 'hexagon';
        }
    }
    return _tempNodes;
}
function ValidateNeighbouringNode(node, _data) {
    if (graphExplorer.onlyNeighbour && graphExplorer.data.selectedNode) {
        let l = _data.edges.filter(e => (e.from == node.id || e.to == node.id) && (e.from == graphExplorer.data.selectedNode || e.to == graphExplorer.data.selectedNode)).length;
        return l > 0;
    } else {
        return true
    }
}
function hashCode(text) {
    var hash = 0, i, chr;
    if (text.length === 0) return hash;
    for (i = 0; i < text.length; i++) {
        chr = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
var graphHash = null;

EventBus.removeEventListener('changeparent');
EventBus.addEventListener('changeparent', function (params) {
    debugger
    var parentId = parseInt($(graphExplorer.graphConfig.changeparent).val());

    graphExplorer.data.nodes.forEach(function (item) {
        if (item.id == graphExplorer.data.selectedNode) {
            if (item.parentId) {
                item.parentId = parentId;
                EventBus.dispatch("deselectNode");
                EventBus.dispatch('graphUpdated');
            } else {
                alert('parent can not change of root nodes')
            }
        }
    });
});

EventBus.removeEventListener('linkNode');
EventBus.addEventListener('linkNode', function (params) {
    var item = graphExplorer.data.nodes.filter(item => item.id == graphExplorer.data.selectedNode)[0];
    var linkId = parseInt($(graphExplorer.graphConfig.linkNodes).val());
    var linkedNode = graphExplorer.data.nodes.filter(e => e.id == linkId)[0];
    var expectedNodeUnit = (linkedNode || {}).nodeUnit || item.nodeUnit || uuidv4();
    graphExplorer.data.nodes.forEach(function (_node) {
        if (!linkedNode && _node.id == item.id) {
            _node.nodeUnit = null;
        }
        if (linkedNode && (_node.nodeUnit && (_node.nodeUnit == linkedNode.nodeUnit || _node.nodeUnit == item.nodeUnit)) || _node.id == item.id || _node.id == linkId) {
            _node.nodeUnit = expectedNodeUnit;
        }
    });
    EventBus.dispatch('refreshPanelAdvanceAction');
});

EventBus.removeEventListener('graphUpdated');
EventBus.addEventListener('graphUpdated', function (params) {

    var _data = JSON.parse(JSON.stringify(graphExplorer.data));
    var _tempNodes = getCurrentNodes(_data);
    _data.nodes = new vis.DataSet(_tempNodes);
    _data.edges = new vis.DataSet(_data.edges.filter(e => _tempNodes.map(_d => _d.id).indexOf(e.from) != -1 && _tempNodes.map(_d => _d.id).indexOf(e.to) != -1));
    let currentHash = null;


    if (!graphExplorer.network) {
        graphExplorer.network = new vis.Network(graphExplorer.container, _data, graphExplorer.options);

        graphExplorer.network.on("selectNode", function (params) {
            EventBus.dispatch("selectNode", params);
        });
        graphExplorer.network.on("deselectNode", function (params) {
            EventBus.dispatch("deselectNode", params);
        });
        graphExplorer.network.on("doubleClick", function (params) {
            EventBus.dispatch('openNode');
        });
    } else {
        var tagFilter = $(graphExplorer.graphConfig.searchtag).val() || '';
        var tagContextGlobal = $(graphExplorer.graphConfig.tagContextGlobal).is(':checked');
        currentHash = hashCode(JSON.stringify(graphExplorer.data) + tagFilter + tagContextGlobal);
        if (currentHash != graphHash) {
            graphExplorer.network.setData(_data);
            if (graphExplorer.data.selectedNode) {
                graphExplorer.network.selectNodes([graphExplorer.data.selectedNode]);
            }
        }
    }
    graphHash = currentHash;
    EventBus.dispatch('refreshPanel');
});

EventBus.removeEventListener('onlyNeighbourToggle');
EventBus.addEventListener('onlyNeighbourToggle', function () {
    graphExplorer.onlyNeighbour = !graphExplorer.onlyNeighbour;
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('onGraphEnabled');
EventBus.addEventListener('onGraphEnabled', function (params) {
    EventBus.removeEventListener('onGraphEnabled');

    setFstDropdown();
    graphExplorer.isOffline = false;
    var UserSchemaId = sessionStorage.getItem("UserSchemaId");
    var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));

    if (!UserSchemaId || (routeParams.UserSchemaId && window.btoa(location.href.substring(0, location.href.lastIndexOf('/'))) != routeParams.key)) {
        EventBus.dispatch('UI.Web.App.Redirect', "/login");
        return;
    }
    graphExplorer.url = AppConfig.domain + '/api/Values/' + UserSchemaId;
    EventBus.dispatch('loadGraph');
    $('#Date').datepicker();//{format:'yyyy-mm-dd'}
    $('#properties').on('click', 'tr', (e) => EventBus.dispatch('readPropperty', e))
    $('#edges').on('click', 'tr', (e) => EventBus.dispatch('readEdge', e))
    $('#neighbouringNodesSwitch').on('change', (e) => EventBus.dispatch('onlyNeighbourToggle', e));
    $(graphExplorer.graphConfig.searchtag + ',' + graphExplorer.graphConfig.tagContextGlobal).on('change', (e) => EventBus.dispatch('graphUpdated', e));
    $('#properties').on('click', 'tr', (e) => EventBus.dispatch('readPropperty', e));
    $(graphExplorer.graphConfig.changeparent).on('change', (e) => EventBus.dispatch('changeparent'));
    $(graphExplorer.graphConfig.linkNodes).on('change', (e) => EventBus.dispatch('linkNode'));
    $('#sharelinkbtn').on('click', function () {
        $('#sharelink').select();
        document.execCommand("copy");
        $('#sharelinkbtn').tooltip({
            trigger: 'click',
            placement: 'bottom'
        });
        setTooltip('Copied!');
        setTimeout(hideTooltip, 1000);
        function setTooltip(message) {
            $('#sharelinkbtn').tooltip('hide')
                .attr('data-original-title', message)
                .tooltip('show');
        }

        function hideTooltip() {
            setTimeout(function () {
                $('#sharelinkbtn').tooltip('hide');
            }, 1000);
        }
    })
    // $('#customize input').on('change',(e) => {
    //     if($('#customizecolor').val()){
    //         EventBus.dispatch('customizeNode')
    //     }

    // });
});

EventBus.removeEventListener('redirectNode');
EventBus.addEventListener('redirectNode', function (params) {

    graphExplorer.data.parentNode = JSON.parse(params.target).parentId || null;
    graphExplorer.data.selectedNode = JSON.parse(params.target).id;
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('deleteLinkNode');
EventBus.addEventListener('deleteLinkNode', function (params) {
    graphExplorer.data.nodes.forEach((node) => {
        if (!params.target && node.id == graphExplorer.data.selectedNode) {
            debugger
            node.nodeUnit = null;
        } else if (params.target && node.id == JSON.parse(params.target).id) {
            node.nodeUnit = null;
        }
    });
    EventBus.dispatch('refreshPanel');
});


function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function initialize(_rawData) {
    graphExplorer.container = graphExplorer.container || document.getElementById('mynetwork');
    graphExplorer.options = graphExplorer.options || {
        autoResize: true,
        interaction: {
            navigationButtons: true,
            keyboard: true
        },
        physics: {
            stabilization: {
                iterations: 10
            }
        }
    };

    //var _rawData = localStorage.getItem('graphExplorer.data');

    if (!_rawData) {


        // create an array with nodeUnit
        var nodeUnits = [uuidv4()];

        var nodes = [
            { id: 1, label: 'Node 1', "color": graphExplorer.graphConfig.defaultNodeColor, tags: ['a', 'b'], nodeUnit: nodeUnits[0] },
            { id: 2, label: 'Node 2' },
            { id: 3, label: 'Node 3' },
            { id: 4, label: 'Node 4', color: '#7BE141' },
            { id: 5, label: 'Node 5' },
            { id: 6, label: 'Node 6', parentId: 4 }
        ];

        // create an array with edges
        var edges = [
            { id: uuidv4(), from: 1, to: 3, label: 'abc' },
            { id: uuidv4(), from: 1, to: 2 },
            { id: uuidv4(), from: 2, to: 4 },
            { id: uuidv4(), from: 2, to: 5 },
            { id: uuidv4(), from: 3, to: 3 }
        ];


        _rawData = {
            nodes: nodes,
            edges: edges,
            nodeUnits: nodeUnits
        };
    } else {
        _rawData = JSON.parse(_rawData);
    }
    graphExplorer.data = _rawData;
    var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));
    graphExplorer.data.parentNode = routeParams.NodeId || graphExplorer.data.parentNode || null;
    EventBus.dispatch("graphUpdated");
}

EventBus.removeEventListener('Undo');
EventBus.addEventListener('Undo',()=>graphExplorer.ctx.History('Undo'));

EventBus.removeEventListener('Redo');
EventBus.addEventListener('Redo',()=>graphExplorer.ctx.History('Redo'));

graphExplorer.ctx.History =function(mode) {
    $.ajax({
        url: graphExplorer.url + "?mode="+mode,
        type: 'PUT',
        data: {
            ModifiedBy: sessionStorage.getItem("UserId")
        },
        success: function (_rawData) {
            //do something
            if (_rawData) {
                try{

                    graphExplorer.data = JSON.parse(_rawData);
                    EventBus.dispatch("graphUpdated");
                    $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);

                }catch(e){
                    console.log(e,_rawData);
                    alert(_rawData);
                }
            }
        }
    });
}
function createOptionToSiblings(e, siblingNodes) {
    let extralabel = '';
    if (e && siblingNodes.map(s => s.label || '').filter(s => s.toLowerCase() == (e.label || '').toLocaleLowerCase()).length > 1) {
        let edges = graphExplorer.data.edges.filter(ed => ed.to == e.id || ed.from == e.id);
        let toedges = edges.filter(ed => ed.to == e.id);
        let fromedges = edges.filter(ed => ed.from == e.id);

        try {

            if (toedges.length > 0) {
                let edgeNode = graphExplorer.data.nodes.filter(f => f.id == toedges[0].from)[0];
                if (edgeNode) {
                    extralabel = " (" + toedges[0].label + ' - ' + edgeNode.label + ")";
                } else {
                    console.log('missing node ', toedges[0]);
                }
            } else if (fromedges.length > 0) {
                let edgeNode = graphExplorer.data.nodes.filter(f => f.id == fromedges[0].to)[0];
                if (edgeNode) {
                    extralabel = " (" + fromedges[0].label + ' - ' + edgeNode.label + ")";
                } else {
                    console.log('missing node ', fromedges[0]);
                }
            }
        } catch (e) {
            console.log(e, siblingNodes.map(s => s.label));
            console.log(toedges, fromedges, 1);
        }
    }
    return `<option value="${e.id}" >${e.label}${extralabel}</option>`;
}

function createOption(e) {
    let extralabel = '';
    if (e && e.id) {
        try {
            let edgeNode = graphExplorer.data.nodes.filter(f => f.id == e.parentId)[0];
            if (edgeNode) {
                extralabel = " (" + edgeNode.label + (e.nodeUnit ? ('|' + e.nodeUnit) : '') + ")";
            }
        } catch (e) {
            console.log(e);
        }
    }
    return `<option value="${e.id}" >${e.label}${extralabel}</option>`;
}
$(graphExplorer.graphConfig.modal.property).on('hidden.bs.modal', function () {
    graphExplorer.data.currentProperty = null;
    EventBus.dispatch('refreshPanel');
});