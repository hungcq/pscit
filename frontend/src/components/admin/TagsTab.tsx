import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Modal, Space, Table} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {tagsAPI} from '../../api';
import {Tag} from '../../types';

const { TextArea } = Input;

interface TagsTabProps {
    onDataReload?: () => void;
}

const TagsTab: React.FC<TagsTabProps> = ({
    onDataReload,
}) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTagModalVisible, setIsTagModalVisible] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [tagForm] = Form.useForm();
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
        setPagination(newPagination);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await tagsAPI.getTags();
            setTags(response.data);
            setPagination(prev => ({
                ...prev,
                total: response.data.length
            }));
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTag = async (id: string) => {
        try {
            await tagsAPI.deleteTag(id);
            message.success('Tag deleted successfully');
            onDataReload?.();
            loadData();
        } catch (error: any) {
            message.error(error.message || 'Failed to delete tag');
        }
    };

    const showTagModal = (tag?: Tag) => {
        setEditingTag(tag || null);
        if (tag) {
            tagForm.setFieldsValue(tag);
        } else {
            tagForm.resetFields();
        }
        setIsTagModalVisible(true);
    };

    const handleTagCancel = () => {
        setIsTagModalVisible(false);
        setEditingTag(null);
        tagForm.resetFields();
    };

    const handleTagSubmit = async (values: Partial<Tag>) => {
        try {
            if (editingTag) {
                await tagsAPI.updateTag(editingTag.id, values);
                message.success('Tag updated successfully');
            } else {
                await tagsAPI.createTag(values);
                message.success('Tag created successfully');
            }
            handleTagCancel();
            onDataReload?.();
            loadData();
        } catch (error: any) {
            message.error(error.message || 'Failed to save tag');
        }
    };

    const tagColumns = [
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Tag) => (
                <Space>
                    <Button
                        icon={<EditOutlined/>}
                        onClick={() => showTagModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => handleDeleteTag(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        tag.key.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );

    return (
        <Card
            title="Tags"
            extra={
                <Button type="primary" icon={<PlusOutlined/>} onClick={() => showTagModal()}>
                    Add New Tag
                </Button>
            }
        >
            <Space direction="vertical" style={{width: '100%', marginBottom: 16}}>
                <Input.Search
                    placeholder="Search by name or key"
                    allowClear
                    onSearch={setTagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    style={{width: 300}}
                />
            </Space>
            <Table
                columns={tagColumns}
                dataSource={filteredTags}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            {/* Tag Modal */}
            <Modal
                title={editingTag ? 'Edit Tag' : 'Add New Tag'}
                open={isTagModalVisible}
                onCancel={handleTagCancel}
                footer={null}
            >
                <Form
                    form={tagForm}
                    layout="vertical"
                    onFinish={handleTagSubmit}
                >
                    <Form.Item
                        name="key"
                        label="Key"
                        rules={[{required: true, message: 'Please enter the tag key'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{required: true, message: 'Please enter the tag name'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={4}/>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingTag ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={handleTagCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default TagsTab; 