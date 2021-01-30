using System;
using System.Linq;
using System.Reflection;

namespace EventBus
{
    public class MessageBus<T>
    {
        private static MessageBus<T> _instance = null;
        private static readonly object _lock = new object();

        protected MessageBus()
        {
        }

        public static MessageBus<T> Instance
        {
            get
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new MessageBus<T>();
                    }
                    return _instance;
                }
            }
        }

        private event EventHandler<MessageBusEventArgs<T>> MessageRecieved;

        public void Trigger(string eventName, object sender=null, T Message = default)
        {
            foreach (var MessageRecieveditem in MessageRecieved.GetInvocationList())
            {
                var methodEventValue = (MessageRecieveditem.Target as Action<object, MessageBusEventArgs<T>>).Method.GetCustomAttribute<OnEventAttribute>();
                if (methodEventValue?.eventArgumentdata.Contains(eventName.ToLowerInvariant())??false)
                {
                    MessageRecieveditem.DynamicInvoke(new object[] {sender, new MessageBusEventArgs<T>(this,eventName.ToLowerInvariant(),Message) });
                }
            }
            //MessageRecieved?.Invoke(sender, new MessageBusEventArgs<T>(Message));
        }
       
        public void addListener(Action<object, MessageBusEventArgs<T>> @delegate)
        {
            MessageRecieved += new EventHandler<MessageBusEventArgs<T>>(@delegate);
        }
        public void removeListener(string eventName, Action<object, MessageBusEventArgs<T>> @delegate=default)
        {
            foreach (var MessageRecieveditem in MessageRecieved.GetInvocationList())
            {
                var _target = (MessageRecieveditem.Target as Action<object, MessageBusEventArgs<T>>);
                var methodEventValue = _target.Method.GetCustomAttribute<OnEventAttribute>();
                if ((methodEventValue?.eventArgumentdata.Contains(eventName.ToLowerInvariant()) ?? false) && (@delegate == default || @delegate == _target))
                {
                    methodEventValue.eventArgumentdata = methodEventValue?.eventArgumentdata.Where(e=>e.ToLowerInvariant()!= eventName.ToLowerInvariant()).ToArray();
                    if ((methodEventValue.eventArgumentdata?.Length ?? 0) == 0)
                    {
                        MessageRecieved -= new EventHandler<MessageBusEventArgs<T>>(_target);
                    }
                }
            }
        }
        public void RegisterService(object service)
        {
            try
            {

                var methods = service.GetType().GetMethods(BindingFlags.Public | BindingFlags.Instance)
                     .Where(m => m.GetCustomAttributes(typeof(OnEventAttribute), false).Length > 0)
                           .ToArray();
                foreach (var method in methods)
                {
                    Action<object, MessageBusEventArgs<T>> action = (Action<object, MessageBusEventArgs<T>>)Delegate.CreateDelegate(typeof(Action<object, MessageBusEventArgs<T>>), service, method);
                    addListener(action);
                }
            }
            catch (Exception ex)
            {

            }
        }
    }
}
