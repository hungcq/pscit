import React from 'react';
import {Button, Form, Input, InputNumber, Modal, Select, Space} from 'antd';
import {Author, Book, Category, Tag} from '../../types';

const { TextArea } = Input;

export interface BookFormData {
    title: string;
    subtitle: string;
    description: string;
    isbn10: string;
    isbn13: string;
    published_year: number;
    page_count: number;
    publisher: string;
    google_volume_id: string;
    main_image: string;
    format: 'paperback' | 'hardcover';
    author_ids: string[];
    category_ids: string[];
    tag_ids: string[];
}

interface BookFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: BookFormData) => Promise<boolean>;
    initialValues: Book | null;
    authors: Author[];
    categories: Category[];
    tags: Tag[];
    loading?: boolean;
}

const BookForm: React.FC<BookFormProps> = ({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    authors,
    categories,
    tags,
    loading = false,
}) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (visible && initialValues) {
            form.setFieldsValue({
                ...initialValues,
                author_ids: initialValues.authors.map(a => a.id),
                category_ids: initialValues.categories.map(c => c.id),
                tag_ids: initialValues.tags?.map(t => t.id),
            });
        } else {
            form.resetFields();
        }
    }, [visible, initialValues, form]);

    const handleSubmit = async (values: BookFormData) => {
        try {
            const success = await onSubmit(values);
            success && form.resetFields();
        } catch (error) {
            // Error handling is done in the parent component
        }
    };

    return (
        <Modal
            title={initialValues ? 'Edit Book' : 'Add New Book'}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="title"
                    label="Title"
                    rules={[{required: true, message: 'Please enter the book title'}]}
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    name="subtitle"
                    label="Subtitle"
                >
                    <Input placeholder="Enter book subtitle"/>
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <TextArea 
                        rows={4} 
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        style={{ whiteSpace: 'pre-wrap' }}
                    />
                </Form.Item>

                <Form.Item
                    name="isbn10"
                    label="ISBN-10"
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    name="isbn13"
                    label="ISBN-13"
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    name="published_year"
                    label="Published Year"
                >
                    <InputNumber style={{ width: '100%' }}/>
                </Form.Item>

                <Form.Item
                    name="page_count"
                    label="Page Count"
                >
                    <InputNumber style={{ width: '100%' }}/>
                </Form.Item>

                <Form.Item
                    name="publisher"
                    label="Publisher"
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    name="format"
                    label="Format"
                    rules={[{required: true, message: 'Please select a format'}]}
                >
                    <Select>
                        <Select.Option value="paperback">Paperback</Select.Option>
                        <Select.Option value="hardcover">Hardcover</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="google_volume_id"
                    label="Google Books Volume ID"
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    name="author_ids"
                    label="Authors"
                    rules={[{required: true, message: 'Please select at least one author'}]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select authors"
                        options={authors.map(a => ({label: a.name, value: a.id}))}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="category_ids"
                    label="Categories"
                >
                    <Select
                        mode="multiple"
                        placeholder="Select categories"
                        options={categories.map(c => ({label: c.name, value: c.id}))}
                        showSearch
                        autoClearSearchValue={false}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="tag_ids"
                    label="Tags"
                >
                    <Select
                        mode="multiple"
                        placeholder="Select tags"
                        options={tags.map(t => ({label: t.name, value: t.id}))}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="main_image"
                    label="Main Image URL"
                >
                    <Input placeholder="https://example.com/image.jpg"/>
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {initialValues ? 'Update' : 'Create'}
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default BookForm; 