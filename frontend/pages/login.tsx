import React from 'react';
import { useRouter } from 'next/router';
import {GoogleLogin, GoogleOAuthProvider} from '@react-oauth/google';
import {useAuth} from '../contexts/AuthContext';
import api from '../api';
import {Card, message, Space, Typography} from 'antd';

const { Title } = Typography;

const Login: React.FC = () => {
    const router = useRouter();
    const { login } = useAuth();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const response = await api.post('/auth/google/callback', {
                credential: credentialResponse.credential
            });

            if (response.data.token && response.data.user) {
                login(response.data.token, response.data.user);
                message.success('Login successful!');
                router.push('/');
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
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
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