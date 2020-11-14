
var graphExplorer = graphExplorer || {};
var EventBus = EventBus || {};
var _isDev=(window.location.origin=="file://" || window.location.origin.indexOf('localhost')>-1);
var AppConfig = {
    messageBox: '#updatemsg',
    mainpanelgroup: '#mainpanelgroup',
    pageSection: '#pageSection',
    isDev: _isDev,
    domain:_isDev? 'http://localhost:50090' : '',//server domain
    loginUrl:'Login'
};
var AppRoutes = [
    { path: '/', isAuthenticated: true, event: 'App.Route.Main', file: 'mainpanels.tmp.html' },
    { path: '/login', isAuthenticated: false, event: 'App.Route.Login', file: 'loginpanels.tmp.html' }
];


$(document).ready(() => {
    if (!window.location.hash) {
        // Fragment doesn't exist
        window.location.hash = '/';
    }
    EventBus.dispatch('App.UiChanged');
    
});

//Pages - start
EventBus.addEventListener('App.Route.Main', function (params) {
    EventBus.dispatch('onGraphEnabled');
});

EventBus.addEventListener('App.Route.Login', function (params) {
    sessionStorage.clear();
});
//Pages - end


EventBus.addEventListener('App.UiChanged', function (params) {
    $(AppConfig.pageSection).html('');
    var currentPath=window.location.hash.replace('#','');
    var currentRoute;
    AppRoutes.some(function (el) {
        if(el.path.toLocaleLowerCase().indexOf(currentPath.toLocaleLowerCase())>-1){
            currentRoute=el;
            return true;
        }
    });
    if(currentRoute){
             
        $.ajax({
            url:AppConfig.domain+'/Home/template?Templatename='+currentRoute.file,
            dataType: "html",
            type: "GET",
            success:function(s){
                var isAllowed=!currentRoute.isAuthenticated;
                if(currentRoute.isAuthenticated){
                    var userId = sessionStorage.getItem("UserId");
                    if(userId){
                        isAllowed=true;
                    }else{
                        window.location.hash = '/'+AppConfig.loginUrl;
                        EventBus.dispatch('App.UiChanged');
                    }
                }
                if(isAllowed){
                    $(AppConfig.pageSection).html(s);
                    EventBus.dispatch(currentRoute.event);
                }
            },
            error: function (xhr, status) {
                console.log(xhr,status);
                alert("Sorry, there was a problem!");
            }
        });
    }else{
        alert('page not found');
    }
});

EventBus.addEventListener('App.Redirect', function (url) {
    window.location.hash = url.target;
    EventBus.dispatch('App.UiChanged');
});