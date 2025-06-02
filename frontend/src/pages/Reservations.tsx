import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Tag, Spin, message } from 'antd';
import { reservationsAPI } from '../services/api';
import { Reservation } from '../types';

const { Title, Text } = Typography;

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const response = await reservationsAPI.getUserReservations();
        setReservations(response.data);
      } catch (error) {
        console.error('Failed to load reservations:', error);
        message.error('Failed to load your reservations');
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Title level={2}>My Reservations</Title>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default Reservations; 