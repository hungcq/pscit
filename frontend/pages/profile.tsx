import React, { useEffect } from 'react';
import {Card, Descriptions, Space, Tag, Typography} from 'antd';
import {useAuth} from '../contexts/AuthContext';
import { useRouter } from 'next/router';


const {Title} = Typography;

const UserProfile: React.FC = () => {
    const {user} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.replace('/login/');
        }
    }, [user, router]);

    if (!user) {
        return null;
    }

    return (
        <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Title level={2}>User Profile</Title>
            <Card>
                <Descriptions title="User Information" bordered>
                    <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="Role">
                        <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
                            {user.role.toUpperCase()}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                        {new Date(user.created_at).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Updated At">
                        {new Date(user.updated_at).toLocaleDateString()}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </Space>
    );
};

export default UserProfile; 