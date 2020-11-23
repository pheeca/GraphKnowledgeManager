
var graphExplorer = graphExplorer || {};
var EventBus = EventBus || {};
var _isDev = (window.location.origin == "file://" || window.location.origin.indexOf('localhost') > -1);
var AppConfig = {
    messageBox: '#updatemsg',
    mainpanelgroup: '#mainpanelgroup',
    pageSection: '#pageSection',
    isDev: _isDev,
    domain: _isDev ? '' : '',//server domain (dev:'http://localhost:50090')
    loginUrl: '/Login',
    GraphUrl: '/Graph',
    defaultUrl:'/Login'
};
var AppRoutes = [
    { path: AppConfig.GraphUrl+'/:UserSchemaId/:NodeId/:key', isAuthenticated: false, event: 'App.Route.Main', file: 'mainpanels.tmp.html' },
    { path: AppConfig.GraphUrl, isAuthenticated: true, event: 'App.Route.Main', file: 'mainpanels.tmp.html' },
    { path: AppConfig.loginUrl , isAuthenticated: false, event: 'App.Route.Login', file: 'loginpanels.tmp.html' },
];


$(document).ready(() => {
    if (!window.location.hash) {
        // Fragment doesn't exist
        var userId = sessionStorage.getItem("UserId");
        var userSchemaId = sessionStorage.getItem("UserSchemaId");
        if(userId && userSchemaId){
            window.location.hash = AppConfig.GraphUrl;
        }else{
            window.location.hash = AppConfig.defaultUrl;
        }
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
    var currentPath = window.location.hash.replace('#', '');
    var currentRoute;
    var routeParams = {};

    AppRoutes.some(function (el) {
        try {
            if (el.path.indexOf(':') == -1 && el.path.toLocaleLowerCase().indexOf(currentPath.toLocaleLowerCase()) == 0 && el.path.length == currentPath.length) {
                currentRoute = el;
                return true;
            } else if (el.path.indexOf(':') > -1) {
                var _p = el.path.split('/');
                var constructedPath = currentPath.split('/').map((e, i) => _p[i].indexOf(':') > -1 ? _p[i] : e).join('/');
                if (el.path.toLocaleLowerCase().indexOf(constructedPath.toLocaleLowerCase()) == 0 && el.path.length == constructedPath.length) {
                    routeParams = currentPath.split('/').map((e, i) => _p[i].indexOf(':') > -1 ? ({ [_p[i].split(':')[1]]: e }) : {}).reduce((x, y) => Object.assign({}, x, y), {});
                    currentRoute = el;
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
    if (currentRoute) {

        $.ajax({
            url: AppConfig.domain + '/Home/template?Templatename=' + currentRoute.file,
            dataType: "html",
            type: "GET",
            success: function (s) {
                var isAllowed = !currentRoute.isAuthenticated;
                sessionStorage.setItem('routeParams',JSON.stringify(routeParams));
                if (currentRoute.isAuthenticated) {
                    var userId = sessionStorage.getItem("UserId");
                    if (userId) {
                        isAllowed = true;
                    } else {
                        window.location.hash =  AppConfig.loginUrl;
                        EventBus.dispatch('App.UiChanged');
                    }
                }
                if (isAllowed) {
                    $(AppConfig.pageSection).html(s);
                    EventBus.dispatch(currentRoute.event);
                }
            },
            error: function (xhr, status) {
                console.log(xhr, status);
                alert("Sorry, there was a problem!");
            }
        });
    } else {
        alert('page not found');
    }
});

EventBus.addEventListener('App.Redirect', function (url) {
    window.location.hash = url.target;
    EventBus.dispatch('App.UiChanged');
});