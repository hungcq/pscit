import React from 'react';
import type {MenuProps} from 'antd';
import {Layout, Menu, Typography} from 'antd';
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

const {Sider} = Layout;
const {Title, Text} = Typography;

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const {logout, user} = useAuth();

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
        {
            type: 'divider'
        },
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
        <Sider
            theme="dark"
            width={200}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
            }}
        >
            <Title level={3} style={{ margin: '20px' }}>PSciT Library</Title>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[window.location.pathname]}
                items={menuItems}
                style={{ borderRight: 0 }}
            />
        </Sider>
    );
};

export default Navbar; 