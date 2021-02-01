using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using EventBus;
using EventBus.EventRepository;
using EventBus.EventServiceRepository;

namespace GraphKnowledgeServer
{
    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);


            GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
            GlobalConfiguration.Configuration.Formatters.Remove(GlobalConfiguration.Configuration.Formatters.XmlFormatter);

            

            MessageBus<object>.Instance.RegisterService(new SampleEventService<object>());
            MessageBus<object>.Instance.Trigger("ABC", this, "XYZ");
            MessageBus<object>.Instance.Trigger("ABC2", this, "XYZ");
            MessageBus<object>.Instance.Trigger("ABC3", this, "XYZ");


            //MessageBus<object>.Instance.RegisterService(new CoreEventService<object>());
            //MessageBus<object>.Instance.removeListener("ABC2");
            //MessageBus<object>.Instance.Trigger("ABC2", this, "XYZ");

            MessageBus<object>.Instance.RegisterService(new CoreEventService<object>());

            MessageBus<object>.Instance.Trigger(AppEvents.AppStart, this);
        }

        protected void Application_End()
        {
            MessageBus<object>.Instance.Trigger(AppEvents.AppEnd, this);
        }
        //https://stackoverflow.com/questions/45855363/enable-cors-in-mvc-controller
        protected void Application_BeginRequest()
        {
            if (Request.Headers.AllKeys.Contains("Origin") && Request.HttpMethod == "OPTIONS")
            {
                Response.Flush();
            }
        }
    }
}
