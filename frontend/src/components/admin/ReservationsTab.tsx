import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag } from 'antd';
import { reservationsAPI } from '../../services/api';
import { Reservation } from '../../types';

interface ReservationsTabProps {
    onDataReload?: () => void;
}

const ReservationsTab: React.FC<ReservationsTabProps> = ({
    onDataReload,
}) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleUpdateReservationStatus = async (id: string, status: Reservation['status']) => {
        try {
            await reservationsAPI.updateReservation(id, status);
            onDataReload?.();
            loadData();
        } catch (error) {
            console.error('Failed to update reservation status:', error);
        }
    };

    const reservationColumns = [
        {
            title: 'Book',
            dataIndex: ['book_copy', 'book', 'title'],
            key: 'book',
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
            title: 'Pickup Time',
            dataIndex: 'pickup_slot',
            key: 'pickup_slot',
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
            render: (date: string) => date ? new Date(date).toLocaleString('en-GB') : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Reservation) => (
                <Space>
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
        <Card title="Reservations">
            <Table
                columns={reservationColumns}
                dataSource={reservations}
                rowKey="id"
                loading={loading}
            />
        </Card>
    );
};

export default ReservationsTab; 