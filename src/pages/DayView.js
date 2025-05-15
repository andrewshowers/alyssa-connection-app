// src/pages/DayView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Container, 
  Divider,
  TextField,
  CircularProgress,
  IconButton,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { getMessagesByDate, markMessageAsViewed } from '../services/messageService';
import { getChallengesByDate, submitChallengeResponse } from '../services/challengeService';
import { isUnlocked, formatDateForDisplay } from '../utils/dateUtils';

function DayView() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [responseFile, setResponseFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [markedAsViewed, setMarkedAsViewed] = useState([]);
  
  const formattedDate = date ? formatDateForDisplay(parseISO(date)) : '';
  const parsedDate = date ? parseISO(date) : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!date) return;
        
        // Check if the requested day is unlocked
        if (parsedDate && !isUnlocked(parsedDate)) {
          navigate('/calendar');
          return;
        }
        
        const [fetchedMessages, fetchedChallenges] = await Promise.all([
          getMessagesByDate(parsedDate),
          getChallengesByDate(parsedDate)
        ]);
        
        setMessages(fetchedMessages);
        setChallenges(fetchedChallenges);
        
        // If there are challenges, set the first one as active
        if (fetchedChallenges.length > 0) {
          setActiveChallenge(fetchedChallenges[0].id);
        }
        
        // Check if user has already submitted responses to any challenges
        if (fetchedChallenges.length > 0) {
          const anyResponses = fetchedChallenges.some(challenge => 
            challenge.responses && Object.values(challenge.responses).length > 0
          );
          setSubmitted(anyResponses);
        }
      } catch (error) {
        console.error("Error fetching day data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, navigate, parsedDate]);

  // Track message views - FIXED to prevent duplicates
  useEffect(() => {
    const trackMessageViews = async () => {
      if (messages.length === 0 || loading) return;
      
      // Get message IDs we haven't tracked yet
      const unviewedMessages = messages.filter(
        message => !markedAsViewed.includes(message.id)
      );
      
      if (unviewedMessages.length === 0) return;
      
      // Track each unviewed message
      const newlyViewedIds = [];
      for (const message of unviewedMessages) {
        await markMessageAsViewed(message.id);
        newlyViewedIds.push(message.id);
      }
      
      // Update marked as viewed state once
      if (newlyViewedIds.length > 0) {
        setMarkedAsViewed(prev => [...prev, ...newlyViewedIds]);
      }
    };
    
    trackMessageViews();
    // Only run when messages or loading state changes, not when markedAsViewed changes
  }, [messages, loading]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResponseFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmitResponse = async (challengeId) => {
    if (!challengeId || (!responseText && !responseFile)) return;
    
    setSubmitting(true);
    try {
      await submitChallengeResponse(challengeId, responseText, responseFile);
      setSubmitted(true);
      setResponseText('');
      setResponseFile(null);
      setPreviewUrl('');
      
      // Refresh challenge data to show the response
      const refreshedChallenges = await getChallengesByDate(parsedDate);
      setChallenges(refreshedChallenges);
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderMessageContent = (message) => {
    if (!message) return null;
    
    switch (message.type) {
      case 'text':
        return (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {message.text}
          </Typography>
        );
      
      case 'image':
        return (
          <Box sx={{ mb: 2 }}>
            {message.text && (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {message.text}
              </Typography>
            )}
            <Card sx={{ maxWidth: '100%', mb: 2 }}>
              <CardMedia
                component="img"
                image={message.mediaUrl}
                alt="Special moment"
                sx={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            </Card>
          </Box>
        );
      
      case 'video':
        return (
          <Box sx={{ mb: 2 }}>
            {message.text && (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {message.text}
              </Typography>
            )}
            <Box sx={{ width: '100%', mb: 2 }}>
              <video 
                controls 
                width="100%" 
                style={{ maxHeight: '300px' }}
              >
                <source src={message.mediaUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Box>
          </Box>
        );
      
      default:
        return (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {message.text}
          </Typography>
        );
    }
  };

  const getChallengeResponses = (challenge) => {
    if (!challenge || !challenge.responses) return null;
    const responses = Object.values(challenge.responses);
    if (responses.length === 0) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Our Responses:
        </Typography>
        {responses.map((response, index) => (
          <Card key={index} sx={{ mb: 2, backgroundColor: '#fff0f3' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {response.displayName}
              </Typography>
              {response.text && (
                <Typography variant="body2" sx={{ mb: response.fileUrl ? 2 : 0 }}>
                  {response.text}
                </Typography>
              )}
              {response.fileUrl && (
                response.fileUrl.includes('image') ? (
                  <CardMedia
                    component="img"
                    image={response.fileUrl}
                    alt="Response image"
                    sx={{ maxHeight: '200px', objectFit: 'contain', mt: 1 }}
                  />
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      href={response.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Attachment
                    </Button>
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/calendar')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {formattedDate}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Display all messages */}
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <Paper 
                key={`message-${index}`}
                elevation={3} 
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 2,
                  backgroundImage: 'linear-gradient(to bottom right, #ffccd5, #ffc8dd)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FavoriteIcon sx={{ mr: 1, color: '#ff4d6d' }} />
                  <Typography variant="h6">
                    Daily Note {messages.length > 1 ? `#${index + 1}` : ''}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {renderMessageContent(message)}
              </Paper>
            ))
          ) : null}

          {/* Display all challenges */}
          {challenges.length > 0 ? (
            challenges.map((challenge, index) => (
              <Paper 
                key={`challenge-${index}`}
                elevation={3} 
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 2,
                  backgroundColor: '#fff0f3'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ mr: 1, color: '#ff9e6d' }} />
                  <Typography variant="h6">
                    Daily Challenge {challenges.length > 1 ? `#${index + 1}` : ''}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {challenge.prompt}
                </Typography>
                
                {!submitted ? (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      placeholder="Your response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        sx={{ mr: 2 }}
                      >
                        Add Photo
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleFileChange}
                        />
                      </Button>
                      
                      {responseFile && (
                        <Typography variant="body2" color="text.secondary">
                          {responseFile.name}
                        </Typography>
                      )}
                    </Box>
                    
                    {previewUrl && (
                      <Box sx={{ mb: 2 }}>
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            objectFit: 'contain' 
                          }} 
                        />
                      </Box>
                    )}
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSubmitResponse(challenge.id)}
                      disabled={submitting || (!responseText && !responseFile)}
                      sx={{ 
                        bgcolor: '#ff758f', 
                        '&:hover': { 
                          bgcolor: '#ff4d6d' 
                        } 
                      }}
                    >
                      {submitting ? <CircularProgress size={24} /> : 'Submit Response'}
                    </Button>
                  </Box>
                ) : (
                  getChallengeResponses(challenge)
                )}
              </Paper>
            ))
          ) : null}
          
          {messages.length === 0 && challenges.length === 0 && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                backgroundColor: '#fff0f3',
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                No content for today yet!
              </Typography>
              <Typography variant="body1">
                Check back later for a special surprise.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}

export default DayView;