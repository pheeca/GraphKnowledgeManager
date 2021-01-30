using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventBus.EventRepository
{
    public class AppEvents
    {
        public const string AppStart = "APP.Start";
        public const string AppEnd = "APP.END";
        public const string AppTimeIntervalIncreased = "APP.TimeIntervalIncreased";
        public const string AppTimeIntervalIncreasedMinute = "APP.AppTimeIntervalIncreased.Minute";
        public const string AppTimeIntervalIncreasedHour = "APP.AppTimeIntervalIncreased.Hour";
        public const string AppTimeIntervalIncreasedDay = "APP.AppTimeIntervalIncreased.Day";
        public const string AppTimeIntervalIncreasedWeek = "APP.AppTimeIntervalIncreased.Week";
        public const string AppTimeIntervalIncreasedMonth = "APP.AppTimeIntervalIncreased.Month";
        public const string AppTimeIntervalIncreasedYear = "APP.AppTimeIntervalIncreased.Year";
        public const string AppException = "APP.Exception";
    }
}
