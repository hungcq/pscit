import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Modal, Select, Space, Table, Tabs, Tag, Typography} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {authorsAPI, booksAPI, categoriesAPI, reservationsAPI} from '../services/api';
import {Author, Book, Category, Reservation} from '../types';

const { Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface BookFormData {
  title: string;
  subtitle: string;
  description: string;
  isbn_10: string;
  isbn_13: string;
  published_year: number;
  page_count: number;
  publisher: string;
  google_volume_id: string;
  main_image: string;
  author_ids: string[];
  category_ids: string[];
}

const AdminDashboard: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalVisible, setIsBookModalVisible] = useState(false);
  const [isAuthorModalVisible, setIsAuthorModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [bookForm] = Form.useForm();
  const [authorForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksResponse, reservationsResponse, authorsResponse, categoriesResponse] = await Promise.all([
        booksAPI.getBooks(),
        reservationsAPI.getReservations(),
        authorsAPI.getAuthors(),
        categoriesAPI.getCategories(),
      ]);
      setBooks(booksResponse.data.books);
      setReservations(reservationsResponse.data.reservations);
      setAuthors(authorsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Book management
  const handleDeleteBook = async (id: string) => {
    try {
      await booksAPI.deleteBook(id);
      message.success('Book deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete book:', error);
      message.error('Failed to delete book');
    }
  };

  const showBookModal = (book?: Book) => {
    setEditingBook(book || null);
    if (book) {
      bookForm.setFieldsValue({
        ...book,
        author_ids: book.authors.map(a => a.id),
        category_ids: book.categories.map(c => c.id)
      });
    } else {
      bookForm.resetFields();
    }
    setIsBookModalVisible(true);
  };

  const handleBookCancel = () => {
    setIsBookModalVisible(false);
    setEditingBook(null);
    bookForm.resetFields();
  };

  const handleBookSubmit = async (values: BookFormData) => {
    try {
      if (editingBook) {
        await booksAPI.updateBook(editingBook.id, values);
        message.success('Book updated successfully');
      } else {
        await booksAPI.createBook(values);
        message.success('Book created successfully');
      }

      handleBookCancel();
      loadData();
    } catch (error) {
      console.error('Failed to save book:', error);
      message.error('Failed to save book');
    }
  };

  // Author management
  const handleDeleteAuthor = async (id: string) => {
    try {
      await authorsAPI.deleteAuthor(id);
      message.success('Author deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete author:', error);
      message.error('Failed to delete author');
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
        message.success('Author updated successfully');
      } else {
        await authorsAPI.createAuthor(values);
        message.success('Author created successfully');
      }

      handleAuthorCancel();
      loadData();
    } catch (error) {
      console.error('Failed to save author:', error);
      message.error('Failed to save author');
    }
  };

  // Category management
  const handleDeleteCategory = async (id: string) => {
    try {
      await categoriesAPI.deleteCategory(id);
      message.success('Category deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      message.error('Failed to delete category');
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
      loadData();
    } catch (error) {
      console.error('Failed to save category:', error);
      message.error('Failed to save category');
    }
  };

  // Reservation management
  const handleUpdateReservationStatus = async (id: string, status: Reservation['status']) => {
    try {
      await reservationsAPI.updateReservation(id, status);
      message.success('Reservation status updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      message.error('Failed to update reservation status');
    }
  };

  const bookColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Authors',
      dataIndex: 'authors',
      key: 'authors',
      render: (authors: Author[]) => authors.map(a => a.name).join(', '),
    },
    {
      title: 'Categories',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories: Category[]) => categories.map(c => c.name).join(', '),
    },
    {
      title: 'ISBN10',
      dataIndex: 'isbn_10',
      key: 'isbn_10',
    },
    {
      title: 'Published Year',
      dataIndex: 'published_year',
      key: 'published_year',
    },
    {
      title: 'Publisher',
      dataIndex: 'publisher',
      key: 'publisher',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Book) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => showBookModal(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBook(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

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
            icon={<EditOutlined />}
            onClick={() => showAuthorModal(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAuthor(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
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
      render: (_: any, record: Category) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => showCategoryModal(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCategory(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const reservationColumns = [
    {
      title: 'Book',
      dataIndex: ['book', 'title'],
      key: 'book',
    },
    {
      title: 'User',
      dataIndex: ['user', 'username'],
      key: 'user',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Reservation['status']) => (
        <Tag
          color={
            status === 'approved'
              ? 'green'
              : status === 'pending'
              ? 'orange'
              : 'red'
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Reservation) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                onClick={() => handleUpdateReservationStatus(record.id, 'approved')}
              >
                Approve
              </Button>
              <Button
                danger
                onClick={() => handleUpdateReservationStatus(record.id, 'rejected')}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Admin Dashboard</Title>

        <Tabs defaultActiveKey="books">
          <TabPane tab="Books" key="books">
            <Card
              title="Books"
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showBookModal()}>
                  Add New Book
                </Button>
              }
            >
              <Table
                columns={bookColumns}
                dataSource={books}
                rowKey="id"
                loading={loading}
              />
            </Card>
          </TabPane>

          <TabPane tab="Authors" key="authors">
            <Card
              title="Authors"
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAuthorModal()}>
                  Add New Author
                </Button>
              }
            >
              <Table
                columns={authorColumns}
                dataSource={authors}
                rowKey="id"
                loading={loading}
              />
            </Card>
          </TabPane>

          <TabPane tab="Categories" key="categories">
            <Card
              title="Categories"
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showCategoryModal()}>
                  Add New Category
                </Button>
              }
            >
              <Table
                columns={categoryColumns}
                dataSource={categories}
                rowKey="id"
                loading={loading}
              />
            </Card>
          </TabPane>

          <TabPane tab="Reservations" key="reservations">
            <Card title="Reservations">
              <Table
                columns={reservationColumns}
                dataSource={reservations}
                rowKey="id"
                loading={loading}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Space>

      {/* Book Modal */}
      <Modal
        title={editingBook ? 'Edit Book' : 'Add New Book'}
        open={isBookModalVisible}
        onCancel={handleBookCancel}
        footer={null}
        width={800}
      >
        <Form
          form={bookForm}
          layout="vertical"
          onFinish={handleBookSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter the book title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="subtitle"
            label="Subtitle"
          >
            <Input placeholder="Enter book subtitle" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter the book description' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="isbn_10"
            label="ISBN-10"
            rules={[{ required: true, message: 'Please enter the ISBN-10' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="isbn_13"
            label="ISBN-13"
            rules={[{ required: true, message: 'Please enter the ISBN-13' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="published_year"
            label="Published Year"
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="page_count"
            label="Page Count"
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="publisher"
            label="Publisher"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="google_volume_id"
            label="Google Books Volume ID"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="author_ids"
            label="Authors"
            rules={[{ required: true, message: 'Please select at least one author' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select authors"
              options={authors.map(a => ({ label: a.name, value: a.id }))}
            />
          </Form.Item>

          <Form.Item
            name="category_ids"
            label="Categories"
            rules={[{ required: true, message: 'Please select at least one category' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select categories"
              options={categories.map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>

          <Form.Item
            name="main_image"
            label="Main Image URL"
            rules={[{ required: true, message: 'Please enter the main image URL' }]}
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingBook ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleBookCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
            rules={[{ required: true, message: 'Please enter the author name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="biography"
            label="Biography"
          >
            <TextArea rows={4} />
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
            rules={[{ required: true, message: 'Please enter the category name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
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
    </div>
  );
};

export default AdminDashboard; 