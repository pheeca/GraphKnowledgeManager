using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventBus.EventServiceRepository
{
    public class SampleEventService<T>
    {
        [OnEvent("ABC", "ABC3")]
        public void Test(object sender, MessageBusEventArgs<T> e)
        {
            e._bus.Trigger("ABC2");
            Console.WriteLine("The threshold was reached.");
        }
        [OnEvent("ABC2")]
        public void Test2(object sender, MessageBusEventArgs<T> e)
        {
            Console.WriteLine("The threshold was reached.");
        }
    }
}
