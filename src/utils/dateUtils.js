// src/utils/dateUtils.js
import { format, isSameDay, isBefore, addDays, subDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Define Japan as the reference time zone 
export const REFERENCE_TIMEZONE = 'Asia/Tokyo';

// Get the current time in Japan
export const getCurrentTimeInJapan = () => {
  const nowUtc = new Date();
  return toZonedTime(nowUtc, REFERENCE_TIMEZONE);
};

// Get the reference date in Japan (7 AM today or yesterday)
export const getTodayInJapan = () => {
  const nowInJapan = getCurrentTimeInJapan();
  
  // Create a date set to 7 AM today in Japan
  const todayAt7AMInJapan = new Date(nowInJapan);
  todayAt7AMInJapan.setHours(7, 0, 0, 0);
  
  // If current time is before 7 AM, use yesterday's date as the reference
  if (nowInJapan < todayAt7AMInJapan) {
    const yesterday = new Date(nowInJapan);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  }
  
  // Otherwise use today's date
  const today = new Date(nowInJapan);
  today.setHours(0, 0, 0, 0);
  return today;
};

// Check if a day is unlocked (available) based on Japan's date at 7 AM
export const isUnlocked = (day) => {
  const referenceDate = getTodayInJapan();
  
  // Convert day to start of day for comparison
  const dayStartOfDay = new Date(day);
  dayStartOfDay.setHours(0, 0, 0, 0);
  
  return isSameDay(dayStartOfDay, referenceDate) || isBefore(dayStartOfDay, referenceDate);
};

// Format a date for display
export const formatDateForDisplay = (date, formatString = 'MMMM d, yyyy') => {
  return format(date, formatString);
};

// For debugging - get current reference time in Japan as a string
export const getCurrentJapanTimeString = () => {
  const nowInJapan = getCurrentTimeInJapan();
  const unlockReference = getTodayInJapan();
  return `Current time: ${format(nowInJapan, 'yyyy-MM-dd HH:mm:ss')} - Reference day: ${format(unlockReference, 'yyyy-MM-dd')}`;
};
