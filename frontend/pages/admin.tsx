import React from 'react';
import { Card, Tabs } from 'antd';
import BooksTab from '../components/admin/BooksTab';
import AuthorsTab from '../components/admin/AuthorsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import ReservationsTab from '../components/admin/ReservationsTab';
import TagsTab from '../components/admin/TagsTab';
import { Author, Category, Tag as TagModel } from '../types';
import { authorsAPI, categoriesAPI, tagsAPI } from '../api';
import { message } from 'antd';

// Triggering linter re-evaluation
const AdminDashboard: React.FC = () => {
    const [authors, setAuthors] = React.useState<Author[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [tags, setTags] = React.useState<TagModel[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadAuthors = async () => {
        try {
            const response = await authorsAPI.getAuthors();
            setAuthors(response.data);
        } catch (error) {
            console.error('Failed to load authors:', error);
            message.error('Failed to load authors');
        }
    };

    const loadCategories = async () => {
        try {
            const response = await categoriesAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories:', error);
            message.error('Failed to load categories');
        }
    };

    const loadTags = async () => {
        try {
            const response = await tagsAPI.getTags();
            setTags(response.data);
        } catch (error) {
            console.error('Failed to load tags:', error);
            message.error('Failed to load tags');
        }
    };

    const loadAllFormData = async () => {
        setLoading(true);
        await Promise.all([
            loadAuthors(),
            loadCategories(),
            loadTags()
        ]);
        setLoading(false);
    };

    React.useEffect(() => {
        loadAllFormData();
    }, []);

    const items = [
        {
            key: 'books',
            label: 'Books',
            children: <BooksTab authors={authors} categories={categories} tags={tags} onDataReload={loadAllFormData} />,
        },
        {
            key: 'authors',
            label: 'Authors',
            children: <AuthorsTab onDataReload={loadAuthors} />,
        },
        {
            key: 'categories',
            label: 'Categories',
            children: <CategoriesTab onDataReload={loadCategories} />,
        },
        {
            key: 'tags',
            label: 'Tags',
            children: <TagsTab onDataReload={loadTags} />,
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