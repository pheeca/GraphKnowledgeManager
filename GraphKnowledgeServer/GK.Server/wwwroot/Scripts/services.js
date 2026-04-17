var services = services || {};

services.client = services.client ||{};
services.client.dataservice = services.client.dataservice ||{};

var graphExplorer = graphExplorer || {};
graphExplorer.ctx = graphExplorer.ctx || {};


//Node,Properties,Edges
services.client.dataservice.deselectCurrentProperty = function()
{
    graphExplorer.data.currentProperty = null;
}
services.client.dataservice.deselectCurrentParentNode = function()
{
    graphExplorer.data.parentNode = null;
}
services.client.dataservice.deselectCurrentNode = function()
{
    graphExplorer.data.selectedNode = null;
}

services.client.dataservice.deselectCurrentEdge = function()
{
    graphExplorer.data.currentEdge = null;
}
services.client.dataservice.isDataValid = function(){
    if(graphExplorer.data){
        return true;
    }
    console.log('data not initialized')
    return false;
}

services.client.dataservice.getNode = function(Id,nullable=true)
{
    var node=graphExplorer.data.nodes.filter(f => f.id == Id)[0];
    node=nullable?node:(node||{})
    return node;
}

services.client.dataservice.getCurrentNode = function(nullable=true)
{
    return services.client.dataservice.getNode(graphExplorer.data.selectedNode,nullable);
}
services.client.dataservice.getCurrentSiblingNodes = function()
{
    return graphExplorer.data.nodes.filter(f => f.id != graphExplorer.data.selectedNode && f.id != graphExplorer.data.selectedNode && (f.parentId || 0) == (graphExplorer.data.parentNode || 0));
}

services.client.dataservice.createUpdateNode = function(nodeLabel,nodeId,parentId)
{
    if (nodeId) {
        for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
            if (graphExplorer.data.nodes[i].id == nodeId) {
                graphExplorer.data.nodes[i].label = nodeLabel;
                return graphExplorer.data.nodes[i];
            }
        }
    } else {
        var obj={ id: (graphExplorer.data.nodes[graphExplorer.data.nodes.length - 1].id + 1), label: nodeLabel, parentId: parentId };
        graphExplorer.data.nodes[graphExplorer.data.nodes.length] = obj;
        return obj;
    }
    return null;
}
services.client.dataservice.createUpdateCurrentNode = function(nodeLabel){
    services.client.dataservice.createUpdateNode(nodeLabel,graphExplorer.data.selectedNode, graphExplorer.data.parentNode);
}

services.client.dataservice.createUpdateEdgeFromCurrentNode = function(nodeId,edgeId,EdgeValue,oldEdgeJSONString)
{
    if (!edgeId) {
        var edge={ id: uuidv4(), to: graphExplorer.data.selectedNode, from: parseInt(nodeId), label: EdgeValue};
        graphExplorer.data.edges[graphExplorer.data.edges.length] = edge;
        return edge;
    } else {
        var oldEdgeJSON = oldEdgeJSONString;// JSON.stringify($(edgeId).data('id'));
        for (var i = 0; i < graphExplorer.data.edges.length; i++) {
            if (JSON.stringify(graphExplorer.data.edges[i]) == oldEdgeJSON) {
                var edge = graphExplorer.data.edges[i];
                if ((nodeId || EdgeValue)) {
                    if (graphExplorer.data.currentEdge) {
                        if (edge.to == graphExplorer.data.selectedNode) {
                            edge.from = parseInt(nodeId);
                        } else {
                            edge.to = parseInt(nodeId);
                        }
                        edge.label = EdgeValue;
                    }
                }
                graphExplorer.data.edges[i] = edge;
                return edge;
            }
        }
    }
    return null;
}