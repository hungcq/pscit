import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            console.log(credentialResponse);
            const response = await api.get(`/auth/google/callback?code=${credentialResponse.credential}`);

            login(response.data.token, response.data.user);
            navigate('/');
        } catch (error) {
            console.error('Error during Google login:', error);
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
                console.error('Login Failed');
            }}
        />
    );
};

export default Login; 