var graphExplorer = graphExplorer || {};
var EventBus = EventBus || {};


EventBus.addEventListener('selectNode', function (params) {
    graphExplorer.data.selectedNode = params.target.nodes[0] || null;
    EventBus.dispatch('refreshPanel');
});
EventBus.addEventListener('deselectNode', function () {
    graphExplorer.data.selectedNode = null;
    EventBus.dispatch('refreshPanel');
});
EventBus.addEventListener('refreshPanel', function () {
    $('#panel,#generalpanel').hide();
    if (graphExplorer.data.selectedNode) {
        $('#panel').show();
        let localProps = (graphExplorer.data.nodes.filter(node => node.id == graphExplorer.data.selectedNode)[0] || {}).Properties || [];
        EventBus.dispatch('refreshPanelProps', localProps);
        EventBus.dispatch('refreshPanelGraphEditor');
        EventBus.dispatch('refreshPanelCustomize');
    } else {
        $('#generalpanel').show();
    }
});

EventBus.addEventListener('refreshPanelCustomize', function (params) {
    var node = (graphExplorer.data.nodes.filter(node => node.id == graphExplorer.data.selectedNode)[0] || {});
   
    $('#customizecolor').val(node.color||'#D2E5FF');
});
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
EventBus.addEventListener('readEdge', function (e) {
    $('#myModal3').modal("show");
    var connectedNodeId = 0;
    var edgeVal = '';
    if (e.target) {
        if($(e.target.target).is('button')){
            $('#myModal3').modal("hide");
            return;
        }
        connectedNodeId = $(e.target.currentTarget).data('id').to == graphExplorer.data.selectedNode ? $(e.target.currentTarget).data('id').from : $(e.target.currentTarget).data('id').to;
        edgeVal = $(e.target.currentTarget).data('id').label || '';
        graphExplorer.data.currentEdge = e.target.currentTarget;
    }
    var siblingNodes = graphExplorer.data.nodes.filter(f => f.id != graphExplorer.data.selectedNode && f.id != graphExplorer.data.selectedNode && (f.parentId || 0) == (graphExplorer.data.parentNode || 0));
    $('#Edge').html(siblingNodes.map(e => `<option value="${e.id}" >${e.label}</option>`).reduce((a, b) => a + b, ''));
    $('#Edge').val(connectedNodeId);
    $('#EdgeValue').val(edgeVal);
});
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
EventBus.addEventListener('deleteEdge', function (e) {
    if(e.target){
        for (var i=0;i<graphExplorer.data.edges.length;i++){
            if(JSON.stringify(graphExplorer.data.edges[i])==e.target){
                graphExplorer.data.edges.splice(i,1);
                EventBus.dispatch('graphUpdated');
                return;
            }
        }
    }
});

EventBus.addEventListener('customizeNode', function (e) {
   for(var i =0;i<graphExplorer.data.nodes.length;i++){
        if(graphExplorer.data.nodes[i].id==graphExplorer.data.selectedNode){
            graphExplorer.data.nodes[i].color=   $('#customizecolor').val()||'#D2E5FF';
        }
   }
   EventBus.dispatch('graphUpdated');
});

EventBus.addEventListener('refreshPanelProps', function (params) {
    params = params.target || [];
    $('#properties').html('');
    for (var i = 0; i < params.length; i++) {
        $('#properties').append(`<tr>
            <td>${params[i].key}</td>
            <td>${params[i].value}</td>
            <td>${params[i].date}</td>
          </tr>`);
    }
});
EventBus.addEventListener('readPropperty', function (e) {
    if (!e.target) {
        return;
    }
    $('#Property').val($(e.target.currentTarget).find('td').eq(0).text());
    $('#Value').val($(e.target.currentTarget).find('td').eq(1).text());
    $('#Date').val($(e.target.currentTarget).find('td').eq(2).text());
    $('#myModal').modal("show");
    graphExplorer.data.currentProperty = e.target.currentTarget;
});
EventBus.addEventListener('addPropperty', function () {
    var props = [];
    for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
        if (graphExplorer.data.selectedNode == graphExplorer.data.nodes[i].id) {
            props = graphExplorer.data.nodes[i].Properties || [];
            var p = null;
            if (($('#Property').val() || $('#Value').val() || $('#Date').val())) {
                if (graphExplorer.data.currentProperty) {
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
    $('#myModal').modal('hide');
    $('#myModal input').val('');
    graphExplorer.data.currentProperty = null;
});
EventBus.addEventListener('openNode', function () {
    graphExplorer.data.parentNode = graphExplorer.data.selectedNode ;
    EventBus.dispatch('deselectNode');
    EventBus.dispatch('graphUpdated');
});
EventBus.addEventListener('closeNode', function () {
    if (graphExplorer.data.parentNode) {
        graphExplorer.data.parentNode = null;
        EventBus.dispatch('graphUpdated');
    }
});

EventBus.addEventListener('readNode', function () {
    $('#myModal4').modal("show");
    $('#NodeName').val(((graphExplorer.data.nodes.filter(f => f.id == graphExplorer.data.selectedNode)[0]||{}).label||''));
    EventBus.dispatch('graphUpdated');
});
EventBus.addEventListener('addNode', function (params) {
    if(graphExplorer.data.selectedNode){
        for(var i=0;i<graphExplorer.data.nodes.length;i++){
            if(graphExplorer.data.nodes[i].id==graphExplorer.data.selectedNode){
                graphExplorer.data.nodes[i].label=$('#NodeName').val();
            }
        }
    }else{
        graphExplorer.data.nodes[graphExplorer.data.nodes.length] = { id: (graphExplorer.data.nodes[graphExplorer.data.nodes.length - 1].id + 1), label: $('#NodeName').val(), parentId: graphExplorer.data.parentNode };
       
    }
    EventBus.dispatch('graphUpdated');
    $('#myModal4').modal("hide");
});
EventBus.addEventListener('removeNode', function (params) {
    graphExplorer.data.nodes = graphExplorer.data.nodes.filter(f => f.id != graphExplorer.data.selectedNode && f.parentId != graphExplorer.data.selectedNode);
    graphExplorer.data.edges = graphExplorer.data.edges.filter(f => f.from != graphExplorer.data.selectedNode && f.to != graphExplorer.data.selectedNode);
    graphExplorer.data.selectedNode = null;
    $('#myModal2').modal('hide');
    EventBus.dispatch('graphUpdated');
});

EventBus.addEventListener('modifyNode', function (params) {
    console.log('modifyNode Event:', params);
    EventBus.dispatch('graphUpdated');
});

EventBus.addEventListener('saveGraph', function () {
    if(graphExplorer.isOffline){
        localStorage.setItem('graphExplorer.data', JSON.stringify(graphExplorer.data));
        $('#updatemsg').text(`Last Saved: ${new Date().toLocaleString()}`);
    }else{
        $.ajax({
            url: graphExplorer.url,
            type: 'POST',
            data: "="+JSON.stringify(graphExplorer.data) ,
            success: function (data) {
                //do something
                if(data){
                    $('#updatemsg').text(`Last Saved: ${new Date().toLocaleString()}`);
                }
            }
        });
    }
   // 
    console.log('saveGraph Event:called');
});

EventBus.addEventListener('loadGraph', function (params) {
    console.log('loadGraph Event:', params);
    if(graphExplorer.isOffline){
        initialize(localStorage.getItem('graphExplorer.data'));
    }else{
    $.ajax({
        url: graphExplorer.url,
        type: 'GET',
        success:initialize
    });
    }
});
EventBus.addEventListener('graphUpdated', function (params) {
    var _data = JSON.parse(JSON.stringify(graphExplorer.data));
    var _tempNodes = [];
    if (graphExplorer.data.parentNode) {
        _tempNodes = _data.nodes.filter(e => e.parentId == graphExplorer.data.parentNode);
    } else {
        _tempNodes = _data.nodes.filter(e => !e.parentId);
    }
    for (var i = 0; i < _tempNodes.length; i++) {
        if (_data.nodes.map(e => e.parentId).filter(e => e).indexOf(_tempNodes[i].id) > -1) {
            _tempNodes[i].shape = 'hexagon';
        }
    }
    _data.nodes = new vis.DataSet(_tempNodes);
    _data.edges = new vis.DataSet(_data.edges.filter(e => _tempNodes.map(_d => _d.id).indexOf(e.from) != -1 && _tempNodes.map(_d => _d.id).indexOf(e.to) != -1));
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
        graphExplorer.network.setData(_data)
    }
    EventBus.dispatch('refreshPanel');
});

$(document).ready(() => {
    graphExplorer.isOffline=true;
    graphExplorer.url ='/api/Values';
    EventBus.dispatch('loadGraph');
    $('#Date').datepicker();//{format:'yyyy-mm-dd'}
    $('#properties').on('click', 'tr', (e) => EventBus.dispatch('readPropperty', e))
    $('#edges').on('click', 'tr', (e) => EventBus.dispatch('readEdge', e))
});
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function initialize(_rawData) {
    graphExplorer.container = graphExplorer.container || document.getElementById('mynetwork');
    graphExplorer.options = graphExplorer.options || {};
    //var _rawData = localStorage.getItem('graphExplorer.data');
    if (!_rawData) {
        var nodes = [
            { id: 1, label: 'Node 1' },
            { id: 2, label: 'Node 2' },
            { id: 3, label: 'Node 3' },
            { id: 4, label: 'Node 4', color: '#7BE141'},
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
            edges: edges
        };
    } else {
        _rawData = JSON.parse(_rawData);
    }
    graphExplorer.data = _rawData;
    EventBus.dispatch("graphUpdated");
}