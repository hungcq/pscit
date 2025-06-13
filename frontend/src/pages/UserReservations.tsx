import React, {useEffect, useState} from 'react';
import {App, Card, Grid, Space, Spin, Table, Tag, Typography} from 'antd';
import {reservationsAPI} from '../api';
import {BookCopy, Reservation} from '../types';
import dayjs from 'dayjs';
import {ColumnsType} from "antd/es/table";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const UserReservations: React.FC = () => {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: BookCopy['condition']) => {
    switch (condition) {
      case 'new': return 'green';
      case 'like_new': return 'lime';
      case 'good': return 'blue';
      case 'fair': return 'orange';
      default: return 'red';
    }
  };

  const formatTimeSlots = (slots: string[] | undefined) => {
    if (!slots || slots.length === 0) return null;
    return (
        <Space direction="vertical" style={{ width: '100%' }}>
          {slots.map((slot, index) => (
              <span key={index}>
                • {dayjs(slot).format('DD/MM/YYYY hh:mm A')} - {dayjs(new Date(slot).getTime() + 30 * 60000).format('hh:mm A')}
              </span>
          ))}
        </Space>
    );
  };

  const formatApprovedTime = (date: string) => {
    if (!date) return null;
    const time = new Date(date);
    const endTime = new Date(time.getTime() + 30 * 60000);
    return `${time.toLocaleDateString('en-GB')} ${time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
  };

  const columns: ColumnsType<Reservation> = [
    {
      title: 'Books',
      key: 'books',
      render: (_, record: Reservation) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {record.book_copies.map((bookCopy: BookCopy) => (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{bookCopy.book.title}</Text>
              <Space>
                <Tag color={getConditionColor(bookCopy.condition)}>
                  {bookCopy.condition.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Tag>
                <Tag color={bookCopy.book.format === 'hardcover' ? 'blue' : 'green'}>
                  {bookCopy.book.format.charAt(0).toUpperCase() + bookCopy.book.format.slice(1)}
                </Tag>
              </Space>
            </Space>
          ))}
        </Space>
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
        if (record.status === 'approved') {
          return formatApprovedTime(date);
        }
        return formatTimeSlots(record.suggested_pickup_timeslots);
      },
    },
    {
      title: 'Return Time',
      dataIndex: 'return_time',
      key: 'return_time',
      render: (date: string, record: Reservation) => {
        if (record.status === 'approved') {
          return formatApprovedTime(date);
        }
        return formatTimeSlots(record.suggested_return_timeslots);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
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
    <Card title="My Reservations">
      {isMobile ? (
        // Mobile Card View
        <Space direction="vertical" style={{ width: '100%' }}>
          {reservations.map((reservation) => (
            <Card key={reservation.id} style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>Books</Title>
                {reservation.book_copies.map((bookCopy: BookCopy) => (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{bookCopy.book.title}</Text>
                    <Space>
                      <Tag color={getConditionColor(bookCopy.condition)}>
                        {bookCopy.condition.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Tag>
                      <Tag color={bookCopy.book.format === 'hardcover' ? 'blue' : 'green'}>
                        {bookCopy.book.format.charAt(0).toUpperCase() + bookCopy.book.format.slice(1)}
                      </Tag>
                    </Space>
                  </Space>
                ))}

                <div>
                  <Text strong>Period: </Text>
                  <Text>{`${new Date(reservation.start_date).toLocaleDateString('en-GB')} - ${new Date(reservation.end_date).toLocaleDateString('en-GB')}`}</Text>
                </div>

                <div>
                  <Text strong>Pickup Time: </Text>
                  {reservation.status === 'approved' 
                    ? formatApprovedTime(reservation.pickup_time || '')
                    : formatTimeSlots(reservation.suggested_pickup_timeslots)}
                </div>

                <div>
                  <Text strong>Return Time: </Text>
                  {reservation.status === 'approved'
                    ? formatApprovedTime(reservation.return_time || '')
                    : formatTimeSlots(reservation.suggested_return_timeslots)}
                </div>

                <div>
                  <Text strong>Status: </Text>
                  <Tag color={getStatusColor(reservation.status)}>
                    {reservation.status?.toUpperCase() || 'UNKNOWN'}
                  </Tag>
                </div>
              </Space>
            </Card>
          ))}
        </Space>
      ) : (
        // Desktop Table View
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
      )}
    </Card>
  );
};

export default UserReservations;