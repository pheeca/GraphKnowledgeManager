
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
    defaultUrl:'/Login',
    title:'Graph Knowledge'
};
var AppRoutes = [
    { path: AppConfig.GraphUrl+'/:UserSchemaId/:NodeId/:key', isAuthenticated: false, event: 'UI.Web.App.Route.Main', file: 'mainpanels.tmp.html' },
    { path: AppConfig.GraphUrl, isAuthenticated: true, event: 'UI.Web.App.Route.Main', file: 'mainpanels.tmp.html', title:'Graph Explorer' },
    { path: AppConfig.loginUrl , isAuthenticated: false, event: 'UI.Web.App.Route.Login', file: 'loginpanels.tmp.html' , title:'Login' },
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
    EventBus.dispatch('UI.Web.App.UiChanged');

});

//Pages - start
EventBus.removeEventListener('UI.Web.App.Route.Main');
EventBus.addEventListener('UI.Web.App.Route.Main', function (params) {
    EventBus.dispatch('onGraphEnabled');
});

EventBus.removeEventListener('UI.Web.App.Route.Login');
EventBus.addEventListener('UI.Web.App.Route.Login', function (params) {
    sessionStorage.clear();
});
//Pages - end


EventBus.removeEventListener('UI.Web.App.UiChanged');
EventBus.addEventListener('UI.Web.App.UiChanged', function (params) {
    
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
        let requestUrl =AppConfig.domain + '/Home/template?Templatename=' + currentRoute.file;
        $.ajax({
            url: requestUrl,
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
                        EventBus.dispatch('UI.Web.App.Logout');
                    }
                }
                if (isAllowed) {
                    $(AppConfig.pageSection).html(s);
                    $('title').text(`${currentRoute.title||AppConfig.title} | ${AppConfig.title}`);
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

EventBus.removeEventListener('UI.Web.App.Redirect');
EventBus.addEventListener('UI.Web.App.Redirect', function (url) {
    window.location.hash = url.target;
    EventBus.dispatch('UI.Web.App.UiChanged');
});

EventBus.removeEventListener('UI.Web.App.Logout');
EventBus.addEventListener('UI.Web.App.Logout', function () {
    sessionStorage.clear();
    EventBus.dispatch('UI.Web.App.Redirect',AppConfig.loginUrl);
});