import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Button, DatePicker, Layout, message, Modal, Space, Typography,} from 'antd';
import {ArrowLeftOutlined} from '@ant-design/icons';
import type {Book, BookCopy} from '../types';
import {bookCopiesAPI, booksAPI, reservationsAPI} from '../services/api';
import {useAuth} from '../contexts/AuthContext';

const {Content} = Layout;
const {Title, Text} = Typography;
const {RangePicker} = DatePicker;

const BookDetails: React.FC = () => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {user} = useAuth();
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

    const handleReservation = async () => {
        if (!selectedDates || !selectedCopy) return;

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

    if (loading || !book) {
        return null;
    }

    const availableCopies = copies.filter((copy) => copy.available);

    return (
        <Layout>
            <Content style={{padding: '24px'}}>
                <Button
                    icon={<ArrowLeftOutlined/>}
                    onClick={() => navigate(-1)}
                    style={{marginBottom: '24px'}}
                >
                    Back
                </Button>

                <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
                    <div style={{flex: '0 0 300px'}}>
                        <img
                            src={book.main_image}
                            alt={book.title}
                            style={{width: '100%', borderRadius: '8px'}}
                        />
                    </div>

                    <div style={{flex: '1'}}>
                        <Title level={2}>{book.title}</Title>
                        {book.subtitle && <Title level={4}>{book.subtitle}</Title>}
                        <Text strong>Authors:</Text> {book.authors.map(a => a.name).join(', ')}
                        <br/>
                        <Text strong>Categories:</Text> {book.categories.map(c => c.name).join(', ')}
                        <br/>
                        <Text strong>ISBN:</Text> {book.isbn}
                        <br/>
                        <Text strong>Description:</Text>
                        <p>{book.description}</p>
                        <br/>
                        <Text strong>Available Copies:</Text> {availableCopies.length}
                        <br/>
                        {user && availableCopies.length > 0 && (
                            <Button
                                type="primary"
                                onClick={() => setReservationModalVisible(true)}
                                style={{marginTop: '16px'}}
                            >
                                Reserve a Copy
                            </Button>
                        )}
                    </div>
                </div>

                <Modal
                    title="Reserve a Copy"
                    open={reservationModalVisible}
                    onOk={handleReservation}
                    onCancel={() => {
                        setReservationModalVisible(false);
                        setSelectedDates(null);
                        setSelectedCopy(null);
                    }}
                    okButtonProps={{disabled: !selectedDates || !selectedCopy}}
                >
                    <Space direction="vertical" style={{width: '100%'}}>
                        <div>
                            <Text strong>Select Dates:</Text>
                            <br/>
                            <RangePicker
                                onChange={(dates) => {
                                    if (dates) {
                                        setSelectedDates([dates[0]!.toDate(), dates[1]!.toDate()]);
                                    } else {
                                        setSelectedDates(null);
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <Text strong>Select Copy:</Text>
                            <br/>
                            <Space>
                                {availableCopies.map((copy) => (
                                    <Button
                                        key={copy.id}
                                        type={selectedCopy?.id === copy.id ? 'primary' : 'default'}
                                        onClick={() => setSelectedCopy(copy)}
                                    >
                                        Copy #{copy.id}
                                    </Button>
                                ))}
                            </Space>
                        </div>
                    </Space>
                </Modal>
            </Content>
        </Layout>
    );
};

export default BookDetails;