const parseTimeToMinutes = timeStr => {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const trimmed = timeStr.trim();

  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
};

const doTimesOverlap = (start1, end1, start2, end2) => start1 < end2 && start2 < end1;

const getBookingEndMinutes = booking => {
  const startMinutes = parseTimeToMinutes(booking.startTime);
  if (startMinutes === null) {
    return null;
  }

  let endMinutes = parseTimeToMinutes(booking.endTime);
  if (endMinutes === null || endMinutes <= startMinutes) {
    const duration = Number(booking.duration);
    if (duration > 0) {
      endMinutes = startMinutes + duration * 60;
    }
  }

  return endMinutes;
};

const parseCalendarDate = dateInput => {
  if (!dateInput) {
    return null;
  }

  if (typeof dateInput === 'string') {
    const dateOnlyMatch = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10) - 1;
      const day = parseInt(dateOnlyMatch[3], 10);
      const parsed = new Date(year, month, day, 0, 0, 0, 0);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
};

const getDayRange = dateInput => {
  const calendarDate = parseCalendarDate(dateInput);
  if (!calendarDate) {
    throw new Error('Invalid date');
  }

  const start = new Date(calendarDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(calendarDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getMinimumBookingDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

const isBookingDateAllowed = dateInput => {
  const bookingDay = parseCalendarDate(dateInput);
  if (!bookingDay) {
    return false;
  }

  return bookingDay >= getMinimumBookingDate();
};

const hasBookingOverlap = (requestedStartTime, requestedEndTime, existingBookings) => {
  const newStart = parseTimeToMinutes(requestedStartTime);
  const newEnd = parseTimeToMinutes(requestedEndTime);

  if (newStart === null || newEnd === null || newEnd <= newStart) {
    return null;
  }

  for (const booking of existingBookings) {
    const existingStart = parseTimeToMinutes(booking.startTime);
    const existingEnd = getBookingEndMinutes(booking);

    if (
      existingStart !== null &&
      existingEnd !== null &&
      doTimesOverlap(newStart, newEnd, existingStart, existingEnd)
    ) {
      return booking;
    }
  }

  return null;
};

const normalizeWorkTime = timeStr => {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const isWithinWorkingHours = (startTime, endTime, workStartTime, workEndTime) => {
  const normalizedWorkStart = normalizeWorkTime(workStartTime);
  const normalizedWorkEnd = normalizeWorkTime(workEndTime);

  if (!normalizedWorkStart || !normalizedWorkEnd) {
    return true;
  }

  const bookingStart = parseTimeToMinutes(startTime);
  const bookingEnd = parseTimeToMinutes(endTime);
  const workStart = parseTimeToMinutes(normalizedWorkStart);
  const workEnd = parseTimeToMinutes(normalizedWorkEnd);

  if (
    bookingStart === null ||
    bookingEnd === null ||
    workStart === null ||
    workEnd === null ||
    workEnd <= workStart
  ) {
    return true;
  }

  return bookingStart >= workStart && bookingEnd <= workEnd;
};

module.exports = {
  parseTimeToMinutes,
  parseCalendarDate,
  doTimesOverlap,
  getBookingEndMinutes,
  getDayRange,
  getMinimumBookingDate,
  isBookingDateAllowed,
  hasBookingOverlap,
  normalizeWorkTime,
  isWithinWorkingHours,
};
