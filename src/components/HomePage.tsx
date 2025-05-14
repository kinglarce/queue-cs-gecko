import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import PeopleIcon from '@mui/icons-material/People';
import UpdateIcon from '@mui/icons-material/Update';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreateQueue from './CreateQueue';

const HomePage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  
  return (
    <Container maxWidth="md">
      <Box textAlign="center" my={5}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          HYROX Customer Support Queue System
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Efficient queue management for HYROX customer support
        </Typography>
      </Box>
      
      {!showCreateForm ? (
        <>
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                  <CreateIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Create Support Queues</Typography>
                  <Typography variant="body2">
                    Easily create digital support queues for your HYROX event.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                  <PeopleIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Manage Visitors</Typography>
                  <Typography variant="body2">
                    Track and serve visitors efficiently with real-time updates.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                  <UpdateIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Real-time Updates</Typography>
                  <Typography variant="body2">
                    Visitors receive instant notifications about their queue position.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          <Box display="flex" justifyContent="center" sx={{ mb: 6 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              onClick={() => setShowCreateForm(true)}
            >
              Create New Queue
            </Button>
          </Box>
          
          <Card sx={{ mb: 6, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Already have a queue link?
            </Typography>
            <Typography variant="body1" paragraph>
              If you received an admin or visitor link, simply click it to access your queue.
            </Typography>
          </Card>
          
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              How It Works
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="body1" fontWeight="bold">1.</Typography>
                </ListItemIcon>
                <ListItemText primary="Create a new support queue for your HYROX event" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <Typography variant="body1" fontWeight="bold">2.</Typography>
                </ListItemIcon>
                <ListItemText primary="Share the visitor link with event participants" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <Typography variant="body1" fontWeight="bold">3.</Typography>
                </ListItemIcon>
                <ListItemText primary="Manage the queue through your admin dashboard" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <Typography variant="body1" fontWeight="bold">4.</Typography>
                </ListItemIcon>
                <ListItemText primary="Visitors join the queue and receive real-time updates" />
              </ListItem>
            </List>
          </Card>
        </>
      ) : (
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            onClick={() => setShowCreateForm(false)}
            sx={{ mb: 3 }}
          >
            Back to Home
          </Button>
          <CreateQueue />
        </Box>
      )}
    </Container>
  );
};

export default HomePage; 