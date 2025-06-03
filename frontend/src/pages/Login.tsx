import React from 'react';
import {useNavigate} from 'react-router-dom';
import {GoogleLogin, GoogleOAuthProvider} from '@react-oauth/google';
import {useAuth} from '../contexts/AuthContext';
import api from '../services/api';
import {Card, message, Space, Typography} from 'antd';

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
        <Space direction="vertical" align="center" style={{ width: '100%', marginTop: '100px' }}>
            <Card>
                <Title level={2}>Login</Title>
                <Space direction="vertical" align="center" style={{ width: '100%', marginTop: '24px' }}>
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
                </Space>
            </Card>
        </Space>
    );
};

export default Login; 