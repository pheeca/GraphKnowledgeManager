var EventBus = EventBus || {};
var AppConfig = AppConfig || {};

EventBus.removeEventListener("App.UI.Login");
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
            debugger
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
        EventBus.dispatch('App.Redirect',"/");
    }
});