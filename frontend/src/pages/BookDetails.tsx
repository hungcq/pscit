import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    message,
    Modal,
    Row,
    Space,
    Spin,
    Table,
    Tag,
    TimePicker,
    Typography
} from 'antd';
import {BookOutlined, EditOutlined, UserOutlined} from '@ant-design/icons';
import type {Book, BookCopy, Author, Category} from '../types';
import {bookCopiesAPI, booksAPI, reservationsAPI, authorsAPI, categoriesAPI} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import dayjs, {Dayjs} from 'dayjs';
import {getBookImageUrl} from '../utils/imageUtils';
import BookForm, { BookFormData } from '../components/admin/BookForm';

const {Title, Text, Paragraph} = Typography;

const BookDetails: React.FC = () => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {isAuthenticated, user} = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [copies, setCopies] = useState<BookCopy[]>([]);
    const [loading, setLoading] = useState(true);
    const [reservationModalVisible, setReservationModalVisible] = useState(false);
    const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(null);
    const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
    const [selectedPickupSlot, setSelectedPickupSlot] = useState<Dayjs | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [imageError, setImageError] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const loadCopies = async () => {
        try {
            const response = await bookCopiesAPI.getBookCopies(id!);
            setCopies(response.data);
        } catch (error) {
            console.error('Failed to load book copies:', error);
            message.error('Failed to load book copies');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [bookResponse, authorsResponse, categoriesResponse] = await Promise.all([
                    booksAPI.getBook(id!),
                    authorsAPI.getAuthors(),
                    categoriesAPI.getCategories(),
                ]);
                setBook(bookResponse.data);
                setAuthors(authorsResponse.data);
                setCategories(categoriesResponse.data);
                await loadCopies();
            } catch (error) {
                console.error('Failed to load data:', error);
                message.error('Failed to load book details');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    useEffect(() => {
        const loadImageUrl = async () => {
            if (book) {
                const url = getBookImageUrl(book.id);
                setImageUrl(url);
            }
        };
        loadImageUrl();
    }, [book]);

    const handleReserve = async () => {
        if (!isAuthenticated) {
            message.warning('Please login to reserve books');
            navigate('/login');
            return;
        }

        if (!selectedCopy || !selectedDates || !selectedPickupSlot) {
            message.error('Please select a copy, dates, and pickup time');
            return;
        }

        try {
            await reservationsAPI.createReservation({
                bookCopyId: selectedCopy.id,
                startDate: selectedDates[0].toISOString(),
                endDate: selectedDates[1].toISOString(),
                pickupSlot: selectedPickupSlot.toISOString(),
            });
            message.success('Reservation created successfully!');
            setReservationModalVisible(false);
            setSelectedDates(null);
            setSelectedCopy(null);
            setSelectedPickupSlot(null);
            await loadCopies(); // Reload copies to update availability
        } catch (error: any) {
            console.error('Failed to create reservation:', error);
            message.error(error.response?.data?.error || 'Failed to create reservation');
        }
    };

    const showReservationModal = (copy: BookCopy) => {
        setSelectedCopy(copy);
        setReservationModalVisible(true);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleEdit = () => {
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
    };

    const handleEditSubmit = async (values: BookFormData) => {
        if (!book) return;
        
        try {
            setSubmitting(true);
            await booksAPI.updateBook(book.id, values);
            message.success('Book updated successfully');
            setIsEditModalVisible(false);
            
            // Reload book data
            const response = await booksAPI.getBook(book.id);
            setBook(response.data);
        } catch (error) {
            console.error('Failed to update book:', error);
            message.error('Failed to update book');
        } finally {
            setSubmitting(false);
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
    const isBookAvailable = availableCopies.length > 0;

    return (
        <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Card>
                <Row gutter={[32, 32]}>
                    {/* Left Column - Book Image and Basic Info */}
                    <Col xs={24} md={8}>
                        <Space direction="vertical" size="large" style={{width: '100%'}}>
                            <img
                                src={imageError ? book?.main_image : getBookImageUrl(book?.id || '')}
                                alt={book?.title}
                                onError={handleImageError}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '500px',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                            <Space direction="vertical" style={{width: '100%'}}>
                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Title level={2}>{book.title}</Title>
                                    {user?.role === 'admin' && (
                                        <Button 
                                            type="primary" 
                                            icon={<EditOutlined />}
                                            onClick={handleEdit}
                                        >
                                            Edit Book
                                        </Button>
                                    )}
                                </Space>
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
                    </Col>

                    {/* Right Column - Book Details and Description */}
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size="large" style={{width: '100%'}}>
                            <Descriptions 
                                title="Book Details" 
                                bordered 
                                column={{ xs: 1, sm: 2 }}
                                size="small"
                            >
                                <Descriptions.Item label="ISBN-10">{book.isbn10}</Descriptions.Item>
                                <Descriptions.Item label="ISBN-13">{book.isbn13}</Descriptions.Item>
                                <Descriptions.Item label="Publisher">{book.publisher}</Descriptions.Item>
                                <Descriptions.Item label="Published Year">{book.published_year}</Descriptions.Item>
                                <Descriptions.Item label="Page Count">{book.page_count}</Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={isBookAvailable ? 'green' : 'red'}>
                                        {isBookAvailable ? 'Available' : 'Not Available'}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>

                            <div>
                                <Title level={3}>Description</Title>
                                <Paragraph>{book.description}</Paragraph>
                            </div>

                            <div>
                                <Title level={3}>Available Copies</Title>
                                {availableCopies.length === 0 ? (
                                    <Text type="secondary">No copies available for reservation</Text>
                                ) : (
                                    <Table
                                        dataSource={availableCopies}
                                        columns={[
                                            {
                                                title: 'Condition',
                                                dataIndex: 'condition',
                                                key: 'condition',
                                                render: (condition: BookCopy['condition']) => (
                                                    <Tag color={
                                                        condition === 'new' ? 'green' :
                                                        condition === 'like_new' ? 'lime' :
                                                        condition === 'good' ? 'blue' :
                                                        condition === 'fair' ? 'orange' :
                                                        'red'
                                                    }>
                                                        {condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                    </Tag>
                                                ),
                                            },
                                            {
                                                title: 'Notes',
                                                dataIndex: 'notes',
                                                key: 'notes',
                                            },
                                            {
                                                title: 'Action',
                                                key: 'action',
                                                render: (_, record) => (
                                                    <Button
                                                        type="primary"
                                                        onClick={() => showReservationModal(record)}
                                                    >
                                                        Reserve
                                                    </Button>
                                                ),
                                            },
                                        ]}
                                        rowKey="id"
                                        pagination={false}
                                    />
                                )}
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Modal
                title="Reserve Book Copy"
                open={reservationModalVisible}
                onCancel={() => {
                    setReservationModalVisible(false);
                    setSelectedCopy(null);
                    setSelectedDates(null);
                    setSelectedPickupSlot(null);
                }}
                onOk={handleReserve}
                okText="Reserve"
                cancelText="Cancel"
            >
                <Space direction="vertical" style={{width: '100%'}}>
                    <Text>From - To:</Text>
                    <DatePicker.RangePicker
                        onChange={(dates) => setSelectedDates(dates as [Dayjs, Dayjs])}
                        value={selectedDates}
                        style={{width: '100%'}}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        format="DD-MM-YYYY"
                    />
                    <Text>{selectedDates?.[0] ? `Pickup Time (on ${selectedDates?.[0].format('DD-MM-YYYY')}):` : 'Select date first'}</Text>
                    <TimePicker
                        value={selectedPickupSlot}
                        onChange={(time) => setSelectedPickupSlot(time)}
                        format="HH:mm"
                        minuteStep={30}
                        style={{width: '100%'}}
                        disabled={!selectedDates}
                        showNow={false}
                        needConfirm={false}
                    />
                </Space>
            </Modal>

            <BookForm
                visible={isEditModalVisible}
                onCancel={handleEditCancel}
                onSubmit={handleEditSubmit}
                initialValues={book}
                authors={authors}
                categories={categories}
                loading={submitting}
            />
        </Space>
    );
};

export default BookDetails;