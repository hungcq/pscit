import React, {useEffect, useState} from 'react';
import {App, Space, Spin, Table, Tag, Typography} from 'antd';
import {reservationsAPI} from '../services/api';
import {BookCopy, Reservation} from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const UserReservations: React.FC = () => {
  const { message } = App.useApp();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReservations();
  }, [currentPage]);

  const fetchReservations = async () => {
    try {
      const response = await reservationsAPI.getUserReservations(currentPage);
      setReservations(response.data.reservations);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      message.error('Failed to load reservations');
      setReservations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Book',
      dataIndex: ['book_copy', 'book', 'title'],
      key: 'book',
      render: (text: string, record: Reservation) => record.book_copy?.book?.title || 'N/A',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
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
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleString('en-GB') : 'N/A',
    },
  ];

  if (loading) {
    return (
      <Space direction="vertical" align="center" style={{ width: '100%', marginTop: '100px' }}>
        <Spin size="large" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>My Reservations</Title>
      <Table
        dataSource={reservations}
        columns={columns}
        rowKey="id"
        pagination={{
          current: currentPage,
          total: total,
          pageSize: 10,
          onChange: (page) => setCurrentPage(page),
        }}
        locale={{ emptyText: 'No reservations found' }}
        style={{height: '75vh'}}
      />
    </Space>
  );
};

export default UserReservations;