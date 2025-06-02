import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Tag, Spin, message, Pagination } from 'antd';
import { reservationsAPI } from '../services/api';
import { Reservation } from '../types';

const { Title, Text } = Typography;

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadReservations = async (page: number, size: number) => {
    try {
      const response = await reservationsAPI.getUserReservations();
      if (response.data && Array.isArray(response.data.reservations)) {
        setReservations(response.data.reservations);
        setTotal(response.data.total);
      } else {
        console.error('Invalid response format:', response.data);
        setReservations([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
      message.error('Failed to load your reservations');
      setReservations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Title level={2}>My Reservations</Title>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <List
            dataSource={reservations}
            renderItem={(reservation) => (
              <Card style={{ marginBottom: '16px' }}>
                <List.Item.Meta
                  title={reservation.book.title}
                  description={
                    <>
                      <div>
                        <Text strong>Authors:</Text> {reservation.book.authors.map(a => a.name).join(', ')}
                      </div>
                      <div>
                        <Text strong>Start Date:</Text>{' '}
                        {new Date(reservation.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <Text strong>End Date:</Text>{' '}
                        {new Date(reservation.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <Text strong>Status:</Text>{' '}
                        <Tag
                          color={
                            reservation.status === 'approved'
                              ? 'green'
                              : reservation.status === 'pending'
                              ? 'orange'
                              : 'red'
                          }
                        >
                          {reservation.status.toUpperCase()}
                        </Tag>
                      </div>
                    </>
                  }
                />
              </Card>
            )}
          />
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Reservations; 