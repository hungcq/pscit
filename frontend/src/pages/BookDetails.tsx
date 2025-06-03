import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Card, Typography, Button, Space, Spin, message, Descriptions, Tag} from 'antd';
import {BookOutlined, UserOutlined} from '@ant-design/icons';
import type {Book, BookCopy} from '../types';
import {bookCopiesAPI, booksAPI, reservationsAPI} from '../services/api';
import {useAuth} from '../contexts/AuthContext';

const {Title, Text, Paragraph} = Typography;

const BookDetails: React.FC = () => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {isAuthenticated} = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [copies, setCopies] = useState<BookCopy[]>([]);
    const [loading, setLoading] = useState(true);
    const [reservationModalVisible, setReservationModalVisible] = useState(false);
    const [selectedDates, setSelectedDates] = useState<[Date, Date] | null>(null);
    const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);

    useEffect(() => {
        const loadBook = async () => {
            try {
                const response = await booksAPI.getBook(id!);
                setBook(response.data);
                await loadCopies();
            } catch (error) {
                console.error('Failed to load book:', error);
                message.error('Failed to load book details');
            } finally {
                setLoading(false);
            }
        };

        const loadCopies = async () => {
            try {
                const response = await bookCopiesAPI.getBookCopies(id!);
                setCopies(response.data);
            } catch (error) {
                console.error('Failed to load book copies:', error);
                message.error('Failed to load book copies');
            }
        };

        loadBook();
    }, [id]);

    const handleReserve = async () => {
        if (!isAuthenticated) {
            message.warning('Please login to reserve books');
            navigate('/login');
            return;
        }

        if (!selectedCopy || !selectedDates) {
            message.error('Please select a copy and dates');
            return;
        }

        try {
            await reservationsAPI.createReservation({
                bookCopyId: selectedCopy.id,
                startDate: selectedDates[0],
                endDate: selectedDates[1],
            });
            message.success('Reservation created successfully!');
            setReservationModalVisible(false);
            setSelectedDates(null);
            setSelectedCopy(null);
        } catch (error) {
            console.error('Failed to create reservation:', error);
            message.error('Failed to create reservation');
        }
    };

    if (loading) {
        return (
            <Space direction="vertical" align="center" style={{width: '100%', marginTop: '100px'}}>
                <Spin size="large"/>
            </Space>
        );
    }

    if (!book) {
        return (
            <Space direction="vertical" align="center" style={{width: '100%', marginTop: '100px'}}>
                <Title level={3}>Book not found</Title>
                <Button type="primary" onClick={() => navigate('/')}>
                    Back to Home
                </Button>
            </Space>
        );
    }

    const availableCopies = copies.filter((copy) => copy.available);

    return (
        <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Card>
                <Space direction="vertical" size="large" style={{width: '100%'}}>
                    <Space align="start">
                        <img
                            src={book.main_image}
                            alt={book.title}
                            style={{width: '200px', height: 'auto'}}
                        />
                        <Space direction="vertical">
                            <Title level={2}>{book.title}</Title>
                            <Text type="secondary">{book.subtitle}</Text>
                            <Space>
                                <UserOutlined/>
                                <Text>{book.authors.map(a => a.name).join(', ')}</Text>
                            </Space>
                            <Space>
                                <BookOutlined/>
                                <Text>{book.categories.map(c => c.name).join(', ')}</Text>
                            </Space>
                        </Space>
                    </Space>

                    <Descriptions title="Book Details" bordered>
                        <Descriptions.Item label="ISBN-10">{book.isbn_10}</Descriptions.Item>
                        <Descriptions.Item label="ISBN-13">{book.isbn_13}</Descriptions.Item>
                        <Descriptions.Item label="Publisher">{book.publisher}</Descriptions.Item>
                        <Descriptions.Item label="Published Year">{book.published_year}</Descriptions.Item>
                        <Descriptions.Item label="Page Count">{book.page_count}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={book.available ? 'green' : 'red'}>
                                {book.available ? 'Available' : 'Not Available'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>

                    <Space direction="vertical">
                        <Title level={3}>Description</Title>
                        <Paragraph>{book.description}</Paragraph>
                    </Space>

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => setReservationModalVisible(true)}
                        disabled={!book.available}
                    >
                        {book.available ? 'Reserve Book' : 'Not Available'}
                    </Button>
                </Space>
            </Card>
        </Space>
    );
};

export default BookDetails;