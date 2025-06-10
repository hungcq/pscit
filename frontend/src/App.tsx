import React from 'react';
import {App as AntApp, ConfigProvider, Layout, theme} from 'antd';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import UserReservations from './pages/UserReservations';
import Navbar from './components/Navbar';
import About from './pages/About';
import PrivateRoute from './components/PrivateRoute';
import {AuthProvider} from './contexts/AuthContext';
import UserProfile from "./pages/UserProfile";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Footer from './components/Footer';

const {Content} = Layout;

const App: React.FC = () => {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
            }}>
            <AntApp>
                <AuthProvider>
                    <Router>
                        <Layout style={{minHeight: '100vh'}}>
                            <Navbar/>
                            <Layout className="main-content">
                                <Content style={{
                                    margin: '24px 16px',
                                    padding: 24,
                                    minHeight: 280,
                                    background: '#141414',
                                    borderRadius: '8px'
                                }}>
                                    <Routes>
                                        <Route path="/login" element={<Login/>}/>
                                        <Route path="/about" element={<About/>}/>
                                        <Route path="/" element={<Home/>}/>
                                        <Route path="/books/:id" element={<BookDetails/>}/>
                                        <Route
                                            path="/reservations"
                                            element={
                                                <PrivateRoute>
                                                    <UserReservations/>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/profile"
                                            element={
                                                <PrivateRoute>
                                                    <UserProfile/>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin"
                                            element={
                                                <AdminRoute>
                                                    <AdminDashboard/>
                                                </AdminRoute>
                                            }
                                        />
                                    </Routes>
                                </Content>
                                <Footer/>
                            </Layout>
                        </Layout>
                    </Router>
                </AuthProvider>
            </AntApp>
            <style>
                {`
                    .main-content {
                        margin-left: 200px;
                    }
                    @media (max-width: 768px) {
                        .main-content {
                            margin-left: 0 !important;
                            padding-top: 50px !important;
                        }
                    }
                `}
            </style>
        </ConfigProvider>
    );
};

export default App;
