import React from 'react';
import type {MenuProps} from 'antd';
import {Layout, Menu} from 'antd';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {
    BookOutlined,
    DashboardOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    LoginOutlined,
    LogoutOutlined,
    UserOutlined
} from '@ant-design/icons';

const {Header} = Layout;

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const {logout, user} = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const leftMenuItems: MenuProps['items'] = [
        {
            key: '/',
            icon: <HomeOutlined/>,
            label: 'Home',
            onClick: () => navigate('/')
        },
        ...(user ? [
            {
                key: '/reservations',
                icon: <BookOutlined/>,
                label: 'My Reservations',
                onClick: () => navigate('/reservations')
            }
        ] : []),
        ...(user && user.role === 'admin' ? [
            {
                key: '/admin',
                icon: <DashboardOutlined/>,
                label: 'Admin Dashboard',
                onClick: () => navigate('/admin')
            }
        ] : []),
        {
            key: '/about',
            icon: <InfoCircleOutlined/>,
            label: 'About',
            onClick: () => navigate('/about')
        },
    ];

    const rightMenuItems: MenuProps['items'] = [
        ...(user ? [
            {
                key: '/profile',
                icon: <UserOutlined/>,
                label: 'Profile',
                onClick: () => navigate('/profile')
            },
            {
                key: 'logout',
                icon: <LogoutOutlined/>,
                label: 'Logout',
                onClick: handleLogout
            }
        ] : [
            {
                key: '/login',
                icon: <LoginOutlined/>,
                label: 'Login',
                onClick: () => navigate('/login')
            }
        ])
    ];

    return (
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={leftMenuItems}
                style={{ flex: 1 }}
            />
            <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={rightMenuItems}
                style={{ minWidth: 'auto' }}
                overflowedIndicator={<UserOutlined />}
            />
        </Header>
    );
};

export default Navbar; 