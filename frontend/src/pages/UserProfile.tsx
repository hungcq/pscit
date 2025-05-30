import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Tag, Spin, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { reservationsAPI } from '../services/api';
import { Reservation } from '../types';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const { user } = useAuth();
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

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Card>
        <Title level={2}>Profile</Title>
        <div style={{ marginBottom: '24px' }}>
          <Text strong>Username:</Text> {user.username}
        </div>
        <div style={{ marginBottom: '24px' }}>
          <Text strong>Email:</Text> {user.email}
        </div>
        <div style={{ marginBottom: '24px' }}>
          <Text strong>Role:</Text>{' '}
          <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
            {user.role.toUpperCase()}
          </Tag>
        </div>
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <Title level={3}>My Reservations</Title>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={reservations}
            renderItem={(reservation) => (
              <List.Item>
                <List.Item.Meta
                  title={reservation.book.title}
                  description={
                    <>
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
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default UserProfile; 