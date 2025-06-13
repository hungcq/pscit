import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Form,
    Grid,
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
import {
    BookOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ShoppingCartOutlined,
    TagOutlined,
    UserOutlined
} from '@ant-design/icons';
import type {Author, Book, BookCopy, Category, Tag as TagModel} from '../types';
import {authorsAPI, bookCopiesAPI, booksAPI, cartAPI, categoriesAPI, reservationsAPI, tagsAPI} from '../api';
import {useAuth} from '../contexts/AuthContext';
import dayjs, {Dayjs} from 'dayjs';
import {getBookImageUrl} from '../utils';
import BookForm, {BookFormData} from '../components/admin/BookForm';
import {useCart} from '../contexts/CartContext';

const {Title, Text, Paragraph} = Typography;
const { useBreakpoint } = Grid;

const MAX_SUGGESTED_TIMESLOTS = 5;

const BookDetails: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {user} = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [copies, setCopies] = useState<BookCopy[]>([]);
    const [loading, setLoading] = useState(true);
    const [reservationModalVisible, setReservationModalVisible] = useState(false);
    const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(null);
    const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
    const [selectedPickupTimeslots, setSelectedPickupTimeslots] = useState<Dayjs[]>([]);
    const [selectedReturnTimeslots, setSelectedReturnTimeslots] = useState<Dayjs[]>([]);
    const [imageError, setImageError] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<TagModel[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const {cartItems, reloadCart} = useCart();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

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
                const [bookResponse, authorsResponse, categoriesResponse, tagsResponse] = await Promise.all([
                    booksAPI.getBook(id!),
                    authorsAPI.getAuthors(),
                    categoriesAPI.getCategories(),
                    tagsAPI.getTags(),
                ]);
                setBook(bookResponse.data);
                setAuthors(authorsResponse.data);
                setCategories(categoriesResponse.data);
                setTags(tagsResponse.data);
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
            await loadCopies();
        } catch (error: any) {
            message.error(error.message || 'Failed to submit reservation request');
        } finally {
            setSubmitting(false);
        }
    };

    const showReservationModal = (copy: BookCopy) => {
        if (!user) {
            navigate("/login")
            return
        }

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
        } catch (error: any) {
            message.error(error.message || 'Failed to update book');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddToCart = async (bookCopyId: string) => {
        try {
            setAddingToCart(true);
            await cartAPI.addToCart(bookCopyId);
            message.success('Added to cart');
            reloadCart();
        } catch (error: any) {
            message.error(error.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
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

    const columns = [
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
            render: (_: any, record: BookCopy) => {
                const inCart = cartItems.some((item: any) => item.book_copy.id === record.id);
                return (
                    <Space>
                        {record.status === 'available' && (
                            <Button
                                type="primary"
                                icon={<ShoppingCartOutlined />}
                                onClick={() => handleAddToCart(record.id)}
                                loading={addingToCart}
                                disabled={inCart}
                            >
                                {inCart ? 'In Cart' : 'Add to Cart'}
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Card>
                <Row gutter={[32, 32]}>
                    {/* Left Column - Book Image and Basic Info */}
                    <Col xs={24} md={8}>
                        <Space direction="vertical" size="large" style={{width: '100%'}}>
                            <img
                                src={imageError ? book?.main_image : getBookImageUrl(book)}
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
                                <Space>
                                    <TagOutlined/>
                                    <Text>{book.tags?.map(t => t.name).join(', ')}</Text>
                                </Space>
                            </Space>
                        </Space>
                    </Col>

                    {/* Right Column - Book Details and Description */}
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size="large" style={{width: '100%'}}>
                            <Descriptions
                                title={<Title level={4}>Book Details</Title>}
                                bordered
                                column={{xs: 1, sm: 2}}
                                size="small"
                            >
                                <Descriptions.Item label="ISBN-10">{book.isbn10}</Descriptions.Item>
                                <Descriptions.Item label="ISBN-13">{book.isbn13}</Descriptions.Item>
                                <Descriptions.Item label="Publisher">{book.publisher}</Descriptions.Item>
                                <Descriptions.Item label="Published Year">{book.published_year}</Descriptions.Item>
                                <Descriptions.Item label="Page Count">{book.page_count}</Descriptions.Item>
                                <Descriptions.Item label="Format">
                                    <Tag color={book.format === 'hardcover' ? 'blue' : 'green'}>
                                        {book.format.charAt(0).toUpperCase() + book.format.slice(1)}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={isBookAvailable ? 'green' : 'red'}>
                                        {isBookAvailable ? 'Available' : 'Not Available'}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>

                            <div>
                                <Title level={4}>Available Copies</Title>
                                {availableCopies.length === 0 ? (
                                  <Text type="secondary">No copies available for reservation</Text>
                                ) : (
                                  isMobile ? (
                                    <Space direction="vertical" style={{width: '100%'}}>
                                        {availableCopies.map((copy) => {
                                            const inCart = cartItems.some((item: any) => item.book_copy.id === copy.id);
                                            return (
                                              <Card key={copy.id} style={{marginBottom: '16px'}}>
                                                  <Space direction="vertical" align="center" style={{width: '100%'}}>
                                                      <Tag color={
                                                          copy.condition === 'new' ? 'green' :
                                                            copy.condition === 'like_new' ? 'lime' :
                                                              copy.condition === 'good' ? 'blue' :
                                                                copy.condition === 'fair' ? 'orange' :
                                                                  'red'
                                                      }>
                                                          {copy.condition.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                      </Tag>
                                                      <Text type="secondary">{copy.notes}</Text>
                                                      <Button
                                                        type="primary"
                                                        icon={<ShoppingCartOutlined />}
                                                        onClick={() => handleAddToCart(copy.id)}
                                                        loading={addingToCart}
                                                        disabled={inCart}
                                                        block
                                                      >
                                                          {inCart ? 'In Cart' : 'Add to Cart'}
                                                      </Button>
                                                  </Space>
                                              </Card>
                                            );
                                        })}
                                    </Space>
                                  ) : (
                                    <Table<BookCopy>
                                      dataSource={availableCopies}
                                      columns={columns}
                                      rowKey="id"
                                      pagination={false}
                                    />
                                  )
                                )}
                            </div>

                            <div>
                                <Title level={4}>Description</Title>
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{book.description}</Paragraph>
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
                width="95%"
                style={{ maxWidth: '500px' }}
            >
                <Form layout="vertical">
                    <Text>From - To:</Text>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <DatePicker
                            placeholder="Start Date"
                            onChange={(date) => {
                                if (date && selectedDates?.[1]) {
                                    setSelectedDates([date, selectedDates[1]]);
                                } else if (date) {
                                    setSelectedDates([date, date]);
                                }
                            }}
                            value={selectedDates?.[0]}
                            style={{ width: '100%' }}
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                            format="DD-MM-YYYY"
                        />
                        <DatePicker
                            placeholder="End Date"
                            onChange={(date) => {
                                if (date && selectedDates?.[0]) {
                                    setSelectedDates([selectedDates[0], date]);
                                }
                            }}
                            value={selectedDates?.[1]}
                            style={{ width: '100%' }}
                            disabledDate={(current) => {
                                if (!current) return false;

                                const today = dayjs().startOf('day');
                                const isBeforeToday = current.isBefore(today);

                                const hasStartDate = !!selectedDates?.[0];
                                const isBeforeStartDate = hasStartDate && current.isBefore(selectedDates[0]);

                                return isBeforeToday || isBeforeStartDate;
                            }}
                            format="DD-MM-YYYY"
                        />
                    </div>

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
                                    <Space key={index} style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space>
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
                                        </Space>
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
                                    style={{ width: '100%' }}
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
                                    <Space key={index} style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space>
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
                                        </Space>
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
                                    style={{ width: '100%' }}
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
                tags={tags}
                loading={submitting}
            />
        </Space>
    );
};

export default BookDetails;