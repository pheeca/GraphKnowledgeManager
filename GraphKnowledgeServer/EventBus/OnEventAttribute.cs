using System;
using System.Linq;

namespace EventBus
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class OnEventAttribute : Attribute
    {
        public string[] eventArgumentdata { get; set; }
        public OnEventAttribute(params string[] eventNames)
        {
            eventArgumentdata = eventNames?.Select(eN=>eN.ToLowerInvariant())?.ToArray();
        }
    }
}