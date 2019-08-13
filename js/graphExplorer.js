var graphExplorer = graphExplorer || {};
var EventBus = EventBus || {};


    EventBus.addEventListener('selectNode', function(params) {
        graphExplorer.data.selectedNode=params.target.nodes[0]||null;
        EventBus.dispatch('refreshPanel');
    });
    EventBus.addEventListener('deselectNode', function() {
        graphExplorer.data.selectedNode=null;
        EventBus.dispatch('refreshPanel');
    });
    EventBus.addEventListener('refreshPanel', function() {
        $('#panel,#generalpanel').hide();
        if(graphExplorer.data.selectedNode){
            $('#panel').show();
            let localProps=(graphExplorer.data.nodes.filter(node=>node.id==graphExplorer.data.selectedNode)[0]||{}).Properties||[];
            EventBus.dispatch('refreshPanelProps',localProps);
        }else{
            $('#generalpanel').show();
        }
    });
    EventBus.addEventListener('refreshPanelProps', function(params) {
        params=params.target||[];
        $('#properties').html('');
        for(var i=0;i<params.length;i++){
            $('#properties').append(`<tr>
            <td>${params[i].key}</td>
            <td>${params[i].value}</td>
            <td>${params[i].date}</td>
          </tr>`);
        }
    });
    EventBus.addEventListener('readPropperty', function(e) {
        if(!e.target){
            return;
        }
        $('#Property').val($(e.target.currentTarget).find('td').eq(0).text());
        $('#Value').val($(e.target.currentTarget).find('td').eq(1).text());
        $('#Date').val($(e.target.currentTarget).find('td').eq(2).text());
        $('#myModal').modal("show");
        graphExplorer.data.currentProperty=e.target.currentTarget;
    });
    EventBus.addEventListener('addPropperty', function() {
        var props=[];
        for(var i=0;i<graphExplorer.data.nodes.length;i++){
            if(graphExplorer.data.selectedNode==graphExplorer.data.nodes[i].id){
                props=graphExplorer.data.nodes[i].Properties||[];
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
        EventBus.dispatch('refreshPanelProps',props);
        $('#myModal').modal('hide');
        $('#myModal input').val('');
        graphExplorer.data.currentProperty=null;
    });
    EventBus.addEventListener('openNode', function() {
        graphExplorer.data.parentNode=graphExplorer.data.selectedNode;
        EventBus.dispatch('deselectNode');
        EventBus.dispatch('graphUpdated');
    });
    EventBus.addEventListener('closeNode', function() {
        if(graphExplorer.data.parentNode){
            graphExplorer.data.parentNode=null;
            EventBus.dispatch('graphUpdated');
        }
    });
    
    EventBus.addEventListener('addNode', function(params) {
        console.log('addNode Event:', params);
        EventBus.dispatch('graphUpdated');
    });
    EventBus.addEventListener('removeNode', function(params) {
        graphExplorer.data.nodes=graphExplorer.data.nodes.filter(f=>f.id != graphExplorer.data.selectedNode && f.parentId != graphExplorer.data.selectedNode);
        graphExplorer.data.edges=graphExplorer.data.edges.filter(f=>f.from != graphExplorer.data.selectedNode && f.to != graphExplorer.data.selectedNode);
        graphExplorer.data.selectedNode=null;
        $('#myModal2').modal('hide');
        EventBus.dispatch('graphUpdated');
    });
    
    EventBus.addEventListener('modifyNode', function(params) {
        console.log('modifyNode Event:', params);
        EventBus.dispatch('graphUpdated');
    });

    EventBus.addEventListener('saveGraph', function() {

        localStorage.setItem('graphExplorer.data',JSON.stringify(graphExplorer.data));
        console.log('saveGraph Event:called');
    });
    
    EventBus.addEventListener('loadGraph', function(params) {
        console.log('loadGraph Event:', params);
        graphExplorer.container = graphExplorer.container||document.getElementById('mynetwork');
        graphExplorer.options = graphExplorer.options||{};
        var _rawData=localStorage.getItem('graphExplorer.data');
        if(!_rawData){
            var nodes = [
                {id: 1, label: 'Node 1'},
                {id: 2, label: 'Node 2'},
                {id: 3, label: 'Node 3'},
                {id: 4, label: 'Node 4'},
                {id: 5, label: 'Node 5'},
                {id: 6, label: 'Node 6', parentId:4 }
              ];
            
              // create an array with edges
              var edges = [
                {from: 1, to: 3, label:'abc'},
                {from: 1, to: 2},
                {from: 2, to: 4},
                {from: 2, to: 5},
                {from: 3, to: 3}
              ];
            _rawData={
                nodes: nodes,
                edges: edges
              };
        }else{
            _rawData=JSON.parse(_rawData);
        }
        graphExplorer.data=_rawData;
        EventBus.dispatch("graphUpdated");
    });
    EventBus.addEventListener('graphUpdated', function(params) {
        var _data=JSON.parse(JSON.stringify(graphExplorer.data));
        var _tempNodes=[];
        if(graphExplorer.data.parentNode){
            _tempNodes=_data.nodes.filter(e=>e.parentId==graphExplorer.data.parentNode);
        }else{
            _tempNodes=_data.nodes.filter(e=>!e.parentId);
        }
        for(var i=0;i<_tempNodes.length;i++){
            if(_data.nodes.map(e=>e.parentId).filter(e=>e).indexOf(_tempNodes[i].id)>-1){
                _tempNodes[i].shape='hexagon';
            }
        }
        _data.nodes=new vis.DataSet(_tempNodes);
        _data.edges=new vis.DataSet(_data.edges.filter(e=>_tempNodes.map(_d=>_d.id).indexOf(e.from)!=-1 && _tempNodes.map(_d=>_d.id).indexOf(e.to)!=-1));
        if(!graphExplorer.network){
            graphExplorer.network = new vis.Network(graphExplorer.container, _data, graphExplorer.options);
            
            graphExplorer.network.on("selectNode", function (params) {
                EventBus.dispatch("selectNode", params);
            });
            graphExplorer.network.on("deselectNode", function (params) {
                EventBus.dispatch("deselectNode", params);
            });
        }else{
            graphExplorer.network.setData(_data)
        }
        EventBus.dispatch('refreshPanel');
    });

$(document).ready(()=>{
    EventBus.dispatch('loadGraph');
    $('#Date').datepicker();//{format:'yyyy-mm-dd'}
    $('#properties').on('click','tr',(e)=>EventBus.dispatch('readPropperty',e))
});