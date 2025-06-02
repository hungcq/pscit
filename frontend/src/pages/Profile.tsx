import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Profile</h1>
    </div>
  );
};

export default Profile; 