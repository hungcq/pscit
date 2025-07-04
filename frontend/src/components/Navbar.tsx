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
const {Text} = Typography;
const {useBreakpoint} = Grid;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const {logout, user} = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const {cartItems, reloadCart} = useCart();
  const [hovered, setHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    reloadCart();
  }, [user]);

  const mainMenuItems: MenuProps['items'] = [
    ...(screens.md ? [{
      key: '/',
      icon: <HomeOutlined/>,
      label: 'Home',
      onClick: () => navigate('/')
    },
    ] : []),
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
    ...(screens.md ? [{
      key: '/cart',
      icon: <ShoppingCartOutlined style={{fontSize: '17px'}}/>,
      label:
        <Badge size='small' count={cartItems.length}
        >
          <Text style={{
            color:
              window.location.pathname === '/cart' || hovered
                ? '#ccc' // selected color
                : 'rgba(204, 204, 204, 0.65)'
          }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
          >Cart</Text>
        </Badge>,
      onClick: () => navigate('/cart')
    }] : []),
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
    <Header style={{
      padding: '0 16px',
      height: '48px',
      lineHeight: '48px',
      backgroundColor: '#222'
    }
    }>
      <Row align="middle" justify="space-between" wrap={false}>
        {screens.md ? (
          <Row justify="space-between" align="middle" style={{width: '100%'}}>
            <Col span={17}>
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={mainMenuItems}
                style={{lineHeight: '48px'}}
              />
            </Col>
            <Col>
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={userMenuItems}
                style={{lineHeight: '48px'}}
              />
            </Col>
          </Row>
        ) : (
          <Row justify="space-between" align="middle" style={{width: '100%'}}>
            <Col>
              <Button
                icon={<MenuOutlined/>}
                type="text"
                onClick={() => setDrawerVisible(true)}
                style={{color: 'white'}}
              />
            </Col>
            <Col>
              <Button
                icon={<HomeOutlined/>}
                type={window.location.pathname === '/' ? 'primary' : 'text'}
                style={{color: 'white'}}
                onClick={() => navigate('/')}
              />
            </Col>
            <Col>
              <Button
                icon={<Badge size='small' count={cartItems.length}
                >
                  <ShoppingCartOutlined style={{fontSize: '17px'}}/>
                </Badge>}
                type={window.location.pathname === '/cart' ? 'primary' : 'text'}
                style={{color: 'white'}}
                onClick={() => navigate('/cart')}
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
                  items={[...mainMenuItems, ...userMenuItems]}
                  onClick={() => setDrawerVisible(false)}
                />
              </Drawer>
            </Col>
          </Row>
        )}
      </Row>
    </Header>
  );
};

export default Navbar;
