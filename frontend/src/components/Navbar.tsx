import React from 'react';
import {Layout, Menu} from 'antd';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {
    BookOutlined,
    DashboardOutlined,
    HomeOutlined,
    LoginOutlined,
    LogoutOutlined,
    UserOutlined
} from '@ant-design/icons';
import type {MenuProps} from 'antd';

const {Header} = Layout;

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const {logout, isAuthenticated, isAdmin} = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: '/',
            icon: <HomeOutlined/>,
            label: 'Home',
            onClick: () => navigate('/')
        },
        ...(isAuthenticated ? [
            {
                key: '/profile',
                icon: <UserOutlined/>,
                label: 'Profile',
                onClick: () => navigate('/profile')
            },
            {
                key: '/reservations',
                icon: <BookOutlined/>,
                label: 'My Reservations',
                onClick: () => navigate('/reservations')
            }
        ] : []),
        ...(isAdmin ? [
            {
                key: '/admin',
                icon: <DashboardOutlined/>,
                label: 'Admin Dashboard',
                onClick: () => navigate('/admin')
            }
        ] : []),
        isAuthenticated ? {
            key: 'logout',
            icon: <LogoutOutlined/>,
            label: 'Logout',
            onClick: handleLogout
        } : {
            key: '/login',
            icon: <LoginOutlined/>,
            label: 'Login',
            onClick: () => navigate('/login')
        }
    ];

    return (
        <Header>
            <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={menuItems}
            />
        </Header>
    );
};

export default Navbar; 