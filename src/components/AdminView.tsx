import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode2';
import QRCode from 'qrcode.react';
import { getQueueRoom, getQueueItems, updateQueueItemStatus } from '../utils/queueHelpers';
import { supabase, setAdminToken, activeSubscriptions } from '../utils/supabase';
import QueueItem from './QueueItem';
import { QueueRoom, QueueItem as QueueItemType, QueueItemStatus } from '../types/models';

// Updated RouteParams to satisfy React Router v6 constraints
type RouteParams = {
  roomId: string;
}

const AdminView: React.FC = () => {
  const { roomId } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [room, setRoom] = useState<QueueRoom | null>(null);
  const [items, setItems] = useState<QueueItemType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    // Set the admin token for Supabase RLS policies
    if (token) {
      setAdminToken(token);
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
        
        // Fetch queue items
        const itemsData = await getQueueItems(roomId);
        setItems(itemsData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load queue data. Please check your link or try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for queue items using the newer channel API
    const channelId = `admin-queue-${roomId}`;
    
    // Unsubscribe from previous subscription if exists
    if (activeSubscriptions[channelId]) {
      activeSubscriptions[channelId].unsubscribe();
      delete activeSubscriptions[channelId];
    }
    
    // Create new subscription
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'queue_items',
        filter: `queue_room_id=eq.${roomId}`
      }, (payload: { new: QueueItemType }) => {
        setItems((current: QueueItemType[]) => [...current, payload.new]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'queue_items',
        filter: `queue_room_id=eq.${roomId}`
      }, (payload: { new: QueueItemType }) => {
        setItems((current: QueueItemType[]) => 
          current.map((item: QueueItemType) => item.id === payload.new.id ? payload.new : item)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'queue_items',
        filter: `queue_room_id=eq.${roomId}`
      }, (payload: { old: { id: string } }) => {
        setItems((current: QueueItemType[]) => 
          current.filter((item: QueueItemType) => item.id !== payload.old.id)
        );
      });
    
    // Subscribe to the channel
    channel.subscribe((status: string) => {
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
  }, [roomId, tokenValid]);
  
  // If no token provided, redirect to home
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const handleUpdateStatus = async (itemId: string, newStatus: QueueItemStatus) => {
    try {
      await updateQueueItemStatus(itemId, newStatus);
      // The real-time subscription will update the UI
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    }
  };
  
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleCopyLink = () => {
    if (!room) return;
    
    const visitorUrl = `${window.location.origin}/join/${roomId}?token=${room.visitor_token}`;
    navigator.clipboard.writeText(visitorUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
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
  
  // Filter items by status
  const waitingItems = items.filter((item: QueueItemType) => item.status === 'waiting');
  const servingItems = items.filter((item: QueueItemType) => item.status === 'serving');
  const completedItems = items.filter((item: QueueItemType) => 
    item.status === 'completed' || item.status === 'no_show'
  );
  
  const visitorUrl = `${window.location.origin}/join/${roomId}?token=${room.visitor_token}`;
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box textAlign="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            {room.name}
          </Typography>
          {room.description && (
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              {room.description}
            </Typography>
          )}
          <Chip 
            label={room.status === 'active' ? 'Active' : room.status === 'paused' ? 'Paused' : 'Closed'}
            color={room.status === 'active' ? 'success' : room.status === 'paused' ? 'warning' : 'error'}
            sx={{ fontWeight: 500 }}
          />
        </Box>
        
        <Card sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Share this link with HYROX participants to join the queue:
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              fullWidth
              value={visitorUrl}
              InputProps={{ readOnly: true }}
              size="small"
              onClick={(e: React.MouseEvent<HTMLInputElement>) => (e.target as HTMLInputElement).select()}
              sx={{ mr: 1 }}
            />
            <IconButton 
              color={copySuccess ? 'success' : 'primary'} 
              onClick={handleCopyLink}
              aria-label="Copy visitor link"
            >
              <ContentCopyIcon />
            </IconButton>
            <IconButton 
              color="primary" 
              onClick={() => setQrDialogOpen(true)}
              aria-label="Show QR code"
            >
              <QrCodeIcon />
            </IconButton>
          </Box>
        </Card>
      </Paper>
      
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>Visitor QR Code</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={2}>
            <QRCode 
              value={visitorUrl}
              size={200}
              level="H"
              includeMargin
              renderAs="svg"
            />
          </Box>
          <Typography align="center" variant="body2" color="text.secondary">
            Scan to join the queue
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleCopyLink();
              setQrDialogOpen(false);
            }}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>
      
      <Paper elevation={2} sx={{ p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label={`Waiting (${waitingItems.length})`} />
          <Tab label={`Serving (${servingItems.length})`} />
          <Tab label={`Completed (${completedItems.length})`} />
        </Tabs>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box px={1} py={2}>
          {activeTab === 0 && (
            <div>
              {waitingItems.length === 0 ? (
                <Typography align="center" color="text.secondary" py={4}>
                  No one is waiting in the queue
                </Typography>
              ) : (
                waitingItems.map((item: QueueItemType) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isAdmin={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          )}
          
          {activeTab === 1 && (
            <div>
              {servingItems.length === 0 ? (
                <Typography align="center" color="text.secondary" py={4}>
                  No one is being served
                </Typography>
              ) : (
                servingItems.map((item: QueueItemType) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isAdmin={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          )}
          
          {activeTab === 2 && (
            <div>
              {completedItems.length === 0 ? (
                <Typography align="center" color="text.secondary" py={4}>
                  No completed visits
                </Typography>
              ) : (
                completedItems.map((item: QueueItemType) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isAdmin={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminView; 