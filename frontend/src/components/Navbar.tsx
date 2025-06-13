import React, {useEffect, useState} from 'react';
import {Badge, Button, Col, Drawer, Grid, Layout, Menu, MenuProps, Row, Typography} from 'antd';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useCart} from '../contexts/CartContext';
import {
  BookOutlined,
  DashboardOutlined,
  HomeOutlined,
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
    {
      key: '/',
      icon: <HomeOutlined/>,
      label: 'Home',
      onClick: () => navigate('/')
    },
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
        {screens.md ? (
          <>
            <Col md={19}>
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
              placement="left"
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
