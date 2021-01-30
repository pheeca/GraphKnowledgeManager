using EventBus.EventRepository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace EventBus.EventServiceRepository
{
    public class CoreEventService<T>
    {
        Timer systemTickTimer;
        DateTime _previous;
        [OnEvent(AppEvents.AppStart, AppEvents.AppTimeIntervalIncreased)]
        public void SystemTick(object sender, MessageBusEventArgs<T> e)
        {
            if (systemTickTimer==null)
            {
                systemTickTimer = new Timer(new TimerCallback(_ => e._bus.Trigger(AppEvents.AppTimeIntervalIncreased)), e, 0, 1000);
                _previous = DateTime.UtcNow;
            }
            if (_previous.Minute != DateTime.UtcNow.Minute)
            {
                e._bus.Trigger(AppEvents.AppTimeIntervalIncreasedMinute);
            }
            if (_previous.Hour != DateTime.UtcNow.Hour)
            {
                e._bus.Trigger(AppEvents.AppTimeIntervalIncreasedHour);
            }
            if (_previous.Day != DateTime.UtcNow.Day)
            {
                e._bus.Trigger(AppEvents.AppTimeIntervalIncreasedDay);
            }
            if (_previous.DayOfWeek != DateTime.UtcNow.DayOfWeek && DayOfWeek.Sunday == DateTime.UtcNow.DayOfWeek)
            {
                e._bus.Trigger(AppEvents.AppTimeIntervalIncreasedWeek);
            }
            if (_previous.Month != DateTime.UtcNow.Month)
            {
                e._bus.Trigger(AppEvents.AppTimeIntervalIncreasedMonth);
            }
            if (_previous.Year != DateTime.UtcNow.Year)
            {
                e._bus.Trigger(AppEvents.AppTimeIntervalIncreasedYear);
            }
            _previous = DateTime.UtcNow;
            Console.WriteLine("The threshold was reached.");
        }

        [OnEvent(AppEvents.AppEnd)]
        public void AppEnd(object sender, MessageBusEventArgs<T> e)
        {
            systemTickTimer.Dispose();
        }
    }
}
