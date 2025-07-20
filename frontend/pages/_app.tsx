import React from 'react';
import { App as AntApp, ConfigProvider, Layout, theme } from 'antd';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import '../index.css';

const { Content } = Layout;

function MyApp({ Component, pageProps }: any) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#555',
          colorBgContainer: '#000',
          colorBgElevated: '#222',
          colorText: '#ddd',
          colorTextLightSolid: '#ccc',
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <CartProvider>
            <Layout style={{ minHeight: '100vh' }}>
              <Navbar />
              <Content style={{ padding: '24px' }}>
                <Component {...pageProps} />
              </Content>
              <Footer />
            </Layout>
          </CartProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default MyApp; 