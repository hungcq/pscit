import React from 'react';
import { Card, Tabs } from 'antd';
import BooksTab from '../components/admin/BooksTab';
import AuthorsTab from '../components/admin/AuthorsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import ReservationsTab from '../components/admin/ReservationsTab';

const AdminDashboard: React.FC = () => {
    const items = [
        {
            key: 'books',
            label: 'Books',
            children: <BooksTab />,
        },
        {
            key: 'authors',
            label: 'Authors',
            children: <AuthorsTab />,
        },
        {
            key: 'categories',
            label: 'Categories',
            children: <CategoriesTab />,
        },
        {
            key: 'reservations',
            label: 'Reservations',
            children: <ReservationsTab />,
        },
    ];

    return (
        <Card title="Admin Dashboard">
            <Tabs defaultActiveKey="books" items={items} />
        </Card>
    );
};

export default AdminDashboard; 