// src/pages/Calendar.js
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, IconButton, Container } from '@mui/material';
import { format, addDays, isSameDay, isAfter, isBefore, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getAllMessages } from '../services/messageService';
import { getAllChallenges } from '../services/challengeService';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { logOut } from '../services/authService';

function Calendar() {
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tripStart] = useState(new Date(2025, 4, 13)); // May 14, 2025
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

  const handleDayClick = (day) => {
    // Check if day is within trip dates and not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if ((isSameDay(day, today) || isBefore(day, today)) && 
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

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ color: '#590d22' }}>
          Love Calendar
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
          A special surprise for each day of your journey ❤️
        </Typography>
      </Paper>

      {loading ? (
        <Typography>Loading calendar...</Typography>
      ) : (
        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" align="center" sx={{ mb: 2 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          
          <Grid container spacing={1}>
            {getMonthDays().map((day) => (
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
                    cursor: isInTripRange(day) ? 'pointer' : 'default',
                    backgroundColor: isInTripRange(day) 
                      ? (isSameDay(day, new Date()) ? '#ffb3c1' : '#fff0f3') 
                      : '#f5f5f5',
                    opacity: isInTripRange(day) ? 1 : 0.5,
                    border: isSameDay(day, new Date()) ? '2px solid #ff4d6d' : 'none',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    {format(day, 'd')}
                  </Typography>
                  
                  {isInTripRange(day) && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                      {hasMessage(day) && (
                        <FavoriteIcon 
                          fontSize="small" 
                          sx={{ color: isUnlocked(day) ? '#ff4d6d' : '#a4a4a4' }} 
                        />
                      )}
                      {hasChallenge(day) && (
                        <EmojiEventsIcon 
                          fontSize="small" 
                          sx={{ color: isUnlocked(day) ? '#ff9e6d' : '#a4a4a4' }} 
                        />
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
        </Paper>
      )}
    </Container>
  );
}

export default Calendar;
