using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventBus
{
    public class MessageBusEventArgs<T> : EventArgs
    {
        private T _message;
        private string _eventName;
        public MessageBus<T> _bus;

        public MessageBusEventArgs(MessageBus<T> bus, string eventName,T Message)
        {
            _message = Message;
            _eventName = eventName;
            _bus = bus;
        }

        public T Message
        {
            get
            {
                return _message;
            }
        }
    }
}
