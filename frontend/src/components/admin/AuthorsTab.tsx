import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Input, Modal, Space, Table} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {authorsAPI} from '../../api';
import {Author} from '../../types';

const { TextArea } = Input;

interface AuthorsTabProps {
    onDataReload?: () => void;
}

const AuthorsTab: React.FC<AuthorsTabProps> = ({
    onDataReload,
}) => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorModalVisible, setIsAuthorModalVisible] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
    const [authorForm] = Form.useForm();
    const [authorSearchQuery, setAuthorSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await authorsAPI.getAuthors();
            setAuthors(response.data);
        } catch (error) {
            console.error('Failed to load authors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAuthor = async (id: string) => {
        try {
            await authorsAPI.deleteAuthor(id);
            onDataReload?.();
            loadData();
        } catch (error) {
            console.error('Failed to delete author:', error);
        }
    };

    const showAuthorModal = (author?: Author) => {
        setEditingAuthor(author || null);
        if (author) {
            authorForm.setFieldsValue(author);
        } else {
            authorForm.resetFields();
        }
        setIsAuthorModalVisible(true);
    };

    const handleAuthorCancel = () => {
        setIsAuthorModalVisible(false);
        setEditingAuthor(null);
        authorForm.resetFields();
    };

    const handleAuthorSubmit = async (values: Partial<Author>) => {
        try {
            if (editingAuthor) {
                await authorsAPI.updateAuthor(editingAuthor.id, values);
            } else {
                await authorsAPI.createAuthor(values);
            }
            handleAuthorCancel();
            onDataReload?.();
            loadData();
        } catch (error) {
            console.error('Failed to save author:', error);
        }
    };

    const authorColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Biography',
            dataIndex: 'biography',
            key: 'biography',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Author) => (
                <Space>
                    <Button
                        icon={<EditOutlined/>}
                        onClick={() => showAuthorModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => handleDeleteAuthor(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    const filteredAuthors = authors.filter(author =>
        author.name.toLowerCase().includes(authorSearchQuery.toLowerCase())
    );

    return (
        <Card
            title="Authors"
            extra={
                <Button type="primary" icon={<PlusOutlined/>} onClick={() => showAuthorModal()}>
                    Add New Author
                </Button>
            }
        >
            <Space direction="vertical" style={{width: '100%', marginBottom: 16}}>
                <Input.Search
                    placeholder="Search by name"
                    allowClear
                    onSearch={setAuthorSearchQuery}
                    onChange={(e) => setAuthorSearchQuery(e.target.value)}
                    style={{width: 300}}
                />
            </Space>
            <Table
                columns={authorColumns}
                dataSource={filteredAuthors}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 5,
                }}
            />

            {/* Author Modal */}
            <Modal
                title={editingAuthor ? 'Edit Author' : 'Add New Author'}
                open={isAuthorModalVisible}
                onCancel={handleAuthorCancel}
                footer={null}
            >
                <Form
                    form={authorForm}
                    layout="vertical"
                    onFinish={handleAuthorSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{required: true, message: 'Please enter the author name'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item
                        name="biography"
                        label="Biography"
                    >
                        <TextArea rows={4}/>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingAuthor ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={handleAuthorCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default AuthorsTab; 