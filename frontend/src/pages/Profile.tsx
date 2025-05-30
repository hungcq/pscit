import { Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{user?.name}</Typography>
        <Typography color="text.secondary">{user?.email}</Typography>
        <Typography color="text.secondary">
          Role: {user?.role}
        </Typography>
        <Typography color="text.secondary">
          Subscription: {user?.subscribed ? 'Active' : 'Inactive'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 