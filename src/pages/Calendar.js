// src/pages/Calendar.js
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, IconButton, Container, Badge, Button, CircularProgress } from '@mui/material';
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

function Calendar() {
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tripStart] = useState(new Date(2025, 4, 13)); // May 13, 2025
  const [tripEnd] = useState(new Date(2025, 5, 27)); // June 27, 2025
  const navigate = useNavigate();

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

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getCalendarDays = () => {
    // Get all days in the current month
    const monthDays = getMonthDays();
    
    // Get the start of the first week (Sunday)
    const firstDayOfMonth = monthDays[0];
    const startDay = startOfWeek(firstDayOfMonth);
    
    // Get the end of the last week (Saturday)
    const lastDayOfMonth = monthDays[monthDays.length - 1];
    const endDay = endOfWeek(lastDayOfMonth);
    
    // Get all days from start to end
    const allDays = eachDayOfInterval({ start: startDay, end: endDay });
    
    // Group days into weeks
    const weeks = [];
    let currentWeek = [];
    
    allDays.forEach(day => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const handleDayClick = (day) => {
    // Check if day is within trip dates and not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if ((isSameDay(day, today) || isBefore(day, today)) && 
        (isSameDay(day, tripStart) || isAfter(day, tripStart)) && 
        (isSameDay(day, tripEnd) || isBefore(day, tripEnd)) &&
        isSameMonth(day, currentMonth)) {
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

  const isUnlocked = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isSameDay(day, today) || isBefore(day, today);
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
        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
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
          
          {/* Day names row */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
              <Grid item xs={12/7} key={`day-${index}`} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {dayName}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {/* Calendar grid with proper weeks */}
          {getCalendarDays().map((week, weekIndex) => (
            <Grid container spacing={1} key={`week-${weekIndex}`}>
              {week.map((day) => (
                <Grid item xs={12/7} key={day.toString()}>
                  <Paper
                    elevation={0}
                    onClick={() => handleDayClick(day)}
                    sx={{
                      p: 1,
                      height: '70px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isInTripRange(day) && isSameMonth(day, currentMonth) ? 'pointer' : 'default',
                      backgroundColor: isInTripRange(day) && isSameMonth(day, currentMonth)
                        ? (isSameDay(day, new Date()) ? '#ffb3c1' : '#fff0f3') 
                        : '#f5f5f5',
                      opacity: isInTripRange(day) && isSameMonth(day, currentMonth) ? 1 : 0.5,
                      border: isSameDay(day, new Date()) ? '2px solid #ff4d6d' : 'none',
                      borderRadius: 1
                    }}
                  >
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: isSameMonth(day, currentMonth) ? 'inherit' : '#aaa'
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    
                    {isInTripRange(day) && isSameMonth(day, currentMonth) && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                        {hasMessage(day) && (
                          <Badge 
                            badgeContent={countMessagesForDay(day) > 1 ? countMessagesForDay(day) : 0} 
                            color="primary"
                            sx={{ 
                              '& .MuiBadge-badge': { 
                                backgroundColor: '#ff4d6d',
                                fontSize: '0.7rem',
                                minWidth: '16px',
                                height: '16px',
                                padding: '0 4px'
                              }
                            }}
                          >
                            <FavoriteIcon 
                              fontSize="small" 
                              sx={{ color: isUnlocked(day) ? '#ff4d6d' : '#a4a4a4' }} 
                            />
                          </Badge>
                        )}
                        {hasChallenge(day) && (
                          <Badge 
                            badgeContent={countChallengesForDay(day) > 1 ? countChallengesForDay(day) : 0} 
                            color="primary"
                            sx={{ 
                              '& .MuiBadge-badge': { 
                                backgroundColor: '#ff9e6d',
                                fontSize: '0.7rem',
                                minWidth: '16px',
                                height: '16px',
                                padding: '0 4px'
                              }
                            }}
                          >
                            <EmojiEventsIcon 
                              fontSize="small" 
                              sx={{ color: isUnlocked(day) ? '#ff9e6d' : '#a4a4a4' }} 
                            />
                          </Badge>
                        )}
                        {!isUnlocked(day) && (
                          <LockIcon fontSize="small" sx={{ color: '#a4a4a4' }} />
                        )}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ))}
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
