// src/pages/Admin.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Divider,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { createMessage, getAllMessages } from '../services/messageService';
import { createChallenge, getAllChallenges } from '../services/challengeService';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState('text');
  const [messageText, setMessageText] = useState('');
  const [messageDate, setMessageDate] = useState(new Date());
  const [messageFile, setMessageFile] = useState(null);
  const [challengePrompt, setChallengePrompt] = useState('');
  const [challengeDate, setChallengeDate] = useState(new Date());
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Trip date range
  const [tripStart] = useState(new Date(2025, 4, 13)); // May 13, 2025
  const [tripEnd] = useState(new Date(2025, 5, 27)); // June 27, 2025

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedMessages, fetchedChallenges] = await Promise.all([
          getAllMessages(),
          getAllChallenges()
        ]);
        
        setMessages(fetchedMessages);
        setChallenges(fetchedChallenges);
      } catch (error) {
        console.error("Error fetching data:", error);
        showNotification("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMessageFile(file);
      
      // Create preview URL for image files
      if (file.type.startsWith('image/')) {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setPreviewUrl(fileReader.result);
        };
        fileReader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleMessageSubmit = async () => {
    if (!messageText || !messageDate) {
      showNotification("Please fill all required fields", "error");
      return;
    }
    
    if ((messageType === 'image' || messageType === 'video') && !messageFile) {
      showNotification("Please upload a file for image or video message", "error");
      return;
    }
    
    // Validate date is within trip range
    if (isBefore(messageDate, tripStart) || isAfter(messageDate, tripEnd)) {
      showNotification("Date must be within the trip range", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      await createMessage({
        text: messageText,
        date: messageDate,
        type: messageType
      }, {
        media: messageFile
      });
      
      // Reset form
      setMessageText('');
      setMessageType('text');
      setMessageFile(null);
      setPreviewUrl('');
      
      // Refresh messages
      const fetchedMessages = await getAllMessages();
      setMessages(fetchedMessages);
      
      showNotification("Message created successfully", "success");
    } catch (error) {
      console.error("Error creating message:", error);
      showNotification("Failed to create message", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChallengeSubmit = async () => {
    if (!challengePrompt || !challengeDate) {
      showNotification("Please fill all required fields", "error");
      return;
    }
    
    // Validate date is within trip range
    if (isBefore(challengeDate, tripStart) || isAfter(challengeDate, tripEnd)) {
      showNotification("Date must be within the trip range", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      await createChallenge({
        prompt: challengePrompt,
        date: challengeDate
      });
      
      // Reset form
      setChallengePrompt('');
      
      // Refresh challenges
      const fetchedChallenges = await getAllChallenges();
      setChallenges(fetchedChallenges);
      
      showNotification("Challenge created successfully", "success");
    } catch (error) {
      console.error("Error creating challenge:", error);
      showNotification("Failed to create challenge", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      show: true,
      message,
      severity
    });
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 5000);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/calendar')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Admin Panel
          </Typography>
        </Box>
        
        {notification.show && (
          <Alert 
            severity={notification.severity} 
            sx={{ mb: 3 }}
            onClose={() => setNotification({ ...notification, show: false })}
          >
            {notification.message}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          {/* Create Message Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Create Daily Message
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Message Type</InputLabel>
                <Select
                  value={messageType}
                  label="Message Type"
                  onChange={(e) => setMessageType(e.target.value)}
                >
                  <MenuItem value="text">Text Only</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Message Text"
                multiline
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                fullWidth
                required
                sx={{ mb: 3 }}
              />
              
              <DatePicker
                label="Message Date"
                value={messageDate}
                onChange={(newDate) => setMessageDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 3 }} />}
                minDate={tripStart}
                maxDate={tripEnd}
                sx={{ mb: 3 }}
              />
              
              {(messageType === 'image' || messageType === 'video') && (
                <>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Upload {messageType === 'image' ? 'Image' : 'Video'}
                    <input
                      type="file"
                      accept={messageType === 'image' ? 'image/*' : 'video/*'}
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  
                  {messageFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Selected file: {messageFile.name}
                    </Typography>
                  )}
                  
                  {previewUrl && messageType === 'image' && (
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '200px' }} 
                      />
                    </Box>
                  )}
                </>
              )}
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleMessageSubmit}
                disabled={submitting}
                sx={{ 
                  bgcolor: '#ff758f', 
                  '&:hover': { 
                    bgcolor: '#ff4d6d' 
                  } 
                }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Create Message'}
              </Button>
            </Paper>
          </Grid>
          
          {/* Create Challenge Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Create Daily Challenge
              </Typography>
              
              <TextField
                label="Challenge Prompt"
                multiline
                rows={4}
                value={challengePrompt}
                onChange={(e) => setChallengePrompt(e.target.value)}
                fullWidth
                required
                sx={{ mb: 3 }}
                placeholder="e.g., Take a photo of something blue today"
              />
              
              <DatePicker
                label="Challenge Date"
                value={challengeDate}
                onChange={(newDate) => setChallengeDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 3 }} />}
                minDate={tripStart}
                maxDate={tripEnd}
                sx={{ mb: 3 }}
              />
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleChallengeSubmit}
                disabled={submitting}
                sx={{ 
                  bgcolor: '#ff758f', 
                  '&:hover': { 
                    bgcolor: '#ff4d6d' 
                  } 
                }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Create Challenge'}
              </Button>
            </Paper>
          </Grid>
          
          {/* Preview Section */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Content Preview
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Messages ({messages.length})
                    </Typography>
                    
                    {messages.length === 0 ? (
                      <Typography color="text.secondary">
                        No messages created yet
                      </Typography>
                    ) : (
                      messages.map((msg) => (
                        <Card key={msg.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                              {format(msg.date, 'MMMM d, yyyy')} - {msg.type}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {msg.text.length > 100 
                                ? `${msg.text.substring(0, 100)}...` 
                                : msg.text}
                            </Typography>
                            {msg.mediaUrl && (
                              <Typography variant="body2" color="text.secondary">
                                Has media attachment
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Challenges ({challenges.length})
                    </Typography>
                    
                    {challenges.length === 0 ? (
                      <Typography color="text.secondary">
                        No challenges created yet
                      </Typography>
                    ) : (
                      challenges.map((challenge) => (
                        <Card key={challenge.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                              {format(challenge.date, 'MMMM d, yyyy')}
                            </Typography>
                            <Typography variant="body2">
                              {challenge.prompt.length > 100 
                                ? `${challenge.prompt.substring(0, 100)}...` 
                                : challenge.prompt}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}

export default Admin;
