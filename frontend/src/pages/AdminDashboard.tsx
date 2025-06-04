import React, {useEffect, useState} from 'react';
import {App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, Typography} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {authorsAPI, bookCopiesAPI, booksAPI, categoriesAPI, reservationsAPI} from '../services/api';
import {Author, Book, BookCopy, Category, Reservation} from '../types';

const {Title} = Typography;
const {TextArea} = Input;

interface BookFormData {
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
    author_ids: string[];
    category_ids: string[];
}

const AdminDashboard: React.FC = () => {
    const { message } = App.useApp();
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
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [authorSearchQuery, setAuthorSearchQuery] = useState('');
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState<string>('');
    const [bookCopies, setBookCopies] = useState<{ [key: string]: BookCopy[] }>({});
    const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
    const [selectedBookForCopy, setSelectedBookForCopy] = useState<Book | null>(null);
    const [copyForm] = Form.useForm();
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, [pagination.current, pagination.pageSize, searchQuery, selectedAuthor, selectedCategory]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [booksResponse, reservationsResponse, authorsResponse, categoriesResponse] = await Promise.all([
                booksAPI.getBooks(
                    searchQuery,
                    selectedCategory,
                    selectedAuthor,
                    pagination.current,
                    pagination.pageSize
                ),
                reservationsAPI.getReservations(),
                authorsAPI.getAuthors(),
                categoriesAPI.getCategories(),
            ]);
            setBooks(booksResponse.data.books);
            setPagination(prev => ({
                ...prev,
                total: booksResponse.data.total
            }));
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

    const handleTableChange = (newPagination: any) => {
        setPagination(newPagination);
        loadData();
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPagination(prev => ({...prev, current: 1}));
    };

    const handleAuthorFilter = (value: string) => {
        const selectedAuthor = authors.find(a => a.id === value);
        setSelectedAuthor(selectedAuthor?.name || '');
        setPagination(prev => ({...prev, current: 1}));
    };

    const handleCategoryFilter = (value: string) => {
        const selectedCategory = categories.find(c => c.id === value);
        setSelectedCategory(selectedCategory?.name || '');
        setPagination(prev => ({...prev, current: 1}));
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedAuthor('');
        setSelectedCategory('');
        setPagination(prev => ({...prev, current: 1}));
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
            let updatedBook: Book;
            if (editingBook) {
                const response = await booksAPI.updateBook(editingBook.id, values);
                updatedBook = response.data;
                message.success('Book updated successfully');
            } else {
                const response = await booksAPI.createBook(values);
                updatedBook = response.data;
                message.success('Book created successfully');
            }

            handleBookCancel();
            // Update the book in the list
            setBooks(prevBooks => {
                if (editingBook) {
                    // Update existing book
                    return prevBooks.map(book => 
                        book.id === updatedBook.id ? updatedBook : book
                    );
                } else {
                    // Add new book to the beginning of the list
                    return [updatedBook, ...prevBooks];
                }
            });
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

    const loadBookCopies = async (bookId: string) => {
        try {
            const response = await bookCopiesAPI.getBookCopies(bookId);
            setBookCopies(prev => ({...prev, [bookId]: response.data}));
        } catch (error) {
            console.error('Failed to load book copies:', error);
            message.error('Failed to load book copies');
        }
    };

    useEffect(() => {
        if (selectedBook) {
            loadBookCopies(selectedBook);
        }
    }, [selectedBook]);

    const handleBookSelect = (bookId: string) => {
        setSelectedBook(bookId);
    };

    const showCopyModal = (book: Book) => {
        setSelectedBookForCopy(book);
        copyForm.resetFields();
        setIsCopyModalVisible(true);
        // Load copies if not already loaded
        if (!bookCopies[book.id]) {
            loadBookCopies(book.id);
        }
    };

    const handleCopyCancel = () => {
        setIsCopyModalVisible(false);
        setSelectedBookForCopy(null);
        copyForm.resetFields();
    };

    const handleCopySubmit = async (values: { count: number; condition: BookCopy['condition'] }) => {
        if (!selectedBookForCopy) return;

        try {
            await bookCopiesAPI.bulkCreateBookCopies(selectedBookForCopy.id, values.count, values.condition);
            message.success('Book copies created successfully');
            handleCopyCancel();
            loadBookCopies(selectedBookForCopy.id);
        } catch (error) {
            console.error('Failed to create book copies:', error);
            message.error('Failed to create book copies');
        }
    };

    const handleDeleteCopy = async (bookId: string, copyId: string) => {
        try {
            await bookCopiesAPI.deleteBookCopy(copyId);
            message.success('Book copy deleted successfully');
            loadBookCopies(bookId);
        } catch (error) {
            console.error('Failed to delete book copy:', error);
            message.error('Failed to delete book copy');
        }
    };

    const expandedRowRender = (book: Book) => {
        const copies = bookCopies[book.id] || [];

        const copyColumns = [
            {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
            },
            {
                title: 'Condition',
                dataIndex: 'condition',
                key: 'condition',
                render: (condition: BookCopy['condition']) => (
                    <Tag color={
                        condition === 'new' ? 'green' :
                            condition === 'like_new' ? 'lime' :
                            condition === 'good' ? 'blue' :
                            condition === 'fair' ? 'orange' :
                            'red'
                    }>
                        {condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Tag>
                ),
            },
            {
                title: 'Available',
                dataIndex: 'available',
                key: 'available',
                render: (available: boolean) => (
                    <Tag color={available ? 'green' : 'red'}>
                        {available ? 'YES' : 'NO'}
                    </Tag>
                ),
            },
            {
                title: 'Notes',
                dataIndex: 'notes',
                key: 'notes',
            },
            {
                title: 'Actions',
                key: 'actions',
                render: (_: any, record: BookCopy) => (
                    <Space direction="vertical" size="small">
                        <Button
                            danger
                            icon={<DeleteOutlined/>}
                            onClick={() => handleDeleteCopy(book.id, record.id)}
                        >
                            Delete
                        </Button>
                    </Space>
                ),
            },
        ];

        return (
            <div>
                <div style={{marginBottom: 16}}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined/>}
                        onClick={() => showCopyModal(book)}
                    >
                        Add New Copies
                    </Button>
                </div>
                <Table
                    columns={copyColumns}
                    dataSource={copies}
                    rowKey="id"
                    pagination={false}
                />
            </div>
        );
    };

    const handleShowCopies = (bookId: string) => {
        setExpandedRowKeys(prev => {
            if (prev.includes(bookId)) {
                return prev.filter(id => id !== bookId);
            }
            return [...prev, bookId];
        });
        if (!bookCopies[bookId]) {
            loadBookCopies(bookId);
        }
    };

    const bookColumns = [
        {
            title: '',
            key: 'image',
            width: 80,
            render: (record: Book) => (
                <img 
                    src={record.main_image} 
                    alt={record.title}
                    style={{ 
                        width: '100px',
                        objectFit: 'contain',
                        borderRadius: '4px'
                    }}
                />
            ),
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Subtitle',
            dataIndex: 'subtitle',
            key: 'Subtitle',
            width: 200,
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
            width: 300,
            render: (categories: Category[]) => {
                if (categories.length <= 3) {
                    return categories.map(c => c.name).join(', ');
                }
                const firstThree = categories.slice(0, 3).map(c => c.name).join(', ');
                const remaining = categories.length - 3;
                return `${firstThree}...`;
            },
        },
        {
            title: 'ISBN-10',
            dataIndex: 'isbn10',
            key: 'isbn10',
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
                <Space direction="vertical" size="small">
                    <Button
                        icon={<EditOutlined/>}
                        onClick={() => showBookModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={() => handleShowCopies(record.id)}
                    >
                        {expandedRowKeys.includes(record.id) ? 'Hide Copies' : 'Show Copies'}
                    </Button>
                    <Button
                        icon={<DeleteOutlined/>}
                        danger
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

    const reservationColumns = [
        {
            title: 'Book',
            dataIndex: ['book_copy', 'book', 'title'],
            key: 'book',
        },
        {
            title: 'User',
            dataIndex: ['user', 'name'],
            key: 'user',
        },
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'user_email',
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
        },
        {
            title: 'Pickup Time',
            dataIndex: 'pickup_slot',
            key: 'pickup_slot',
            render: (date: string) => {
                if (!date) return 'N/A';
                const pickupTime = new Date(date);
                const endTime = new Date(pickupTime.getTime() + 30 * 60000); // Add 30 minutes
                return `${pickupTime.toLocaleDateString('en-GB')} ${pickupTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            },
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
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString('en-GB'),
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

    const filteredAuthors = authors.filter(author =>
        author.name.toLowerCase().includes(authorSearchQuery.toLowerCase())
    );

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );

    const tabItems = [
        {
            key: 'books',
            label: 'Books',
            children: (
                <Card
                    title="Books"
                    extra={
                        <Button type="primary" icon={<PlusOutlined/>} onClick={() => showBookModal()}>
                            Add New Book
                        </Button>
                    }
                >
                    <Space direction="vertical" style={{width: '100%', marginBottom: 16}}>
                        <Space wrap>
                            <Input.Search
                                placeholder="Search by title or subtitle..."
                                allowClear
                                onSearch={handleSearch}
                                style={{width: 300}}
                            />
                            <Select
                                placeholder="Filter by author"
                                allowClear
                                style={{width: 200}}
                                onChange={handleAuthorFilter}
                                value={selectedAuthor || undefined}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={authors.map(a => ({label: a.name, value: a.id}))}
                            />
                            <Select
                                placeholder="Filter by category"
                                allowClear
                                style={{width: 200}}
                                onChange={handleCategoryFilter}
                                value={selectedCategory || undefined}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={categories.map(c => ({label: c.name, value: c.id}))}
                            />
                            <Button onClick={handleResetFilters}>Reset Filters</Button>
                        </Space>
                    </Space>
                    <Table
                        columns={bookColumns}
                        dataSource={books}
                        rowKey="id"
                        loading={loading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        expandable={{
                            expandedRowRender,
                            expandedRowKeys,
                            expandIcon: () => null,
                        }}
                    />
                </Card>
            ),
        },
        {
            key: 'authors',
            label: 'Authors',
            children: (
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
                    />
                </Card>
            ),
        },
        {
            key: 'categories',
            label: 'Categories',
            children: (
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
                    />
                </Card>
            ),
        },
        {
            key: 'reservations',
            label: 'Reservations',
            children: (
                <Card title="Reservations">
                    <Table
                        columns={reservationColumns}
                        dataSource={reservations}
                        rowKey="id"
                        loading={loading}
                    />
                </Card>
            ),
        },
    ];

    return (
        <>
            <Space direction="vertical" size="large" style={{width: '100%'}}>
                <Title level={2}>Admin Dashboard</Title>

                <Tabs defaultActiveKey="books" items={tabItems} />
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
                        rules={[{required: true, message: 'Please enter the book description'}]}
                    >
                        <TextArea rows={4}/>
                    </Form.Item>

                    <Form.Item
                        name="isbn10"
                        label="ISBN-10"
                        rules={[{required: true, message: 'Please enter the ISBN-10'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item
                        name="isbn13"
                        label="ISBN-13"
                        rules={[{required: true, message: 'Please enter the ISBN-13'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item
                        name="published_year"
                        label="Published Year"
                    >
                        <InputNumber/>
                    </Form.Item>

                    <Form.Item
                        name="page_count"
                        label="Page Count"
                    >
                        <InputNumber/>
                    </Form.Item>

                    <Form.Item
                        name="publisher"
                        label="Publisher"
                    >
                        <Input/>
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
                        rules={[{required: true, message: 'Please select at least one category'}]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select categories"
                            options={categories.map(c => ({label: c.name, value: c.id}))}
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

            {/* Copy Modal */}
            <Modal
                title={`Add Copies - ${selectedBookForCopy?.title}`}
                open={isCopyModalVisible}
                onCancel={handleCopyCancel}
                footer={null}
            >
                <Form
                    form={copyForm}
                    layout="vertical"
                    onFinish={handleCopySubmit}
                >
                    <Form.Item
                        name="count"
                        label="Number of Copies"
                        rules={[
                            {required: true, message: 'Please enter the number of copies'},
                            {type: 'number', min: 1, message: 'Must be at least 1'}
                        ]}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>

                    <Form.Item
                        name="condition"
                        label="Condition"
                        rules={[{required: true, message: 'Please select the condition'}]}
                    >
                        <Select>
                            <Select.Option value="new">New</Select.Option>
                            <Select.Option value="like_new">Like New</Select.Option>
                            <Select.Option value="good">Good</Select.Option>
                            <Select.Option value="fair">Fair</Select.Option>
                            <Select.Option value="poor">Poor</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Create Copies
                            </Button>
                            <Button onClick={handleCopyCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AdminDashboard; 