const validateTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const validateTimeRange = (start, end) => {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  return endTime > startTime;
};

const validateBreakTime = (breakTime, openTime, closeTime) => {
  if (!breakTime) return true;
  
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  const [breakStartHour, breakStartMinute] = breakTime.start.split(':').map(Number);
  const [breakEndHour, breakEndMinute] = breakTime.end.split(':').map(Number);
  
  const openTimeMinutes = openHour * 60 + openMinute;
  const closeTimeMinutes = closeHour * 60 + closeMinute;
  const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
  const breakEndMinutes = breakEndHour * 60 + breakEndMinute;
  
  return (
    breakStartMinutes > openTimeMinutes &&
    breakEndMinutes < closeTimeMinutes &&
    breakEndMinutes > breakStartMinutes
  );
};

const validateBusinessHours = (businessHours) => {
  const errors = [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!businessHours || typeof businessHours !== 'object') {
    errors.push('Business hours must be an object');
    return errors;
  }

  days.forEach(day => {
    const dayHours = businessHours[day];
    
    if (!dayHours) {
      errors.push(`Missing hours for ${day}`);
      return;
    }

    if (dayHours.isClosed === true) {
      return; // Skip validation for closed days
    }

    // Validate open time
    if (!dayHours.open || !validateTimeFormat(dayHours.open)) {
      errors.push(`Invalid open time format for ${day}`);
    }

    // Validate close time
    if (!dayHours.close || !validateTimeFormat(dayHours.close)) {
      errors.push(`Invalid close time format for ${day}`);
    }

    // Validate time range
    if (dayHours.open && dayHours.close && !validateTimeRange(dayHours.open, dayHours.close)) {
      errors.push(`Close time must be after open time for ${day}`);
    }

    // Validate break time if present
    if (dayHours.break) {
      if (!dayHours.break.start || !validateTimeFormat(dayHours.break.start)) {
        errors.push(`Invalid break start time format for ${day}`);
      }
      
      if (!dayHours.break.end || !validateTimeFormat(dayHours.break.end)) {
        errors.push(`Invalid break end time format for ${day}`);
      }
      
      if (
        dayHours.break.start &&
        dayHours.break.end &&
        dayHours.open &&
        dayHours.close &&
        !validateBreakTime(dayHours.break, dayHours.open, dayHours.close)
      ) {
        errors.push(`Break time must be within business hours for ${day}`);
      }
    }
  });

  return errors;
};

module.exports = {
  validateBusinessHours
}; 