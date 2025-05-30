import React from 'react';
import {Button, Layout, Menu, Space} from 'antd';
import {Link, useNavigate} from 'react-router-dom';
import {HomeOutlined, LogoutOutlined, UserOutlined,} from '@ant-design/icons';
import {useAuth} from '../contexts/AuthContext';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Menu
        theme="dark"
        mode="horizontal"
        style={{ flex: 1 }}
        items={[
          {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link to="/">Home</Link>,
          },
        ]}
      />
      <Space>
        {user ? (
          <>
            {user.role === 'admin' && (
              <Button type="primary" onClick={() => navigate('/admin')}>
                Admin Dashboard
              </Button>
            )}
            <Button icon={<UserOutlined />} onClick={() => navigate('/profile')}>
              Profile
            </Button>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
          </>
        )}
      </Space>
    </Header>
  );
};

export default Navbar; 