import React from 'react';
import {useNavigate} from 'react-router-dom';
import {GoogleLogin, GoogleOAuthProvider} from '@react-oauth/google';
import {useAuth} from '../contexts/AuthContext';
import api from '../services/api';
import {Card, message, Typography} from 'antd';

const { Title } = Typography;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const response = await api.post('/auth/google/callback', {
                credential: credentialResponse.credential
            });

            if (response.data.token && response.data.user) {
                login(response.data.token, response.data.user);
                message.success('Login successful!');
                navigate('/');
            } else {
                message.error('Invalid response from server');
            }
        } catch (error: any) {
            console.error('Error during Google login:', error);
            message.error(error.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div style={{ 
            maxWidth: '400px', 
            margin: '100px auto', 
            padding: '24px',
            textAlign: 'center'
        }}>
            <Card>
                <Title level={2}>Login</Title>
                <div style={{ marginTop: '24px' }}>
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                message.error('Google login failed. Please try again.');
                            }}
                            theme="filled_blue"
                            shape="rectangular"
                            text="signin_with"
                            size="large"
                        />
                    </GoogleOAuthProvider>
                </div>
            </Card>
        </div>
    );
};

export default Login; 