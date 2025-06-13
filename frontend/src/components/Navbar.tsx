import React, {useEffect, useState} from 'react';
import {Badge, Button, Col, Drawer, Grid, Layout, Menu, MenuProps, Row, Space, Typography} from 'antd';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useCart} from '../contexts/CartContext';
import {
  BookOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';

const {Header} = Layout;
const {Title, Text} = Typography;
const {useBreakpoint} = Grid;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const {logout, user} = useAuth();
  const location = useLocation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const {cartItems, reloadCart} = useCart();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    reloadCart();
  }, [user]);

  const mainMenuItems: MenuProps['items'] = [
    ...(user ? [{
      key: '/reservations',
      icon: <BookOutlined/>,
      label: 'My Reservations',
      onClick: () => navigate('/reservations')
    }] : []),
    ...(user && user.role === 'admin' ? [{
      key: '/admin',
      icon: <DashboardOutlined/>,
      label: 'Admin Dashboard',
      onClick: () => navigate('/admin')
    }] : []),
    {
      key: '/about',
      icon: <InfoCircleOutlined/>,
      label: 'About',
      onClick: () => navigate('/about')
    }
  ];

  const userMenuItems: MenuProps['items'] = user ? [
    // {
    //   key: '/profile',
    //   icon: <UserOutlined/>,
    //   label: 'Profile',
    //   onClick: () => navigate('/profile')
    // },
    {
      key: '/cart',
      icon: <ShoppingCartOutlined style={{fontSize: '17px'}}/>,
      label: <Badge size='small' count={cartItems.length}>
        <Text style={{color: 'rgba(255,255,255,0.65)'}}>Cart</Text>
      </Badge>,
      onClick: () => navigate('/cart')
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
  ];

  return (
    <Header style={{padding: '0 24px', zIndex: 10}}>
      <Row align="middle" justify="space-between" wrap={false}>
        <Col md={4}>
          <Space onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <img
              src="/pscit-icon-large.png"
              alt="PSciT Library"
              style={{width: '50px', height: '50px'}}
            />
            {screens.lg &&
              <div style={{lineHeight: 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
              }}>
                <Title level={4} style={{margin: 0}}>PSciT Library</Title>
                <Text type="secondary">A curated private library in Hanoi</Text>
              </div>
            }
          </Space>
        </Col>
        {screens.md ? (
          <>
            <Col md={15}>
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={mainMenuItems}
              />
            </Col>
            <Col md={5}>
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={userMenuItems}
              />
            </Col>
          </>
        ) : (
          <Col>
            <Button
              icon={<MenuOutlined/>}
              type="text"
              onClick={() => setDrawerVisible(true)}
              style={{color: 'white'}}
            />
            <Drawer
              title="Menu"
              placement="right"
              onClose={() => setDrawerVisible(false)}
              open={drawerVisible}
              bodyStyle={{padding: 0}}
            >
              <Menu
                mode="vertical"
                selectedKeys={[window.location.pathname]}
                items={[...mainMenuItems, {type: 'divider'}, ...userMenuItems]}
                onClick={() => setDrawerVisible(false)}
              />
            </Drawer>
          </Col>
        )}
      </Row>
    </Header>
  );
};

export default Navbar;
