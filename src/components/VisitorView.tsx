import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { getQueueRoom, getQueueItems, joinQueue, getQueuePosition } from '../utils/queueHelpers';
import { supabase, setVisitorToken, activeSubscriptions } from '../utils/supabase';
import { QueueRoom, QueueItem, JoinQueueFormData } from '../types/models';

interface RouteParams {
  roomId: string;
}

const VisitorView: React.FC = () => {
  const { roomId } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [room, setRoom] = useState<QueueRoom | null>(null);
  const [formData, setFormData] = useState<JoinQueueFormData>({ name: '' });
  const [queueItem, setQueueItem] = useState<QueueItem | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joinLoading, setJoinLoading] = useState<boolean>(false);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  
  useEffect(() => {
    // Set the visitor token for Supabase RLS policies
    if (token) {
      setVisitorToken(token);
      setTokenValid(true);
    }
  }, [token]);
  
  useEffect(() => {
    if (!tokenValid || !roomId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch queue room details
        const roomData = await getQueueRoom(roomId);
        setRoom(roomData);
        
        // Fetch queue items to get waiting count
        const itemsData = await getQueueItems(roomId);
        const waiting = itemsData.filter(item => item.status === 'waiting').length;
        setWaitingCount(waiting);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load queue data. Please check your link or try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for queue items
    const channelId = `visitor-queue-${roomId}`;
    
    // Unsubscribe from previous subscription if exists
    if (activeSubscriptions[channelId]) {
      activeSubscriptions[channelId].unsubscribe();
      delete activeSubscriptions[channelId];
    }
    
    // Create new subscription
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_items',
        filter: `queue_room_id=eq.${roomId}`
      }, async () => {
        if (queueItem) {
          // If user has joined, update their position
          try {
            const newPosition = await getQueuePosition(roomId, queueItem.ticket_number);
            setPosition(newPosition);
          } catch (err) {
            console.error('Error getting position:', err);
          }
        }
        
        // Update waiting count
        try {
          const { data } = await supabase
            .from('queue_items')
            .select('id')
            .eq('queue_room_id', roomId)
            .eq('status', 'waiting');
          
          if (data) {
            setWaitingCount(data.length);
          }
        } catch (err) {
          console.error('Error getting waiting count:', err);
        }
      });
      
    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error('Failed to subscribe to real-time updates');
      }
    });
    
    // Store the subscription
    activeSubscriptions[channelId] = channel;
    
    return () => {
      // Clean up subscription
      if (activeSubscriptions[channelId]) {
        activeSubscriptions[channelId].unsubscribe();
        delete activeSubscriptions[channelId];
      }
    };
  }, [roomId, tokenValid, queueItem]);
  
  // If no token provided, redirect to home
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter your name to join the queue');
      return;
    }
    
    setJoinLoading(true);
    setError(null);
    
    try {
      const newItem = await joinQueue(roomId as string, formData.name);
      setQueueItem(newItem);
      
      // Get initial position
      const initialPosition = await getQueuePosition(roomId as string, newItem.ticket_number);
      setPosition(initialPosition);
    } catch (err: any) {
      console.error('Error joining queue:', err);
      setError('Failed to join queue. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading support queue...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }
  
  if (!room) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>Support queue not found</Alert>
      </Container>
    );
  }
  
  if (room.status === 'closed') {
    return (
      <Container maxWidth="md">
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            This support queue is currently closed
          </Typography>
          <Typography>
            Please check back later or contact HYROX staff directly.
          </Typography>
        </Alert>
      </Container>
    );
  }
  
  // If user has already joined the queue
  if (queueItem) {
    const isWaiting = queueItem.status === 'waiting';
    const isServing = queueItem.status === 'serving';
    const isComplete = ['completed', 'no_show'].includes(queueItem.status as any);
    
    let statusColor: "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning" = "default";
    let statusLabel = "";
    let StatusIcon = HourglassEmptyIcon;
    
    if (queueItem.status === 'waiting') {
      statusColor = 'primary';
      statusLabel = 'Waiting';
      StatusIcon = HourglassEmptyIcon;
    } else if (queueItem.status === 'serving') {
      statusColor = 'info';
      statusLabel = 'Being Served';
      StatusIcon = AccessTimeIcon;
    } else if (queueItem.status === 'completed') {
      statusColor = 'success';
      statusLabel = 'Completed';
      StatusIcon = CheckCircleIcon;
    } else if (queueItem.status === 'no_show') {
      statusColor = 'error';
      statusLabel = 'No Show';
      StatusIcon = PersonIcon;
    }
    
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              {room.name}
            </Typography>
            {room.description && (
              <Typography variant="subtitle1" color="text.secondary">
                {room.description}
              </Typography>
            )}
          </Box>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} display="flex" justifyContent="center" mb={1}>
                  <Chip 
                    icon={<StatusIcon />}
                    label={statusLabel}
                    color={statusColor}
                    sx={{ fontWeight: 500, px: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} textAlign="center">
                  <Typography variant="h3" component="div" gutterBottom>
                    #{queueItem.ticket_number}
                  </Typography>
                  <Typography variant="body1">Name: {queueItem.name}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              {isWaiting && position && (
                <Box textAlign="center">
                  <Typography variant="h5" gutterBottom>
                    Your Position: {position}
                  </Typography>
                  <Typography>
                    There {position === 1 ? 'is' : 'are'} {position} {position === 1 ? 'person' : 'people'} ahead of you
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Please keep this page open to maintain your place in the queue
                  </Typography>
                </Box>
              )}
              
              {isServing && (
                <Box textAlign="center">
                  <Typography variant="h5" color="primary" gutterBottom>
                    It's Your Turn!
                  </Typography>
                  <Typography>
                    Please proceed to the HYROX support staff
                  </Typography>
                </Box>
              )}
              
              {isComplete && (
                <Box textAlign="center">
                  <Typography variant="h5" gutterBottom>
                    Visit Complete
                  </Typography>
                  <Typography paragraph>
                    Thank you for visiting HYROX Customer Support!
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => window.location.reload()}
                  >
                    Join Queue Again
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Paper>
      </Container>
    );
  }
  
  // Join queue form
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            {room.name}
          </Typography>
          {room.description && (
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              {room.description}
            </Typography>
          )}
        </Box>
        
        <Box textAlign="center" mb={4}>
          <Paper sx={{ py: 2, px: 4, display: 'inline-block', bgcolor: 'background.default' }}>
            <Typography>
              There {waitingCount === 1 ? 'is' : 'are'} currently{' '}
              <strong>{waitingCount}</strong> {waitingCount === 1 ? 'person' : 'people'}{' '}
              in this support queue
            </Typography>
          </Paper>
        </Box>
        
        <Box component="form" onSubmit={handleJoinQueue} noValidate>
          <Typography variant="h5" align="center" gutterBottom>
            Join the Support Queue
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                name="name"
                label="Your Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={joinLoading}
                helperText="Required"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={joinLoading}
                startIcon={joinLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {joinLoading ? 'Joining...' : 'Join Queue'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default VisitorView; 