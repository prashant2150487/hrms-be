// utils/dateUtils.js
export const calculateWorkingDays = (startDate, endDate, holidays = []) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  // Make copies to avoid modifying the original dates
  const current = new Date(start);
  
  // Holiday dates for quick lookup
  const holidayDates = holidays.map(holiday => 
    new Date(holiday.date).toDateString()
  );
  
  // Iterate through each day between start and end date
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Check if it's a weekday (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check if it's not a holiday
      if (!holidayDates.includes(current.toDateString())) {
        workingDays++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

export const isHoliday = (date, holidays = []) => {
  const checkDate = new Date(date);
  return holidays.some(holiday => 
    new Date(holiday.date).toDateString() === checkDate.toDateString()
  );
};

export const isWeekend = (date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};