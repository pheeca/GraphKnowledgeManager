var graphExplorer = graphExplorer || {};
var EventBus = EventBus || {};
var AppConfig = AppConfig || {};
var utilities = utilities || {};
var services = services || {};

services.client = services.client ||{};
services.client.dataservice = services.client.dataservice ||{};


graphExplorer.ctx = graphExplorer.ctx || {};

graphExplorer.graphConfig = {
    defaultNodeColor: '#97c2fc',
    searchtag: '#search',
    tagContextGlobal: '#ContextGlobal',
    changeparent: '#changeparent',
    linkNodes: '#linkNodes',
    searchmode:'#searchmode',
    representationstyle:'#representationstyle',
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
    services.client.dataservice.deselectCurrentNode();
    services.client.dataservice.deselectCurrentProperty();
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
    updateNodeBreadcrumb();
    $('#panel,#generalpanel').hide();
    if (graphExplorer.data.selectedNode) {
        $('#panel').show();
        let localProps = services.client.dataservice.getNode(graphExplorer.data.selectedNode,false).Properties || [];
        EventBus.dispatch('refreshPanelProps', localProps);
        EventBus.dispatch('refreshPanelGraphEditor');
        EventBus.dispatch('refreshPanelCustomize');
        EventBus.dispatch('refreshPanelAdvanceAction');
        EventBus.dispatch('refreshPanelHistory');
    } else {
        $('#generalpanel').show();
        $('#historyrows').html('');
        $('#history-state').text('Select a node to view history.');
    }
});

function updateNodeBreadcrumb() {
    var $breadcrumb = $('#gk-node-breadcrumb');
    if (!$breadcrumb.length || !graphExplorer.data || !graphExplorer.data.nodes) return;

    var nodes = graphExplorer.data.nodes;
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    var contextNodeId = graphExplorer.data.parentNode || null;
    var selectedNodeId = graphExplorer.data.selectedNode || null;

    var chain = [];
    var cursor = contextNodeId;
    var safety = 0;
    while (cursor && byId[cursor] && safety < 2000) {
        chain.push({ id: byId[cursor].id, label: byId[cursor].label || ('Node ' + cursor) });
        cursor = byId[cursor].parentId || null;
        safety++;
    }
    chain.reverse();

    var segments = [{ id: '', label: 'Root' }].concat(chain);
    var html = '<div class="d-flex align-items-center flex-wrap px-2 py-1" style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;min-height:34px;">';
    html += '<span class="text-muted mr-2" style="font-size:12px;">Context:</span>';

    segments.forEach(function (segment, index) {
        if (index > 0) {
            html += '<span class="text-muted mx-1">&rsaquo;</span>';
        }
        html += '<button type="button" class="btn btn-link btn-sm p-0 gk-crumb-link" data-nodeid="' + segment.id + '" style="font-size:12px;">' + segment.label + '</button>';
    });

    if (selectedNodeId && byId[selectedNodeId]) {
        html += '<span class="text-muted mx-2">|</span>';
        html += '<span class="badge badge-secondary" style="font-size:11px;">Selected: ' + (byId[selectedNodeId].label || ('Node ' + selectedNodeId)) + '</span>';
    }

    html += '</div>';
    $breadcrumb.html(html);
}

function bindBreadcrumbNavigation() {
    $('#gk-node-breadcrumb')
        .off('click.gkbreadcrumb')
        .on('click.gkbreadcrumb', '.gk-crumb-link', function (e) {
            e.preventDefault();
            var raw = $(this).attr('data-nodeid');
            var nodeId = parseInt(raw, 10);
            if (!raw || isNaN(nodeId)) {
                graphExplorer.data.parentNode = null;
            } else {
                graphExplorer.data.parentNode = nodeId;
            }
            graphExplorer.data.selectedNode = null;
            EventBus.dispatch('graphUpdated');
        });
}

EventBus.removeEventListener('refreshPanelAdvanceAction');
EventBus.addEventListener('refreshPanelAdvanceAction', function (params) {
    var _node = services.client.dataservice.getNode(graphExplorer.data.selectedNode,false);
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
    // Note: the "Generate Link" button (#gk-create-share-btn) is wired in onGraphEnabled


});

EventBus.removeEventListener('refreshPanelCustomize');
EventBus.addEventListener('refreshPanelCustomize', function (params) {
    var node = services.client.dataservice.getNode(graphExplorer.data.selectedNode,false);
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
            <td>${(services.client.dataservice.getNode(connectedNodeId,false)).label || ''}</td>
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
    var siblingNodes = services.client.dataservice.getCurrentSiblingNodes();
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

EventBus.removeEventListener('addNewNodesEdges');
EventBus.addEventListener('addNewNodesEdges', function (e) {

    $('#myModal5').modal("show");
    if (e.target) {
        if ($(e.target.target).is('button')) {
            $('#myModal5').modal("hide");
            return;
        }
    }
    $('#BulkNodes').on('change',function(){
        var _html ="";
        $('#BulkNodes').val().split(',').forEach(function(v,i){
            _html +=`<tr>
            <th scope="row">${i+1}</th>
            <td><input  class="form-control nodeItem" value="${v}" /></td>
            <td><input  class="form-control edgeItem" value="" /></td>
          </tr>`;
        });
        $('#BulkNodesTable').html(_html);
        
    });
});


EventBus.removeEventListener('SubmitAddNewNodesEdges');
EventBus.addEventListener('SubmitAddNewNodesEdges', function (e) {
         $('#myModal5').modal("hide");
         var nodeItems = $('.nodeItem').toArray().map(e=>$(e).val());
         var edgeItems = $('.edgeItem').toArray().map(e=>$(e).val());
         if(nodeItems.length!=edgeItems.length)
         {
             alert("oops something went wrong!");
         }
         nodeItems.forEach(function(nodeLabel,i){
            var node =services.client.dataservice.createUpdateNode(nodeLabel,null, graphExplorer.data.parentNode);
            var edgeVal=edgeItems[i];
            services.client.dataservice.createUpdateEdgeFromCurrentNode(node.id,null,edgeVal,null);
        });
        EventBus.dispatch('graphUpdated');            
});

EventBus.removeEventListener('addEdge');
EventBus.addEventListener('addEdge', function (e) {

   services.client.dataservice.createUpdateEdgeFromCurrentNode($('#Edge').val(),graphExplorer.data.currentEdge,$('#EdgeValue').val(),JSON.stringify($(graphExplorer.data.currentEdge).data('id')));
    
    $('#myModal3').modal('hide');
    $('#myModal3 input').val('');
    
    services.client.dataservice.deselectCurrentEdge();
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

var _propsPageSize = 20;
function _normalizeNodeProperties(node) {
    if (!node) return;
    var props = node.Properties || [];
    for (var i = 0; i < props.length; i++) {
        props[i] = props[i] || {};
        if (!props[i].id) {
            props[i].id = uuidv4();
        }
    }
    node.Properties = props;
}
function _normalizeAllNodeProperties(nodes) {
    nodes = nodes || [];
    for (var i = 0; i < nodes.length; i++) {
        _normalizeNodeProperties(nodes[i]);
        _ensureNodeHistory(nodes[i]);
    }
}
function _buildPropRow(item) {
    var potentialUrl = (item.value || '').split('/');
    var temp = (potentialUrl.pop() || potentialUrl.pop());
    if (temp) {
        potentialUrl = temp.split('?')[0];
        potentialUrl = potentialUrl.replace(/_|-/g, ' ');
    } else {
        potentialUrl = (item.value || '');
    }
    return `<tr data-propid="${item.id || ''}">
        <td>${item.key}</td>
        <td data-val="${item.value}">${utilities.validateURL(item.value) ? `<a target="_blank" href="${item.value}">${potentialUrl}</a>` : item.value}</td>
        <td>${item.date}</td>
    </tr>`;
}
function _renderPropChunk(allProps, fromIndex) {
    var end = Math.min(fromIndex + _propsPageSize, allProps.length);
    var html = '';
    for (var i = fromIndex; i < end; i++) {
        html += _buildPropRow(allProps[i]);
    }
    $('#properties').append(html);
    $('#properties').data('propsRendered', end);
}
function _getContrastTextColor(hexColor) {
    // Returns '#000000' or '#ffffff' based on WCAG relative luminance of the background.
    if (!hexColor || typeof hexColor !== 'string') return '#000000';
    var hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length !== 6) return '#000000';
    var r = parseInt(hex.substring(0,2),16);
    var g = parseInt(hex.substring(2,4),16);
    var b = parseInt(hex.substring(4,6),16);
    // sRGB linearisation
    var toLinear = function(c) { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
    var L = 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
    return L > 0.179 ? '#000000' : '#ffffff';
}

function _exportGraphJSON() {
    var dataToExport = JSON.parse(JSON.stringify(graphExplorer.data));
    dataToExport.selectedNode = null;
    dataToExport.currentEdge = null;
    dataToExport.currentProperty = null;
    var blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graph-' + (sessionStorage.getItem('UserSchemaId') || 'export') + '-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function _graphHasEmbeddedHistory() {
    var nodes = (graphExplorer.data && graphExplorer.data.nodes) || [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] && nodes[i].history && nodes[i].history.length) {
            return true;
        }
    }
    return false;
}
function _formatHistoryDate(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
        return '';
    }

    var value = rawValue;
    if (typeof value === 'string') {
        var legacyMatch = value.match(/^\/Date\((\d+)\)\/$/);
        if (legacyMatch && legacyMatch[1]) {
            value = parseInt(legacyMatch[1], 10);
        }
    }

    var dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) {
        return String(rawValue);
    }

    return dateObj.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
function _ensureNodeHistory(node) {
    if (!node) return;
    if (!node.history || !Array.isArray(node.history)) {
        node.history = [];
    }
}
function _snapshotNodeState(node) {
    if (!node) return null;
    var snapshot = JSON.parse(JSON.stringify(node));
    if (snapshot.history) {
        delete snapshot.history;
    }
    return snapshot;
}
function _appendNodeHistoryEntry(node, action) {
    if (!node) return;
    _ensureNodeHistory(node);
    node.history.push({
        entryId: uuidv4(),
        schemaInformationId: null,
        modifiedBy: sessionStorage.getItem('UserId') || null,
        creationDate: new Date().toISOString(),
        action: action || 'updated',
        state: _snapshotNodeState(node)
    });
}
var _historyTimeline = null;
function _renderHistoryRows(rows) {
    var $tbody = $('#historyrows');
    $tbody.html('');

    var $tl = $('#history-timeline');
    if (!rows || rows.length === 0) {
        $('#history-state').text('No history found for this node.');
        $tl.hide();
        _historyTimeline = null;
        return;
    }
    $('#history-state').text('History loaded.');

    // Build table rows and collect timeline items in the same pass
    var html = '';
    var tlItems = [];
    for (var i = 0; i < rows.length; i++) {
        var item = rows[i] || {};
        var rowId = 'histrow-' + i;
        html += '<tr id="' + rowId + '" style="cursor:pointer;" onclick="_highlightHistoryRow(' + i + ')">' +
            '<td>' + (item.schemaInformationId || '') + '</td>' +
            '<td>' + (item.modifiedBy || '') + '</td>' +
            '<td>' + _formatHistoryDate(item.creationDate) + '</td>' +
            '</tr>';
        tlItems.push({
            idx: i,
            action: item.action || 'save',
            date: item.creationDate ? new Date(item.creationDate) : new Date(),
            label: (item.action || 'save') + ' · ' + _formatHistoryDate(item.creationDate)
        });
    }
    $tbody.html(html);

    // Render vis.Timeline
    _renderVisTimeline($tl[0], tlItems);
}

function _renderVisTimeline(container, items) {
    if (!items || items.length === 0) { $(container).hide(); return; }

    if (_historyTimeline) { _historyTimeline.destroy(); _historyTimeline = null; }

    var actionColors = { created: '#28a745', updated: '#007bff', deleted: '#dc3545', save: '#6c757d' };

    var visItems = new vis.DataSet(items.map(function (it) {
        var color = actionColors[it.action] || actionColors.save;
        return {
            id: it.idx,
            content: '<span title="' + it.label + '" style="font-size:10px;color:#fff;">' + it.action + '</span>',
            start: it.date,
            type: 'point',
            style: 'color:' + color + ';'
        };
    }));

    // Date range: first event − 10 days to now + 10 days
    var dates = items.map(function(it){ return it.date.getTime(); });
    var minDate = new Date(Math.min.apply(null, dates) - 10 * 86400000);
    var maxDate = new Date(Date.now() + 10 * 86400000);

    var options = {
        height: '120px',
        selectable: true,
        stack: true,
        showMajorLabels: true,
        showMinorLabels: false,
        start: minDate,
        end: maxDate,
        min: minDate,
        max: maxDate,
        zoomMin: 60 * 60 * 1000,      // 1 hour minimum zoom
        zoomMax: (maxDate - minDate) * 1.1,
        moveable: true,
        zoomable: true,
        orientation: { axis: 'bottom' }
    };

    _historyTimeline = new vis.Timeline(container, visItems, options);
    _historyTimeline.on('select', function (props) {
        if (props.items && props.items.length > 0) {
            _highlightHistoryRow(props.items[0]);
        }
    });
    $(container).show();
}
function _highlightHistoryRow(idx) {
    var $wrap = $('#history-scroll-wrap');
    var $rows = $wrap.find('tr');
    $rows.css('background', '');
    var $target = $('#histrow-' + idx);
    $target.css('background', '#d1ecf1');
    if ($target.length) {
        $wrap.animate({ scrollTop: $wrap.scrollTop() + $target.position().top - $wrap.height() / 2 }, 200);
    }
    // Sync timeline selection
    if (_historyTimeline) { _historyTimeline.setSelection([idx]); }
}
function _getNodeHistoryFromGraph(nodeId) {
    var node = services.client.dataservice.getNode(nodeId, true);
    if (!node || !node.history || !node.history.length) {
        return [];
    }
    return node.history;
}
function _getNodeHistoryFromCache(nodeId) {
    if (!graphExplorer.historyCache || !graphExplorer.historyCache[String(nodeId)]) {
        return [];
    }
    return graphExplorer.historyCache[String(nodeId)] || [];
}
function _hydrateHistoryIntoGraphData(historyMap) {
    if (!graphExplorer.data || !graphExplorer.data.nodes || !historyMap) return;
    for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
        var node = graphExplorer.data.nodes[i] || {};
        var nodeId = node.id;
        if (nodeId === undefined || nodeId === null) continue;
        node.history = historyMap[String(nodeId)] || [];
        graphExplorer.data.nodes[i] = node;
    }
}
EventBus.removeEventListener('refreshPanelHistory');
EventBus.addEventListener('refreshPanelHistory', function () {
    var selectedNodeId = graphExplorer.data.selectedNode;
    if (!selectedNodeId) {
        _renderHistoryRows([]);
        return;
    }

    // Rule requested: only call API if graph nodes do not already carry history.
    if (_graphHasEmbeddedHistory()) {
        _renderHistoryRows(_getNodeHistoryFromGraph(selectedNodeId));
        return;
    }

    if (graphExplorer.historyCacheLoaded) {
        _renderHistoryRows(_getNodeHistoryFromCache(selectedNodeId));
        return;
    }

    if (graphExplorer.historyCacheLoading) {
        $('#history-state').text('Loading history...');
        return;
    }

    graphExplorer.historyCacheLoading = true;
    $('#history-state').text('Loading history...');

    var userSchemaId = sessionStorage.getItem('UserSchemaId');
    $.ajax({
        url: AppConfig.domain + '/api/values/' + userSchemaId + '/history-map',
        type: 'GET',
        success: function (historyMap) {
            graphExplorer.historyCache = historyMap || {};
            _hydrateHistoryIntoGraphData(graphExplorer.historyCache);
            graphExplorer.historyCacheLoaded = true;
            _renderHistoryRows(_getNodeHistoryFromCache(selectedNodeId));
        },
        error: function () {
            graphExplorer.historyCache = {};
            graphExplorer.historyCacheLoaded = true;
            _renderHistoryRows([]);
        },
        complete: function () {
            graphExplorer.historyCacheLoading = false;
        }
    });
});
function _getFilteredProps() {
    var all = $('#properties').data('allProps') || [];
    var q = ($('#props-search').val() || '').toLowerCase().trim();
    if (!q) return all;
    return all.filter(function (p) {
        return (p.key || '').toLowerCase().indexOf(q) !== -1 ||
               (p.value || '').toLowerCase().indexOf(q) !== -1 ||
               (p.date || '').toLowerCase().indexOf(q) !== -1;
    });
}
function _applyPropsFilter() {
    var $tbody = $('#properties');
    $tbody.html('');
    $tbody.data('propsRendered', 0);
    var filtered = _getFilteredProps();
    $tbody.data('propsFiltered', filtered);
    _renderPropChunk(filtered, 0);
}
EventBus.removeEventListener('refreshPanelProps');
EventBus.addEventListener('refreshPanelProps', function (params) {
    params = params.target || [];
    for (var i = 0; i < params.length; i++) {
        if (!params[i].id) {
            params[i].id = uuidv4();
        }
    }
    var $tbody = $('#properties');
    $tbody.html('');
    $tbody.data('allProps', params);
    $tbody.data('propsRendered', 0);
    $('#props-search').val('');
    var filtered = params;
    $tbody.data('propsFiltered', filtered);
    _renderPropChunk(filtered, 0);
    // search input
    $('#props-search').off('input.lazyprops').on('input.lazyprops', function () {
        _applyPropsFilter();
        $('#properties-scroll-wrap').scrollTop(0);
    });
    // bind scroll on the wrapper (once per refresh)
    var $wrap = $('#properties-scroll-wrap');
    $wrap.off('scroll.lazyprops').on('scroll.lazyprops', function () {
        var rendered = $tbody.data('propsRendered') || 0;
        var filtered = $tbody.data('propsFiltered') || [];
        if (rendered >= filtered.length) return;
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 40) {
            _renderPropChunk(filtered, rendered);
        }
    });
});

EventBus.removeEventListener('readPropperty');
EventBus.addEventListener('readPropperty', function (e) {
    if (graphExplorer.shareConfig && graphExplorer.shareConfig.accessMode === 'ReadOnly') {
        return;
    }
    if (!e.target || e.target.target.nodeName=='A') {
        return;
    }
    $('#Property').val($(e.target.currentTarget).find('td').eq(0).text());
    $('#Value').val($(e.target.currentTarget).find('td').eq(1).data('val'));
    $('#Date').val($(e.target.currentTarget).find('td').eq(2).text());
    $(graphExplorer.graphConfig.modal.property).modal("show");
    graphExplorer.data.currentPropertyId = $(e.target.currentTarget).data('propid') || null;
    graphExplorer.data.currentProperty = null;
    $('#gk-property-delete-btn').show();
});

EventBus.removeEventListener('openAddPropperty');
EventBus.addEventListener('openAddPropperty', function () {
    if (graphExplorer.shareConfig && graphExplorer.shareConfig.accessMode === 'ReadOnly') {
        return;
    }
    graphExplorer.data.currentPropertyId = null;
    graphExplorer.data.currentProperty = null;
    $('#Property').val('');
    $('#Value').val('');
    $('#Date').val('');
    $('#gk-property-delete-btn').hide();
});

EventBus.removeEventListener('addPropperty');
EventBus.addEventListener('addPropperty', function () {
    if (graphExplorer.shareConfig && graphExplorer.shareConfig.accessMode === 'ReadOnly') {
        return;
    }

    var props = [];
    for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
        if (graphExplorer.data.selectedNode == graphExplorer.data.nodes[i].id) {

            props = graphExplorer.data.nodes[i].Properties || [];
            for (var k = 0; k < props.length; k++) {
                if (!props[k].id) {
                    props[k].id = uuidv4();
                }
            }
            var p = null;
            if (($('#Property').val() || $('#Value').val() || $('#Date').val())) {
                var currentPropId = graphExplorer.data.currentPropertyId || null;
                var propIdx = currentPropId ? props.findIndex(function (item) { return item && item.id == currentPropId; }) : -1;
                if (graphExplorer.data.currentProperty && props[propIdx] !== undefined) {
                    props[propIdx].key = $('#Property').val() || '';
                    props[propIdx].value = $('#Value').val() || '';
                    props[propIdx].date = $('#Date').val() || '';
                } else if (propIdx !== -1) {
                    props[propIdx].key = $('#Property').val() || '';
                    props[propIdx].value = $('#Value').val() || '';
                    props[propIdx].date = $('#Date').val() || '';
                } else {
                    p = { id: uuidv4(), key: $('#Property').val() || '', value: $('#Value').val() || '', date: $('#Date').val() || '' };
                    props.push(p);
                }
            }
            graphExplorer.data.nodes[i].Properties = props;
        }
    }
    EventBus.dispatch('refreshPanelProps', props);
    $(graphExplorer.graphConfig.modal.property).modal('hide');
    $(graphExplorer.graphConfig.modal.property + ' input').val('');
    $('#gk-property-delete-btn').hide();
    graphExplorer.data.currentPropertyId = null;
    services.client.dataservice.deselectCurrentProperty();
});

EventBus.removeEventListener('deletePropperty');
EventBus.addEventListener('deletePropperty', function () {
    if (graphExplorer.shareConfig && graphExplorer.shareConfig.accessMode === 'ReadOnly') {
        return;
    }
    var currentPropId = graphExplorer.data.currentPropertyId || null;
    if (!currentPropId) return;

    var props = [];
    for (var i = 0; i < graphExplorer.data.nodes.length; i++) {
        if (graphExplorer.data.selectedNode == graphExplorer.data.nodes[i].id) {
            props = graphExplorer.data.nodes[i].Properties || [];
            var propIdx = props.findIndex(function (item) { return item && item.id == currentPropId; });
            if (propIdx !== -1) {
                props.splice(propIdx, 1);
            }
            graphExplorer.data.nodes[i].Properties = props;
        }
    }

    EventBus.dispatch('refreshPanelProps', props);
    $(graphExplorer.graphConfig.modal.property).modal('hide');
    $(graphExplorer.graphConfig.modal.property + ' input').val('');
    $('#gk-property-delete-btn').hide();
    graphExplorer.data.currentPropertyId = null;
    services.client.dataservice.deselectCurrentProperty();
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
        graphExplorer.data.parentNode = (services.client.dataservice.getNode( graphExplorer.data.parentNode,false).parentId || null);

        EventBus.dispatch('graphUpdated');
    }
});


EventBus.removeEventListener('readNode');
EventBus.addEventListener('readNode', function () {
    $('#myModal4').modal("show");
    
    $('#NodeName').val(((services.client.dataservice.getCurrentNode(false)).label || ''));
    EventBus.dispatch('graphUpdated');
});

EventBus.removeEventListener('addNode');
EventBus.addEventListener('addNode', function (params) {
    services.client.dataservice.createUpdateCurrentNode($('#NodeName').val());
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
    // Share mode: route save to the share endpoint
    if (graphExplorer.shareConfig && graphExplorer.shareConfig.shareId) {
        if (graphExplorer.shareConfig.accessMode !== 'ReadWrite') return; // silent block for ro
        var clone = JSON.parse(JSON.stringify(graphExplorer.data));
        clone.selectedNode = null;
        clone.currentEdge = null;
        clone.currentProperty = null;
        $.ajax({
            url: AppConfig.domain + '/api/share/' + graphExplorer.shareConfig.shareId,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                SchemaInfo: JSON.stringify(clone),
                ModifiedBy: parseInt(sessionStorage.getItem("UserId") || '0', 10)
            }),
            success: function (data) {
                if (data) $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);
            }
        });
        return;
    }

    if (graphExplorer.isOffline) {
        localStorage.setItem('graphExplorer.data', JSON.stringify(graphExplorer.data));
        $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);
    } else {
        var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));
        if (!routeParams.UserSchemaId || window.btoa(location.href.substring(0, location.href.lastIndexOf('/'))) == routeParams.key) {
            var clone = JSON.parse(JSON.stringify(graphExplorer.data));
            clone.selectedNode = null;
            clone.currentEdge = null;
            clone.currentProperty = null;
            // Strip per-node history before sending — server derives it from previousJson
            if (clone.nodes) {
                clone.nodes = clone.nodes.map(function (n) {
                    var nc = Object.assign({}, n);
                    delete nc.history;
                    return nc;
                });
            }
            delete clone.deletedNodeHistory;
            $.ajax({
                url: graphExplorer.url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    SchemaInfo: JSON.stringify(clone),
                    ModifiedBy: parseInt(sessionStorage.getItem("UserId") || '0', 10)
                }),
                success: function (data) {
                    if (data) {
                        // Server returns enriched schema with history stamped
                        try {
                            var enriched = (typeof data === 'string') ? JSON.parse(data) : data;
                            // Preserve transient UI state
                            enriched.selectedNode = graphExplorer.data.selectedNode;
                            enriched.currentEdge = graphExplorer.data.currentEdge;
                            enriched.currentProperty = graphExplorer.data.currentProperty;
                            enriched.currentPropertyId = graphExplorer.data.currentPropertyId;
                            enriched.parentNode = graphExplorer.data.parentNode;
                            graphExplorer.data = enriched;
                            // Update stale snapshot to the just-saved state
                            graphExplorer.staleSnapshot = JSON.parse(JSON.stringify(enriched));
                            graphExplorer.staleSnapshot.selectedNode = null;
                            graphExplorer.staleSnapshot.currentEdge = null;
                            graphExplorer.staleSnapshot.currentProperty = null;
                        } catch (e) {
                            console.warn('saveGraph: could not parse server response', e);
                        }
                        $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);
                        EventBus.dispatch('refreshPanelHistory');
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
            // Step 1: Load trimmed schema (no history) — render immediately
            $.ajax({
                url: graphExplorer.url + '/trimmed',
                type: 'GET',
                success: function (data) {
                    // Disable Save while history loads
                    $('#gk-save-btn').prop('disabled', true).text('Loading…');
                    initialize(typeof data === 'string' ? data : JSON.stringify(data));
                    // Step 2: Load history-map in background
                    $.ajax({
                        url: graphExplorer.url + '/history-map',
                        type: 'GET',
                        success: function (historyMap) {
                            _hydrateHistoryIntoGraphData(historyMap);
                            graphExplorer.historyCache = historyMap;
                            graphExplorer.historyCacheLoaded = true;
                            $('#gk-save-btn').prop('disabled', false).text('Save');
                        },
                        error: function () {
                            console.warn('loadGraph: failed to load history-map');
                            $('#gk-save-btn').prop('disabled', false).text('Save');
                        }
                    });
                }
            });
        }
    }
});
function getCurrentNodes(_data) {

    var tagFilter = $(graphExplorer.graphConfig.searchtag).val() || null;
    var tagContextGlobal = $(graphExplorer.graphConfig.tagContextGlobal).is(':checked');
    var searchmode = $(graphExplorer.graphConfig.searchmode).val() || [];

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
        
        if(searchmode.includes('tag')){
            _tempNodes = _tempNodes.filter(e => (e.tags || []).filter(t => t.indexOf(tagFilter) > -1).length > 0);
        }
        if(searchmode.includes('node')){
            
            _tempNodes = _tempNodes.filter(e => e.label.toLocaleLowerCase().trim().indexOf(tagFilter.toLocaleLowerCase().trim())  > -1);
        }
        if(searchmode.includes('properties')){
            _tempNodes = _tempNodes.filter(e => (e.Properties||[]).filter(p=>((p.key||'')+(p.value||'')).toLocaleLowerCase().trim().indexOf(tagFilter.toLocaleLowerCase().trim())  > -1).length > 0);
        }
        _tempNodes = [...new Map(_tempNodes.map(item => [item['id'], item])).values()]; 
    }
    for (var i = 0; i < _tempNodes.length; i++) {
        if (_data.nodes.map(e => e.parentId).filter(e => e).indexOf(_tempNodes[i].id) > -1) {
            _tempNodes[i].shape = 'hexagon';
        }
        // Apply contrast font color regardless of shape (including hexagon)
        _tempNodes[i].font = Object.assign({}, _tempNodes[i].font || {}, {
            color: _getContrastTextColor(_tempNodes[i].color)
        });
    }
    return _tempNodes;
}
function ValidateNeighbouringNode(node, _data) {
    if (graphExplorer.onlyNeighbour && graphExplorer.data.selectedNode) {
        var nLevel =$('#nLevelNeighbouringNode').val();
        let l = _data.edges.filter(e => (e.from == graphExplorer.data.selectedNode || e.to == graphExplorer.data.selectedNode));
        
        
        for(var index=0;index<nLevel;index++)
        {
            var nIndexes=l.map(e=>e.to).concat(l.map(e=>e.from)).filter((v, i, a) => a.indexOf(v) === i);
            if(nIndexes.indexOf(node.id)>-1){
                return true;
            }
            l=_data.edges.filter(e => (nIndexes.indexOf(e.from)>-1||nIndexes.indexOf(e.to)>-1)).concat(l);
        }
        return false;
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
    var item = services.client.dataservice.getCurrentNode();
    var linkId = parseInt($(graphExplorer.graphConfig.linkNodes).val());
    var linkedNode = services.client.dataservice.getNode(linkId);
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

    // Track representation style to detect layout changes
    var currentRepStyle = $(graphExplorer.graphConfig.representationstyle).val();
    var styleChanged = graphExplorer.currentRepStyle !== currentRepStyle;
    graphExplorer.currentRepStyle = currentRepStyle;

    if (!graphExplorer.network || styleChanged) {
        // Destroy old network if switching layout styles
        if (graphExplorer.network) {
            graphExplorer.network.destroy();
            graphExplorer.network = null;
        }
        
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
        graphExplorer.network.setOptions(graphExplorer.options);
        var nLevelNeighbouringNode = $('#nLevelNeighbouringNode').val();
        var tagFilter = $(graphExplorer.graphConfig.searchtag).val() || '';
        var tagContextGlobal = $(graphExplorer.graphConfig.tagContextGlobal).is(':checked');
        currentHash = hashCode(JSON.stringify(graphExplorer.data) + tagFilter + tagContextGlobal+graphExplorer.onlyNeighbour+nLevelNeighbouringNode);
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
    // Set dynamic version label
    $('#app-version').text('v' + AppConfig.version);
    EventBus.dispatch('loadGraph');
    // Redraw vis-timeline when the History tab becomes visible (it needs width to render correctly)
    $('body').off('shown.bs.tab.gkhistory').on('shown.bs.tab.gkhistory', 'a[href="#historypanel"]', function () {
        if (_historyTimeline) { _historyTimeline.redraw(); _historyTimeline.fit(); }
    });
    $('select[multiple]').selectpicker();
    bindBreadcrumbNavigation();
    $('#Date').datepicker();//{format:'yyyy-mm-dd'}
    $('#properties').on('click', 'tr', (e) => EventBus.dispatch('readPropperty', e))
    $('#edges').on('click', 'tr', (e) => EventBus.dispatch('readEdge', e))
    $('#neighbouringNodesSwitch').on('change', (e) => EventBus.dispatch('onlyNeighbourToggle', e));
    //+ ',' + graphExplorer.graphConfig.searchmode
    $(graphExplorer.graphConfig.searchtag + ',' + graphExplorer.graphConfig.tagContextGlobal ).on('change', (e) => EventBus.dispatch('graphUpdated', e));
    // Handle Enter key in search input
    $('#search').on('keypress', function(e) {
        if (e.which == 13) { // Enter key
            EventBus.dispatch('graphUpdated');
        }
    });
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
    });

    // Generate backend share link for selected node
    $('#gk-create-share-btn').on('click', function () {
        var nodeId = graphExplorer.data.selectedNode;
        if (!nodeId) { alert('Please select a node first.'); return; }
        var mode = $('#gk-share-mode').val() || 'ReadOnly';
        $.ajax({
            url: AppConfig.domain + '/api/share',
            type: 'POST',
            data: {
                UserSchemaId: sessionStorage.getItem("UserSchemaId"),
                RootNodeId: nodeId,
                AccessMode: mode,
                CreatedBy: sessionStorage.getItem("UserId")
            },
            success: function (shareId) {
                var shareUrl = location.origin + '/#/Share/' + shareId;
                $('#sharelink').val(shareUrl);
            },
            error: function () {
                alert('Failed to create share link.');
            }
        });
    });
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
    graphExplorer.options = graphExplorer.options ;
    graphExplorer.ctx.representationstyle={};
    graphExplorer.ctx.representationstyle.graph ={
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
    }
    graphExplorer.ctx.representationstyle.hierarchical=Object.assign({},graphExplorer.ctx.representationstyle.graph,{ edges: {
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'vertical',
          roundness: 1
        },
        color: 'lightgray'
      },  layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed'
        }
      },
      interaction: {dragNodes :false},
      physics: {
        enabled: true,
        hierarchicalRepulsion: {
          avoidOverlap: 1
        }
      }
     });
     
     graphExplorer.options=$(graphExplorer.graphConfig.representationstyle).val()=='hierarchical'?graphExplorer.ctx.representationstyle.hierarchical:graphExplorer.options;
     graphExplorer.options=$(graphExplorer.graphConfig.representationstyle).val()=='graph'?graphExplorer.ctx.representationstyle.graph:graphExplorer.options;

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
    _normalizeAllNodeProperties(graphExplorer.data.nodes);
    graphExplorer.data.currentPropertyId = null;
    graphExplorer.historyCache = {};
    graphExplorer.historyCacheLoaded = false;
    graphExplorer.historyCacheLoading = false;
    // Capture stale snapshot for save-time diffing (server compares prev vs incoming)
    graphExplorer.staleSnapshot = JSON.parse(JSON.stringify(graphExplorer.data));
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
        success: function (resp) {
            if (resp) {
                try {
                    var parsed = typeof resp === 'string' ? JSON.parse(resp) : resp;
                    // Server returns { schema: {trimmed}, historyMap: { nodeId: [] } }
                    var trimmed = parsed.schema || parsed;
                    var historyMap = parsed.historyMap || null;
                    var schemaJson = typeof trimmed === 'string' ? trimmed : JSON.stringify(trimmed);
                    initialize(schemaJson);
                    if (historyMap) {
                        _hydrateHistoryIntoGraphData(historyMap);
                        graphExplorer.historyCache = historyMap;
                        graphExplorer.historyCacheLoaded = true;
                    }
                    $(AppConfig.messageBox).text(`Last Saved: ${new Date().toLocaleString()}`);
                } catch(e) {
                    console.log(e, resp);
                    alert('Undo/Redo failed to parse response.');
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
                let edgeNode = services.client.dataservice.getNode(toedges[0].from);
                if (edgeNode) {
                    extralabel = " (" + toedges[0].label + ' - ' + edgeNode.label + ")";
                } else {
                    console.log('missing node ', toedges[0]);
                }
            } else if (fromedges.length > 0) {
                let edgeNode = services.client.dataservice.getNode(fromedges[0].to) ;
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
            let edgeNode = services.client.dataservice.getNode(e.parentId);
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
    services.client.dataservice.deselectCurrentProperty();
    EventBus.dispatch('refreshPanel');
});

// ── Share mode ───────────────────────────────────────────────────────────────

graphExplorer.shareConfig = null;

EventBus.removeEventListener('onShareEnabled');
EventBus.addEventListener('onShareEnabled', function () {
    EventBus.removeEventListener('onShareEnabled');

    setFstDropdown();
    bindBreadcrumbNavigation();
    graphExplorer.isOffline = false;
    graphExplorer.shareConfig = null;

    var routeParams = JSON.parse(sessionStorage.getItem('routeParams'));
    var shareId = routeParams && routeParams.shareId;
    if (!shareId) {
        EventBus.dispatch('UI.Web.App.Redirect', '/Login');
        return;
    }

    graphExplorer.shareConfig = { shareId: shareId, accessMode: null };

    // Bind standard read-safe UI events
    $('select[multiple]').selectpicker();
    $('#Date').datepicker();
    $('#properties').on('click', 'tr', (e) => EventBus.dispatch('readPropperty', e));
    $('#edges').on('click', 'tr', (e) => EventBus.dispatch('readEdge', e));
    $('#neighbouringNodesSwitch').on('change', (e) => EventBus.dispatch('onlyNeighbourToggle', e));
    $(graphExplorer.graphConfig.searchtag + ',' + graphExplorer.graphConfig.tagContextGlobal)
        .on('change', (e) => EventBus.dispatch('graphUpdated', e));

    $.ajax({
        url: AppConfig.domain + '/api/share/' + shareId,
        type: 'GET',
        success: function (data) {
            if (!data) {
                alert('Share link is invalid or has expired.');
                return;
            }
            graphExplorer.shareConfig.accessMode = data.AccessMode;
            initialize(data.SchemaInfo);
            applyShareUIMode(data.AccessMode);
        },
        error: function () {
            alert('Share link is invalid or has expired.');
        }
    });
});

function applyShareUIMode(accessMode) {
    // Never show share-creation UI to a share viewer
    $('#gk-share-section').hide();
    // Always disable undo/redo in share mode (they target full schema version history)
    $('#gk-undo-btn, #gk-redo-btn').closest('.btn-group').hide();

    if (accessMode === 'ReadOnly') {
        $('#gk-save-btn, #gk-addnode-btn').closest('.btn-group').hide();
        $('a[href="#grapheditorpanel"]').closest('li').hide();
        $('a[href="#customize"]').closest('li').hide();
        $('a[href="#advancedactions"]').closest('li').hide();
        $('#gk-open-node-btn, #gk-property-add-btn, #gk-property-save-btn, #gk-property-delete-btn').hide();
        $('#myModal .modal-footer .btn-success').hide();
        if ($('#proppanel-tab').length) {
            $('#proppanel-tab').tab('show');
        }
        $(AppConfig.messageBox).text('Viewing shared graph (Read Only)');
    } else {
        $(AppConfig.messageBox).text('Viewing shared graph (Read & Write)');
    }
}