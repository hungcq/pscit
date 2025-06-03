import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {ConfigProvider, Layout, theme} from 'antd';
import {AuthProvider} from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import Reservations from './pages/Reservations';
import Navbar from './components/Navbar';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <AuthProvider>
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            <Navbar />
            <Content style={{ padding: '24px' }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/books/:id" element={<BookDetails />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <UserProfile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reservations"
                  element={
                    <PrivateRoute>
                      <Reservations />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Content>
          </Layout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
