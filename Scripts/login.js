var EventBus = EventBus || {};
var AppConfig = AppConfig || {};

EventBus.removeEventListener("App.UI.Login");
EventBus.removeEventListener("App.UI.CreateUser");
EventBus.removeEventListener("App.UI.Login.LoadUserInfo");
EventBus.removeEventListener("App.UI.Login.schemaSelect");



EventBus.addEventListener('App.UI.Login', function (params) {
    var email = $('#email').val();
    var password = $('#password').val();
    $.ajax({
        url: AppConfig.domain + '/api/UserAuth',
        type: "POST",
        data: {
            username: email,
            password: password,
        },
        success: function (data) {
            if (data) {
                sessionStorage.setItem("UserId", data.UserId);
                EventBus.dispatch('App.UI.Login.LoadUserInfo');
            }else{
                alert('invalid credentials');
            }
        },
        error: function (xhr, status) {
            console.log(xhr, status);
            alert("Sorry, there was a problem!");
        }
    });

});

EventBus.addEventListener('App.UI.Login.LoadUserInfo', function (params) {

    var userId = sessionStorage.getItem("UserId");
    if(userId){
        $.ajax({
            url: AppConfig.domain + '/api/UserAuth/'+userId,
            type: "GET",
            success: function (data) {
                $(`#schemaname`).html('');
                if (data) {
                  data.forEach(element => {
                    $(`#schemaname`).append( 
                        ` <a href="#" class="list-group-item list-group-item-action flex-column align-items-start " onclick="EventBus.dispatch('App.UI.Login.schemaSelect',${element.UserSchemaId})">
                        <div class="d-flex w-100 justify-content-between">
                          <h5 class="mb-1">${element.SchemaName}</h5>
                          <!--<small>3 days ago</small>-->
                        </div>
                        <p class="mb-1">${element.SchemaDesc}</p>
                        <!--<small>Donec id elit non mi porta.</small>-->
                      </a>`);
                    });
                }
                $(`#schemaname`).append('<button type="button" type="button" class="btn btn-success" data-toggle="modal" data-target="#GraphPopup">Add Graph</button>');
            },
            error: function (xhr, status) {
                console.log(xhr, status);
                alert("Sorry, there was a problem!");
            }
        });
       
    }
});

EventBus.addEventListener('App.UI.Login.schemaSelect', function (params) {
    if(params.target){
        sessionStorage.setItem("UserSchemaId", params.target);
        EventBus.dispatch('App.Redirect',AppConfig.GraphUrl);
    }
});


EventBus.addEventListener('App.UI.Login.schemaAdd', function (params) {
    var graphName=$('#graphname').val();
    var userId = sessionStorage.getItem("UserId");
    if(graphName){
        $.ajax({
            url: AppConfig.domain + '/api/UserSchema',
            data: {  
                OwnerUserId:userId,
                SchemaName:graphName, 
                SchemaDesc:graphName
            },
            type: "POST",
            success: function (data) {
                if(data){
                    EventBus.dispatch('App.UI.Login.LoadUserInfo');
                }else{
                    alert("Sorry, there was a problem!");
                }
            },
            error: function (xhr, status) {
                console.log(xhr, status);
                alert("Sorry, there was a problem!");
            }
        });
    }
       
});
EventBus.addEventListener('App.UI.CreateUser', function (params) {
    var email = $('#email').val();
    var password = $('#password').val();
    $.ajax({
        url: AppConfig.domain + '/api/User',
        type: "POST",
        data: {
            username: email,
            password: password,
        },
        success: function (data) {
            if (data) {
                alert('success')
                EventBus.dispatch('App.UI.Login');
            }else{
                alert('user already exists');
            }
        },
        error: function (xhr, status) {
            console.log(xhr, status);
            alert("Sorry, there was a problem!");
        }
    });

});