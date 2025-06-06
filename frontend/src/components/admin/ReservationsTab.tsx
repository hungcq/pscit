import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag} from 'antd';
import {reservationsAPI} from '../../api';
import {BookCopy, Reservation} from '../../types';
import dayjs from 'dayjs';
import {ColumnsType} from 'antd/es/table';

interface ReservationsTabProps {
    onDataReload?: () => void;
}

const ReservationsTab: React.FC<ReservationsTabProps> = ({
    onDataReload,
}) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [selectedPickupTimeslot, setSelectedPickupTimeslot] = useState<string>('');
    const [selectedReturnTimeslot, setSelectedReturnTimeslot] = useState<string>('');
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [filters, setFilters] = useState({
        email: '',
        status: '',
        bookTitle: '',
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    useEffect(() => {
        loadData();
    }, [pagination.current, pagination.pageSize, filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await reservationsAPI.getReservations(
                pagination.current,
                pagination.pageSize,
                filters
            );
            setReservations(response.data.reservations);
            setPagination(prev => ({
                ...prev,
                total: response.data.total
            }));
        } catch (error) {
            console.error('Failed to load reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination: any) => {
        setPagination(newPagination);
    };

    const handleSearch = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleStatusChange = (value: string | null) => {
        setFilters(prev => ({ ...prev, status: value || '' }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleResetFilters = () => {
        setFilters({
            email: '',
            status: '',
            bookTitle: '',
        });
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleUpdateReservationStatus = async (id: string, status: string) => {
        try {
            if (status === 'approved') {
                const reservation = reservations.find(r => r.id === id);
                if (!reservation) return;
                setSelectedReservation(reservation);
                setSelectedPickupTimeslot(reservation.suggested_pickup_timeslots?.[0] || '');
                setSelectedReturnTimeslot(reservation.suggested_return_timeslots?.[0] || '');
                setApproveModalVisible(true);
                return;
            }

            await reservationsAPI.updateReservation(id, status);
            message.success(`Reservation ${status} successfully`);
            loadData();
        } catch (error) {
            message.error('Failed to update reservation status');
        }
    };

    const handleApprove = async () => {
        if (!selectedReservation || !selectedPickupTimeslot || !selectedReturnTimeslot) {
            message.error('Please select both pickup and return times');
            return;
        }

        try {
            await reservationsAPI.updateReservation(selectedReservation.id, 'approved', selectedPickupTimeslot, selectedReturnTimeslot);
            message.success('Reservation approved successfully');
            setApproveModalVisible(false);
            setSelectedReservation(null);
            setSelectedPickupTimeslot('');
            setSelectedReturnTimeslot('');
            loadData();
        } catch (error) {
            message.error('Failed to approve reservation');
        }
    };

    const handleReturn = async (id: string) => {
        try {
            await reservationsAPI.updateReservation(id, 'returned');
            message.success('Book returned successfully');
            loadData();
        } catch (error) {
            message.error('Failed to mark book as returned');
        }
    };

    const reservationColumns: ColumnsType<Reservation> = [
        {
            title: 'Book',
            dataIndex: ['book_copy', 'book', 'title'],
            key: 'book',
            render: (text: string, record: Reservation) => (
                <span style={{ fontWeight: 'bold' }}>
                    {record.book_copy?.book?.title || 'N/A'}
                </span>
            ),
        },
        {
            title: 'Copy Condition',
            dataIndex: ['book_copy', 'condition'],
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
            title: 'User Name',
            dataIndex: ['user', 'name'],
            key: 'userName',
        },
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'email',
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (date: string) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (date: string) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
        },
        {
            title: 'Pickup Time',
            dataIndex: 'pickup_time',
            key: 'pickup_time',
            width: 50,
            render: (date: string, record: Reservation) => {
                if (record.status === 'approved' && date) {
                    const pickupTime = new Date(date);
                    const endTime = new Date(pickupTime.getTime() + 30 * 60000);
                    return (
                        <Tag color="green">
                            {`${pickupTime.toLocaleDateString('en-GB')} ${pickupTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </Tag>
                    );
                }
                return (
                    <Space direction="vertical">
                        {record.suggested_pickup_timeslots?.map((slot, index) => (
                            <Tag key={index} color="blue">
                                {`${dayjs(slot).format('DD/MM/YYYY hh:mm A')} - ${dayjs(new Date(slot).getTime() + 30 * 60000).format('hh:mm A')}`}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Return Time',
            dataIndex: 'return_time',
            key: 'return_time',
            width: 50,
            render: (date: string, record: Reservation) => {
                if (record.status === 'approved' && date) {
                    const returnTime = new Date(date);
                    const endTime = new Date(returnTime.getTime() + 30 * 60000);
                    return (
                        <Tag color="green">
                            {`${returnTime.toLocaleDateString('en-GB')} ${returnTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </Tag>
                    );
                }
                return (
                    <Space direction="vertical">
                        {record.suggested_return_timeslots?.map((slot, index) => (
                            <Tag key={index} color="blue">
                                {`${dayjs(slot).format('DD/MM/YYYY hh:mm A')} - ${dayjs(new Date(slot).getTime() + 30 * 60000).format('hh:mm A')}`}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: Reservation['status']) => (
                <Tag color={
                    status === 'pending' ? 'orange' :
                    status === 'approved' ? 'green' :
                    status === 'rejected' ? 'red' :
                    'default'
                }>
                    {status?.toUpperCase() || 'UNKNOWN'}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            render: (date: string) => date ? new Date(date).toLocaleString('en-GB') : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Reservation) => (
                <Space direction="vertical" size="small">
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => handleUpdateReservationStatus(record.id, 'approved')}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                onClick={() => handleUpdateReservationStatus(record.id, 'rejected')}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {record.status === 'approved' && (
                        <Button
                            type="primary"
                            onClick={() => handleReturn(record.id)}
                        >
                            Mark as Returned
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card title="Reservations">
                <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                    <Space wrap>
                        <Input.Search
                            placeholder="Search by book title"
                            allowClear
                            onSearch={(value) => handleSearch('bookTitle', value)}
                            style={{ width: 200 }}
                        />
                        <Input.Search
                            placeholder="Search by email"
                            allowClear
                            onSearch={(value) => handleSearch('email', value)}
                            style={{ width: 200 }}
                        />
                        <Select
                            placeholder="Filter by status"
                            value={filters.status || undefined}
                            onChange={handleStatusChange}
                            style={{ width: 200 }}
                            allowClear
                        >
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="approved">Approved</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                            <Select.Option value="returned">Returned</Select.Option>
                        </Select>
                        <Button onClick={handleResetFilters}>Reset Filters</Button>
                    </Space>
                </Space>

                <Table
                    columns={reservationColumns}
                    dataSource={reservations}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                />
            </Card>

            <Modal
                title="Approve Reservation"
                open={approveModalVisible}
                onOk={handleApprove}
                onCancel={() => {
                    setApproveModalVisible(false);
                    setSelectedReservation(null);
                    setSelectedPickupTimeslot('');
                    setSelectedReturnTimeslot('');
                }}
                okText="Approve"
                cancelText="Cancel"
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Select Pickup Time"
                        required
                        validateStatus={selectedPickupTimeslot ? '' : 'error'}
                        help={selectedPickupTimeslot ? '' : 'Please select a pickup time'}
                    >
                        <Select
                            value={selectedPickupTimeslot}
                            onChange={setSelectedPickupTimeslot}
                            style={{ width: '100%' }}
                        >
                            {selectedReservation?.suggested_pickup_timeslots?.map((slot, index) => (
                                <Select.Option key={index} value={slot}>
                                    {`${dayjs(slot).format('hh:mm A')} - ${dayjs(new Date(slot).getTime() + 30 * 60000).format('hh:mm A')}`}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Select Return Time"
                        required
                        validateStatus={selectedReturnTimeslot ? '' : 'error'}
                        help={selectedReturnTimeslot ? '' : 'Please select a return time'}
                    >
                        <Select
                            value={selectedReturnTimeslot}
                            onChange={setSelectedReturnTimeslot}
                            style={{ width: '100%' }}
                        >
                            {selectedReservation?.suggested_return_timeslots?.map((slot, index) => (
                                <Select.Option key={index} value={slot}>
                                    {`${dayjs(slot).format('hh:mm A')} - ${dayjs(new Date(slot).getTime() + 30 * 60000).format('hh:mm A')}`}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ReservationsTab; 