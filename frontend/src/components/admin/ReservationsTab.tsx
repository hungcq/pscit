import React, {useEffect, useState} from 'react';
import {Button, Card, Form, message, Modal, Select, Space, Table, Tag} from 'antd';
import {reservationsAPI} from '../../services/api';
import {Reservation} from '../../types';
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
    const [selectedTimeslot, setSelectedTimeslot] = useState<string>('');
    const [approveModalVisible, setApproveModalVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await reservationsAPI.getReservations();
            setReservations(response.data.reservations);
        } catch (error) {
            console.error('Failed to load reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateReservationStatus = async (id: string, status: string) => {
        try {
            if (status === 'approved') {
                const reservation = reservations.find(r => r.id === id);
                if (!reservation) return;
                setSelectedReservation(reservation);
                setSelectedTimeslot(reservation.suggested_timeslots?.[0] || '');
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
        if (!selectedReservation || !selectedTimeslot) {
            message.error('Please select a pickup time');
            return;
        }

        try {
            await reservationsAPI.updateReservation(selectedReservation.id, 'approved', selectedTimeslot);
            message.success('Reservation approved successfully');
            setApproveModalVisible(false);
            setSelectedReservation(null);
            setSelectedTimeslot('');
            loadData();
        } catch (error) {
            message.error('Failed to approve reservation');
        }
    };

    const reservationColumns: ColumnsType<Reservation> = [
        {
            title: 'Book',
            dataIndex: ['book_copy', 'book', 'title'],
            key: 'book',
            width: '80',
            render: (text: string, record: Reservation) => record.book_copy?.book?.title || 'N/A',
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
            title: 'Suggested Timeslots',
            dataIndex: 'suggested_timeslots',
            key: 'suggested_timeslots',
            width: '50',
            render: (timeslots: string[]) => (
                <Space direction="vertical">
                    {timeslots?.map((slot, index) => (
                        <Tag key={index} color="blue">
                            {`${dayjs(slot).format('hh:mm A')} - ${dayjs(new Date(slot).getTime() + 30 * 60000).format('hh:mm A')}`}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Pickup Time',
            dataIndex: 'pickup_slot',
            key: 'pickup_slot',
            width: '50',
            render: (date: string) => {
                if (!date) return 'N/A';
                const pickupTime = new Date(date);
                const endTime = new Date(pickupTime.getTime() + 30 * 60000); // Add 30 minutes
                return `${pickupTime.toLocaleDateString('en-GB')} ${pickupTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
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
            width: '100',
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
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card title="Reservations">
                <Table
                    columns={reservationColumns}
                    dataSource={reservations}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <Modal
                title="Approve Reservation"
                open={approveModalVisible}
                onOk={handleApprove}
                onCancel={() => {
                    setApproveModalVisible(false);
                    setSelectedReservation(null);
                    setSelectedTimeslot('');
                }}
                okText="Approve"
                cancelText="Cancel"
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Select Pickup Time"
                        required
                        validateStatus={selectedTimeslot ? '' : 'error'}
                        help={selectedTimeslot ? '' : 'Please select a pickup time'}
                    >
                        <Select
                            value={selectedTimeslot}
                            onChange={setSelectedTimeslot}
                            style={{ width: '100%' }}
                        >
                            {selectedReservation?.suggested_timeslots?.map((slot, index) => (
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