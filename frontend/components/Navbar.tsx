import React, {useEffect, useState} from 'react';
import {Badge, Button, Col, Drawer, Grid, Layout, Menu, MenuProps, Row, Typography} from 'antd';
import {useRouter} from 'next/router';
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
  const router = useRouter();
  const {logout, user} = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const {cartItems, reloadCart} = useCart();
  const [hovered, setHovered] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login/');
  };

  useEffect(() => {
    reloadCart();
  }, [user]);

  const mainMenuItems: MenuProps['items'] = [
    ...(screens.md ? [{
      key: '/',
      icon: <HomeOutlined/>,
      label: 'Home',
      onClick: () => router.push('/')
    },
    ] : []),
    ...(user ? [{
      key: '/reservations/',
      icon: <BookOutlined/>,
      label: 'My Reservations',
      onClick: () => router.push('/reservations')
    }] : []),
    ...(user && user.role === 'admin' ? [{
      key: '/admin/',
      icon: <DashboardOutlined/>,
      label: 'Admin Dashboard',
      onClick: () => router.push('/admin')
    }] : []),
    {
      key: '/about/',
      icon: <InfoCircleOutlined/>,
      label: 'About',
      onClick: () => router.push('/about')
    }
  ];

  const userMenuItems: MenuProps['items'] = user ? [
    ...(screens.md ? [{
      key: '/cart/',
      icon: <ShoppingCartOutlined style={{fontSize: '17px'}}/>,
      label:
        <Badge size='small' count={cartItems.length}
        >
          <Text style={{
            color:
              window.location.pathname === '/cart/' || hovered
                ? '#ccc' // selected color
                : 'rgba(204, 204, 204, 0.65)'
          }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
          >Cart</Text>
        </Badge>,
      onClick: () => router.push('/cart')
    }] : []),
    {
      key: '/logout/',
      icon: <LogoutOutlined/>,
      label: 'Logout',
      onClick: handleLogout
    }
  ] : [
    {
      key: '/login/',
      icon: <LoginOutlined/>,
      label: 'Login',
      onClick: () => router.push('/login/')
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
            <Col style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                type={window.location.pathname === '' ? 'primary' : 'text'}
                style={{color: 'white'}}
                onClick={() => router.push('/')}
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
                onClick={() => router.push('/cart')}
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
