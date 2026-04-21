var messagebushub=messagebushub||{};
$.connection.hub.url = "/signalr";
var EventBus = EventBus || {};

messagebushub.trigger=function(eventName,params,bubble=false){
    if(typeof params =='undefined'){
        params=null;
    }
    if(messagebushub.isLoaded() && messagebushub.isNotExclusive(eventName)){
        console.log('passed',eventName,params);
        this.server.trigger(this.connection.id,bubble,eventName,params);
    }else{
        console.warn(eventName+": unable to propagate");
    }
}

messagebushub.isLoaded = function(){
    return this&& this.server&& this.connection && this.connection.id && this.server.trigger;
}

messagebushub.isNotExclusive = function(eventName){
    var exclusionEventList = ["ui.web."];
    return !(eventName && exclusionEventList.map(eelItem=>eventName.toLocaleLowerCase().indexOf(eelItem) ==0).filter(e=>e).length>0);
}
messagebushub.init=function(){
    $.connection.messageBusHub.client.ReceiveMessage= function (eventName, Message) {
        EventBus.dispatch(eventName, Message);
    };
}

messagebushub.init();
$.connection.hub.start({ waitForPageLoad: false }).done(function(connection){
    messagebushub.connection=connection;
    messagebushub.server =connection.proxies.messagebushub.server;
});