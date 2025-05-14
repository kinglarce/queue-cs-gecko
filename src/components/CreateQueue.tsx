import React, { useState } from 'react';
import { 
  Alert, 
  Box, 
  Button, 
  Card, 
  CircularProgress, 
  Container, 
  Grid, 
  IconButton, 
  Paper, 
  TextField, 
  Typography 
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import QRCode from 'qrcode.react';
import { createQueueRoom } from '../utils/queueHelpers';
import { QueueRoomWithUrls, CreateQueueFormData } from '../types/models';

const CreateQueue: React.FC = () => {
  const [formData, setFormData] = useState<CreateQueueFormData>({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newQueue, setNewQueue] = useState<QueueRoomWithUrls | null>(null);
  const [copySuccess, setCopySuccess] = useState<{ admin: boolean; visitor: boolean }>({
    admin: false,
    visitor: false
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Queue name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queueData = await createQueueRoom(formData.name, formData.description);
      setNewQueue(queueData);
    } catch (err: any) {
      setError(err.message || 'Failed to create queue');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string, type: 'admin' | 'visitor') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess({ ...copySuccess, [type]: true });
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [type]: false }));
      }, 2000);
    });
  };
  
  if (newQueue) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Queue Created Successfully!
          </Typography>
          <Typography variant="body1" paragraph align="center">
            Your queue "{newQueue.name}" is now ready.
          </Typography>
          
          <Grid container spacing={4}>
            {/* Admin Link Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>Admin Link</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Use this link to manage your queue:
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    fullWidth
                    value={newQueue.adminUrl}
                    InputProps={{ readOnly: true }}
                    size="small"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <IconButton 
                    color={copySuccess.admin ? 'success' : 'primary'} 
                    onClick={() => handleCopy(newQueue.adminUrl, 'admin')}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ p: 1, bgcolor: '#fff', borderRadius: 1 }}>
                    <QRCode 
                      value={newQueue.adminUrl} 
                      size={150} 
                      renderAs="svg"
                      includeMargin
                      level="H"
                    />
                  </Box>
                </Box>
              </Card>
            </Grid>
            
            {/* Visitor Link Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>Visitor Link</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Share this link with people to join your queue:
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    fullWidth
                    value={newQueue.visitorUrl}
                    InputProps={{ readOnly: true }}
                    size="small"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <IconButton 
                    color={copySuccess.visitor ? 'success' : 'primary'} 
                    onClick={() => handleCopy(newQueue.visitorUrl, 'visitor')}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ p: 1, bgcolor: '#fff', borderRadius: 1 }}>
                    <QRCode 
                      value={newQueue.visitorUrl} 
                      size={150} 
                      renderAs="svg"
                      includeMargin
                      level="H"
                    />
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setNewQueue(null);
                setFormData({ name: '', description: '' });
              }}
            >
              Create Another Queue
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Create a Support Queue
        </Typography>
        <Typography variant="body1" paragraph align="center">
          Create a virtual queue for HYROX event participants or customers.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                name="name"
                label="Queue Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="E.g. Registration Support, Event Info, etc."
                disabled={isLoading}
                helperText="Required"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description (Optional)"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details about this support queue"
                disabled={isLoading}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'Creating...' : 'Create Queue'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateQueue; 