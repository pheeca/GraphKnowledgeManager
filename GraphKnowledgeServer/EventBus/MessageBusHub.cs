using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventBus
{
    public class MessageBusHub : Hub
    {
        public async Task Trigger(string id,bool bubbleToClients,string eventName, object message)
        {
            MessageBus<object>.Instance.Trigger(eventName, id, message,true);
            if (bubbleToClients)
            {
                Clients.All.receivemessage(eventName, message);
            }
        }

    }
}
