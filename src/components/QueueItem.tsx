import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { QueueItem as QueueItemType } from '../types/models';

interface QueueItemProps {
  item: QueueItemType;
  isAdmin: boolean;
  onUpdateStatus?: (id: string, status: string) => void;
}

const QueueItem: React.FC<QueueItemProps> = ({ item, isAdmin, onUpdateStatus }) => {
  const { id, name, ticket_number, status, joined_at } = item;

  // Format timestamp to locale time
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate wait time in minutes
  const getWaitTime = (): number => {
    const joinedTime = new Date(joined_at).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - joinedTime) / (1000 * 60));
  };

  // Get user-friendly status label
  const getStatusLabel = (): {
    label: string;
    color: "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
    icon: React.ReactNode;
  } => {
    switch (status) {
      case 'waiting':
        return { 
          label: 'Waiting', 
          color: 'primary',
          icon: <HourglassEmptyIcon />
        };
      case 'serving':
        return { 
          label: 'Being Served', 
          color: 'info',
          icon: <AccessTimeIcon />
        };
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'success',
          icon: <CheckCircleIcon />
        };
      case 'no_show':
        return { 
          label: 'No Show', 
          color: 'error',
          icon: <PersonIcon />
        };
      default:
        return { 
          label: 'Unknown', 
          color: 'default',
          icon: <HourglassEmptyIcon />
        };
    }
  };

  const waitTime = getWaitTime();
  const statusInfo = getStatusLabel();

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={isAdmin ? 4 : 6}>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                #{ticket_number}
              </Typography>
              <Typography variant="body1">{name}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={isAdmin ? 4 : 6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Joined at {formatTime(joined_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Wait time: {waitTime} min
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={isAdmin ? 2 : 6} textAlign={isAdmin ? 'right' : 'left'}>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
          </Grid>
          
          {isAdmin && onUpdateStatus && (
            <Grid item xs={6} sm={2} textAlign="right">
              {status === 'waiting' && (
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => onUpdateStatus(id, 'serving')}
                >
                  Serve
                </Button>
              )}
              
              {status === 'serving' && (
                <Box>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                    onClick={() => onUpdateStatus(id, 'completed')}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => onUpdateStatus(id, 'no_show')}
                  >
                    No Show
                  </Button>
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QueueItem; 