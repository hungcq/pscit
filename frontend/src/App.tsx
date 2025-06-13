import React from 'react';
import {App as AntApp, ConfigProvider, Layout, theme} from 'antd';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
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
import Cart from './pages/Cart';
import {CartProvider} from './contexts/CartContext';

const {Content} = Layout;

const App: React.FC = () => {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
            }}>
            <AntApp>
                <AuthProvider>
                    <CartProvider>
                        <Router>
                            <Layout style={{minHeight: '100vh'}}>
                                <Navbar/>
                                <Content style={{padding: '24px'}}>
                                    <Routes>
                                        <Route path="/" element={<Navigate to="/home?tag=featured" replace />} />
                                        <Route path="/login" element={<Login/>}/>
                                        <Route path="/about" element={<About/>}/>
                                        <Route path="/home" element={<Home/>}/>
                                        <Route path="/books/:id" element={<BookDetails/>}/>
                                        <Route path="/cart" element={<Cart />} />
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
                                                    <UserProfile />
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin"
                                            element={
                                                <AdminRoute>
                                                    <AdminDashboard />
                                                </AdminRoute>
                                            }
                                        />
                                    </Routes>
                                </Content>
                                <Footer />
                            </Layout>
                        </Router>
                    </CartProvider>
                </AuthProvider>
            </AntApp>
        </ConfigProvider>
    );
};

export default App;
