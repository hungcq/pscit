import React, { useState } from 'react';
import type { MenuProps } from 'antd';
import { Layout, Menu, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    BookOutlined,
    DashboardOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    LoginOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuOutlined
} from '@ant-design/icons';

const { Header } = Layout;
const { Title, Text } = Typography;

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: 'Home',
            onClick: () => {
                navigate('/');
                setIsMobileMenuOpen(false);
            }
        },
        ...(user ? [
            {
                key: '/reservations',
                icon: <BookOutlined />,
                label: 'My Reservations',
                onClick: () => {
                    navigate('/reservations');
                    setIsMobileMenuOpen(false);
                }
            }
        ] : []),
        ...(user && user.role === 'admin' ? [
            {
                key: '/admin',
                icon: <DashboardOutlined />,
                label: 'Admin Dashboard',
                onClick: () => {
                    navigate('/admin');
                    setIsMobileMenuOpen(false);
                }
            }
        ] : []),
        {
            key: '/about',
            icon: <InfoCircleOutlined />,
            label: 'About',
            onClick: () => {
                navigate('/about');
                setIsMobileMenuOpen(false);
            }
        },
        {
            type: 'divider'
        },
        ...(user ? [
            {
                key: '/profile',
                icon: <UserOutlined />,
                label: 'Profile',
                onClick: () => {
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                }
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: () => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                }
            }
        ] : [
            {
                key: '/login',
                icon: <LoginOutlined />,
                label: 'Login',
                onClick: () => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                }
            }
        ])
    ];

    return (
        <>
            {/* Mobile Header */}
            <Header style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                position: 'fixed',
                width: '100%',
                zIndex: 1000,
                background: '#001529'
            }} className="mobile-header">
                <Title level={3} style={{ margin: 0, color: 'white' }}>PSciT Library</Title>
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ color: 'white' }}
                />
            </Header>

            {/* Desktop Sider */}
            <Layout.Sider
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
                className="desktop-sider"
            >
                <Title level={3} style={{ margin: '20px' }}>PSciT Library</Title>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[window.location.pathname]}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </Layout.Sider>

            {/* Mobile Menu */}
            <div style={{
                display: isMobileMenuOpen ? 'block' : 'none',
                position: 'fixed',
                top: '64px',
                left: 0,
                right: 0,
                background: '#001529',
                zIndex: 999
            }} className="mobile-menu">
                <Menu
                    theme="dark"
                    mode="vertical"
                    selectedKeys={[window.location.pathname]}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </div>

            <style>
                {`
                    @media (max-width: 768px) {
                        .mobile-header {
                            display: flex !important;
                        }
                        .desktop-sider {
                            display: none !important;
                        }
                    }
                    @media (min-width: 769px) {
                        .mobile-header {
                            display: none !important;
                        }
                        .desktop-sider {
                            display: block !important;
                        }
                    }
                `}
            </style>
        </>
    );
};

export default Navbar; 