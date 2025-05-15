// src/pages/Calendar.js
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Container, Button, CircularProgress } from '@mui/material';
import { 
  format, 
  addDays, 
  isSameDay, 
  isAfter, 
  isBefore, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getAllMessages } from '../services/messageService';
import { getAllChallenges } from '../services/challengeService';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { logOut } from '../services/authService';
import { isUnlocked, getTodayInJapan, formatDateForDisplay } from '../utils/dateUtils';

function Calendar() {
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tripStart] = useState(new Date(2025, 4, 13)); // May 13, 2025
  const [tripEnd] = useState(new Date(2025, 5, 27)); // June 27, 2025
  const navigate = useNavigate();
  const todayInJapan = getTodayInJapan();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedMessages = await getAllMessages();
        const fetchedChallenges = await getAllChallenges();
        setMessages(fetchedMessages);
        setChallenges(fetchedChallenges);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get all days that need to be displayed in the calendar
  const getCalendarDays = () => {
    // Get the first day of the month
    const firstDayOfMonth = startOfMonth(currentMonth);
    // Get the start of the week for the first day (Sunday)
    const startDay = startOfWeek(firstDayOfMonth);
    
    // Get the last day of the month
    const lastDayOfMonth = endOfMonth(currentMonth);
    // Get the end of the week for the last day (Saturday)
    const endDay = endOfWeek(lastDayOfMonth);
    
    // Get all days from start to end
    return eachDayOfInterval({ start: startDay, end: endDay });
  };

  // Organize days into weeks for rendering
  const getCalendarWeeks = () => {
    const days = getCalendarDays();
    const weeks = [];
    let currentWeek = [];
    
    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const handleDayClick = (day) => {
    // Check if day is within trip dates and is unlocked (using Japan's date as reference)
    if (isUnlocked(day) && 
        (isSameDay(day, tripStart) || isAfter(day, tripStart)) && 
        (isSameDay(day, tripEnd) || isBefore(day, tripEnd))) {
      navigate(`/day/${format(day, 'yyyy-MM-dd')}`);
    }
  };

  const hasMessage = (day) => {
    return messages.some(message => isSameDay(message.date, day));
  };

  const hasChallenge = (day) => {
    return challenges.some(challenge => isSameDay(challenge.date, day));
  };

  // Count messages and challenges for a specific day
  const countMessagesForDay = (day) => {
    return messages.filter(message => isSameDay(message.date, day)).length;
  };

  const countChallengesForDay = (day) => {
    return challenges.filter(challenge => isSameDay(challenge.date, day)).length;
  };

  const isInTripRange = (day) => {
    return (isSameDay(day, tripStart) || isAfter(day, tripStart)) && 
           (isSameDay(day, tripEnd) || isBefore(day, tripEnd));
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ color: '#590d22' }}>
          Connection Calendar
        </Typography>
        <Typography 
          variant="body2" 
          onClick={handleSignOut} 
          sx={{ cursor: 'pointer', color: '#ff4d6d', textDecoration: 'underline' }}
        >
          Sign Out
        </Typography>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 4, 
          backgroundColor: '#ffccd5', 
          color: '#590d22',
          borderRadius: 2
        }}
      >
        <Typography variant="body1" align="center">
          A special surprise for each day of your trip ❤️
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 2, pb: 3, borderRadius: 2 }}>
          {/* Month navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6" align="center">
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth} size="small">
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Fixed table layout for calendar */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ 
              display: 'table', 
              width: '100%', 
              borderCollapse: 'separate',
              borderSpacing: '5px',
              tableLayout: 'fixed'
            }}>
              {/* Day names header row */}
              <Box sx={{ display: 'table-row' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Box 
                    key={`header-${i}`} 
                    sx={{ 
                      display: 'table-cell', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1
                    }}
                  >
                    {day}
                  </Box>
                ))}
              </Box>
              
              {/* Calendar weeks */}
              {getCalendarWeeks().map((week, weekIndex) => (
                <Box key={`week-${weekIndex}`} sx={{ display: 'table-row' }}>
                  {week.map((day) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, todayInJapan);
                    const inTripRange = isInTripRange(day);
                    const dayUnlocked = isUnlocked(day);
                    const hasMsg = hasMessage(day);
                    const hasChall = hasChallenge(day);
                    
                    return (
                      <Box 
                        key={day.toString()}
                        onClick={() => isCurrentMonth && inTripRange && dayUnlocked && handleDayClick(day)}
                        sx={{
                          display: 'table-cell',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          position: 'relative',
                          height: { xs: '40px', sm: '50px' },
                          padding: '6px 0',
                          cursor: isCurrentMonth && inTripRange && dayUnlocked ? 'pointer' : 'default',
                          backgroundColor: !isCurrentMonth ? '#f5f5f5' : 
                                          inTripRange ? (isToday ? '#ffb3c1' : '#fff0f3') : '#f5f5f5',
                          opacity: isCurrentMonth && inTripRange ? 1 : 0.5,
                          border: isToday ? '2px solid #ff4d6d' : '1px solid #eee',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': isCurrentMonth && inTripRange && dayUnlocked ? {
                            backgroundColor: '#ffc8dd'
                          } : {},
                        }}
                      >
                        {/* Day number */}
                        <Typography 
                          variant="body2"
                          sx={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            fontSize: '14px',
                            lineHeight: 1,
                            mb: 0.5
                          }}
                        >
                          {format(day, 'd')}
                        </Typography>
                        
                        {/* Icons container with fixed height */}
                        {isCurrentMonth && inTripRange && (
                          <Box 
                            sx={{ 
                              height: '18px', 
                              display: 'flex', 
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {hasMsg && (
                              <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                <FavoriteIcon 
                                  sx={{ 
                                    fontSize: '16px',
                                    color: dayUnlocked ? '#ff4d6d' : '#a4a4a4' 
                                  }} 
                                />
                                {countMessagesForDay(day) > 1 && (
                                  <Box sx={{ 
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    backgroundColor: '#ff4d6d',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '14px',
                                    height: '14px',
                                    fontSize: '10px',
                                    lineHeight: 1.4,
                                    fontWeight: 'bold'
                                  }}>
                                    {countMessagesForDay(day)}
                                  </Box>
                                )}
                              </Box>
                            )}
                            {hasChall && (
                              <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                <EmojiEventsIcon 
                                  sx={{ 
                                    fontSize: '16px',
                                    color: dayUnlocked ? '#ff9e6d' : '#a4a4a4' 
                                  }} 
                                />
                                {countChallengesForDay(day) > 1 && (
                                  <Box sx={{ 
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    backgroundColor: '#ff9e6d',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '14px',
                                    height: '14px',
                                    fontSize: '10px',
                                    lineHeight: 1.4,
                                    fontWeight: 'bold'
                                  }}>
                                    {countChallengesForDay(day)}
                                  </Box>
                                )}
                              </Box>
                            )}
                            {!dayUnlocked && (
                              <LockIcon 
                                sx={{ 
                                  fontSize: '16px',
                                  color: '#a4a4a4' 
                                }} 
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin')} 
          sx={{ 
            bgcolor: '#ff758f', 
            '&:hover': { bgcolor: '#ff4d6d' } 
          }}
        >
          Admin Panel
        </Button>
      </Box>
    </Container>
  );
}

export default Calendar;
