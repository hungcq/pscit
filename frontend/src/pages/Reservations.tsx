import React, {useEffect, useState} from 'react';
import {App, Space, Spin, Table, Tag, Typography} from 'antd';
import {useAuth} from '../contexts/AuthContext';
import {reservationsAPI} from '../services/api';
import {Reservation} from '../types';

const { Title } = Typography;

const Reservations: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuth();
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
      dataIndex: ['bookCopy', 'book', 'title'],
      key: 'book',
      render: (text: string, record: Reservation) => record.bookCopy?.book?.title || 'N/A',
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
      title: 'Requested At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
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
      />
    </Space>
  );
};

export default Reservations; 