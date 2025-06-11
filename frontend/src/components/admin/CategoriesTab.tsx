import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Modal, Space, Table} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {categoriesAPI} from '../../api';
import {Category} from '../../types';

const { TextArea } = Input;

interface CategoriesTabProps {
    onDataReload?: () => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
    onDataReload,
}) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryForm] = Form.useForm();
    const [categorySearchQuery, setCategorySearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await categoriesAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await categoriesAPI.deleteCategory(id);
            message.success('Category deleted successfully');
            onDataReload?.();
            loadData();
        } catch (error: any) {
            message.error(error.message || 'Failed to delete category');
        }
    };

    const showCategoryModal = (category?: Category) => {
        setEditingCategory(category || null);
        if (category) {
            categoryForm.setFieldsValue(category);
        } else {
            categoryForm.resetFields();
        }
        setIsCategoryModalVisible(true);
    };

    const handleCategoryCancel = () => {
        setIsCategoryModalVisible(false);
        setEditingCategory(null);
        categoryForm.resetFields();
    };

    const handleCategorySubmit = async (values: Partial<Category>) => {
        try {
            if (editingCategory) {
                await categoriesAPI.updateCategory(editingCategory.id, values);
                message.success('Category updated successfully');
            } else {
                await categoriesAPI.createCategory(values);
                message.success('Category created successfully');
            }
            handleCategoryCancel();
            onDataReload?.();
            loadData();
        } catch (error: any) {
            message.error(error.message || 'Failed to save category');
        }
    };

    const categoryColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        // {
        //     title: 'Description',
        //     dataIndex: 'description',
        //     key: 'description',
        //     ellipsis: true,
        // },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Category) => (
                <Space>
                    <Button
                        icon={<EditOutlined/>}
                        onClick={() => showCategoryModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => handleDeleteCategory(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );

    return (
        <Card
            title="Categories"
            extra={
                <Button type="primary" icon={<PlusOutlined/>} onClick={() => showCategoryModal()}>
                    Add New Category
                </Button>
            }
        >
            <Space direction="vertical" style={{width: '100%', marginBottom: 16}}>
                <Input.Search
                    placeholder="Search by name"
                    allowClear
                    onSearch={setCategorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    style={{width: 300}}
                />
            </Space>
            <Table
                columns={categoryColumns}
                dataSource={filteredCategories}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 5,
                }}
            />

            {/* Category Modal */}
            <Modal
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
                open={isCategoryModalVisible}
                onCancel={handleCategoryCancel}
                footer={null}
            >
                <Form
                    form={categoryForm}
                    layout="vertical"
                    onFinish={handleCategorySubmit}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{required: true, message: 'Please enter the category name'}]}
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
                                {editingCategory ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={handleCategoryCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default CategoriesTab; 