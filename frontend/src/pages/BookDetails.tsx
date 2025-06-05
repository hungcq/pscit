import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Form,
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
import {BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined} from '@ant-design/icons';
import type {Author, Book, BookCopy, Category} from '../types';
import {authorsAPI, bookCopiesAPI, booksAPI, categoriesAPI, reservationsAPI} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import dayjs, {Dayjs} from 'dayjs';
import {getBookImageUrl} from '../utils/imageUtils';
import BookForm, {BookFormData} from '../components/admin/BookForm';

const {Title, Text, Paragraph} = Typography;

const MAX_SUGGESTED_TIMESLOTS = 5;

const BookDetails: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {isAuthenticated, user} = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [copies, setCopies] = useState<BookCopy[]>([]);
    const [loading, setLoading] = useState(true);
    const [reservationModalVisible, setReservationModalVisible] = useState(false);
    const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(null);
    const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
    const [selectedPickupTimeslots, setSelectedPickupTimeslots] = useState<Dayjs[]>([]);
    const [selectedReturnTimeslots, setSelectedReturnTimeslots] = useState<Dayjs[]>([]);
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

    const handleAddTimeslot = () => {
        if (!selectedDates) return;
        if (selectedPickupTimeslots.length >= MAX_SUGGESTED_TIMESLOTS) {
            message.warning(`You can only suggest up to ${MAX_SUGGESTED_TIMESLOTS} pickup times`);
            return;
        }
        const newTimeslot = selectedDates[0].hour(9).minute(0).second(0);
        setSelectedPickupTimeslots([...selectedPickupTimeslots, newTimeslot]);
    };

    const handleAddReturnTimeslot = () => {
        if (!selectedDates) return;
        if (selectedReturnTimeslots.length >= MAX_SUGGESTED_TIMESLOTS) {
            message.warning(`You can only suggest up to ${MAX_SUGGESTED_TIMESLOTS} return times`);
            return;
        }
        const newTimeslot = selectedDates[1].hour(17).minute(0).second(0);
        setSelectedReturnTimeslots([...selectedReturnTimeslots, newTimeslot]);
    };

    const handleRemovePickupTimeslot = (index: number) => {
        setSelectedPickupTimeslots(selectedPickupTimeslots.filter((_, i) => i !== index));
    };

    const handleRemoveReturnTimeslot = (index: number) => {
        setSelectedReturnTimeslots(selectedReturnTimeslots.filter((_, i) => i !== index));
    };

    const handleReserve = async () => {
        if (!selectedDates || selectedPickupTimeslots.length === 0 || selectedReturnTimeslots.length === 0 || !selectedCopy) {
            message.error('Please select a date, at least one pickup time, one return time, and a book copy');
            return;
        }

        try {
            setSubmitting(true);
            await reservationsAPI.createReservation({
                bookCopyId: selectedCopy.id,
                startDate: selectedDates[0].toISOString(),
                endDate: selectedDates[1].toISOString(),
                suggestedPickupTimeslots: selectedPickupTimeslots.map(slot => slot.toISOString()),
                suggestedReturnTimeslots: selectedReturnTimeslots.map(slot => slot.toISOString()),
            });

            message.success('Reservation request submitted successfully');
            setReservationModalVisible(false);
            setSelectedDates(null);
            setSelectedPickupTimeslots([]);
            setSelectedReturnTimeslots([]);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to submit reservation request';
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
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

    const availableCopies = copies.filter((copy) => copy.status === 'available');
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
                                <Space style={{width: '100%', justifyContent: 'space-between'}}>
                                    <Title level={2}>{book.title}</Title>
                                    {user?.role === 'admin' && (
                                        <Button
                                            type="primary"
                                            icon={<EditOutlined/>}
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
                                column={{xs: 1, sm: 2}}
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
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{book.description}</Paragraph>
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
                title="Reserve Book"
                open={reservationModalVisible}
                onOk={handleReserve}
                onCancel={() => {
                    setReservationModalVisible(false);
                    setSelectedDates(null);
                    setSelectedPickupTimeslots([]);
                    setSelectedReturnTimeslots([]);
                }}
                okText="Submit Request"
                cancelText="Cancel"
                confirmLoading={submitting}
            >
                <Form layout="vertical">
                    <Text>From - To:</Text>
                    <DatePicker.RangePicker
                        onChange={(dates) => setSelectedDates(dates as [Dayjs, Dayjs])}
                        value={selectedDates}
                        style={{width: '100%'}}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        format="DD-MM-YYYY"
                    />

                    {selectedDates &&
                        <Form.Item
                            style={{marginTop: '10px'}}
                            label={`Suggested Pickup Times (on ${selectedDates?.[0]?.format('DD-MM-YYYY')})`}
                            required
                            validateStatus={selectedPickupTimeslots.length > 0 ? '' : 'error'}
                            help={
                                selectedPickupTimeslots.length > 0
                                    ? `You can suggest up to ${MAX_SUGGESTED_TIMESLOTS} times (${selectedPickupTimeslots.length}/${MAX_SUGGESTED_TIMESLOTS})`
                                    : 'Please add at least one pickup time'
                            }
                        >
                            <Space direction="vertical" style={{width: '100%'}}>
                                {selectedPickupTimeslots.map((slot, index) => (
                                    <Space key={index}>
                                        <TimePicker
                                            value={slot}
                                            onChange={(time) => {
                                                const newTimeslots = [...selectedPickupTimeslots];
                                                newTimeslots[index] = time || slot;
                                                setSelectedPickupTimeslots(newTimeslots);
                                            }}
                                            format="HH:mm"
                                            minuteStep={30}
                                            needConfirm={false}
                                            showNow={false}
                                        />
                                         - <TimePicker
                                            value={slot.add(30, 'minute')}
                                            disabled
                                            format="HH:mm"
                                            needConfirm={false}
                                            showNow={false}
                                        />
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => handleRemovePickupTimeslot(index)}
                                        />
                                    </Space>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={handleAddTimeslot}
                                    icon={<PlusOutlined/>}
                                    disabled={!selectedDates || selectedPickupTimeslots.length >= MAX_SUGGESTED_TIMESLOTS}
                                >
                                    Add Pickup Time
                                </Button>
                            </Space>
                        </Form.Item>
                    }

                    {selectedDates &&
                        <Form.Item
                            label={`Suggested Return Times (on ${selectedDates?.[1]?.format('DD-MM-YYYY')})`}
                            required
                            validateStatus={selectedReturnTimeslots.length > 0 ? '' : 'error'}
                            help={
                                selectedReturnTimeslots.length > 0
                                    ? `You can suggest up to ${MAX_SUGGESTED_TIMESLOTS} times (${selectedReturnTimeslots.length}/${MAX_SUGGESTED_TIMESLOTS})`
                                    : 'Please add at least one return time'
                            }
                        >
                            <Space direction="vertical" style={{width: '100%'}}>
                                {selectedReturnTimeslots.map((slot, index) => (
                                    <Space key={index}>
                                        <TimePicker
                                            value={slot}
                                            onChange={(time) => {
                                                const newTimeslots = [...selectedReturnTimeslots];
                                                newTimeslots[index] = time || slot;
                                                setSelectedReturnTimeslots(newTimeslots);
                                            }}
                                            format="HH:mm"
                                            minuteStep={30}
                                            needConfirm={false}
                                            showNow={false}
                                        />
                                         - <TimePicker
                                            value={slot.add(30, 'minute')}
                                            disabled
                                            format="HH:mm"
                                            needConfirm={false}
                                            showNow={false}
                                        />
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => handleRemoveReturnTimeslot(index)}
                                        />
                                    </Space>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={handleAddReturnTimeslot}
                                    icon={<PlusOutlined/>}
                                    disabled={!selectedDates || selectedReturnTimeslots.length >= MAX_SUGGESTED_TIMESLOTS}
                                >
                                    Add Return Time
                                </Button>
                            </Space>
                        </Form.Item>
                    }
                </Form>
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