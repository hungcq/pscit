import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {authorsAPI, bookCopiesAPI, booksAPI, categoriesAPI} from '../../api';
import {Author, Book, BookCopy, Category} from '../../types';
import {getBookImageUrl} from '../../utils';
import {useLocation, useNavigate} from 'react-router-dom';
import BookForm, {BookFormData} from './BookForm';

const BooksTab: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const editBookId = searchParams.get('edit');
    const [books, setBooks] = useState<Book[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isBookModalVisible, setIsBookModalVisible] = useState(false);
    const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [selectedBookForCopy, setSelectedBookForCopy] = useState<Book | null>(null);
    const [bookForm] = Form.useForm();
    const [copyForm] = Form.useForm();
    const [bookCopies, setBookCopies] = useState<{ [key: string]: BookCopy[] }>({});
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
    const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
    const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);
    const [isEditCopyModalVisible, setIsEditCopyModalVisible] = useState(false);
    const [isbn13, setIsbn13] = useState<string>('');

    useEffect(() => {
        loadData();
    }, [pagination.current, pagination.pageSize, searchQuery, selectedAuthor, selectedCategory, isbn13]);

    useEffect(() => {
        if (editBookId) {
            const bookToEdit = books.find(b => b.id === editBookId);
            if (bookToEdit) {
                showBookModal(bookToEdit);
                navigate(location.pathname, { replace: true });
            }
        }
    }, [editBookId, books]);

    useEffect(() => {
        const loadImageUrls = async () => {
            const newImageUrls: { [key: string]: string } = {};
            for (const book of books) {
                newImageUrls[book.id] = getBookImageUrl(book.id);
            }
            setImageUrls(newImageUrls);
        };
        loadImageUrls();
    }, [books]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [booksResponse, authorsResponse, categoriesResponse] = await Promise.all([
                booksAPI.getBooks(
                    searchQuery,
                    selectedCategory,
                    selectedAuthor,
                    isbn13,
                    pagination.current,
                    pagination.pageSize
                ),
                authorsAPI.getAuthors(),
                categoriesAPI.getCategories(),
            ]);
            setBooks(booksResponse.data.books);
            setPagination(prev => ({
                ...prev,
                total: booksResponse.data.total
            }));
            setAuthors(authorsResponse.data);
            setCategories(categoriesResponse.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination: any) => {
        setPagination(newPagination);
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
        setIsbn13('');
        setPagination(prev => ({...prev, current: 1}));
    };

    const handleDeleteBook = async (id: string) => {
        try {
            await booksAPI.deleteBook(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete book:', error);
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

    const loadBookCopies = async (bookId: string) => {
        try {
            const response = await bookCopiesAPI.getBookCopies(bookId);
            setBookCopies(prev => ({...prev, [bookId]: response.data}));
        } catch (error) {
            console.error('Failed to load book copies:', error);
        }
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

    const showCopyModal = (book: Book) => {
        setSelectedBookForCopy(book);
        copyForm.resetFields();
        setIsCopyModalVisible(true);
        if (!bookCopies[book.id]) {
            loadBookCopies(book.id);
        }
    };

    const handleCopyCancel = () => {
        setIsCopyModalVisible(false);
        setSelectedBookForCopy(null);
        copyForm.resetFields();
    };

    const showEditCopyModal = (copy: BookCopy) => {
        setEditingCopy(copy);
        copyForm.setFieldsValue({
            condition: copy.condition,
            notes: copy.notes
        });
        setIsEditCopyModalVisible(true);
    };

    const handleEditCopyCancel = () => {
        setIsEditCopyModalVisible(false);
        setEditingCopy(null);
        copyForm.resetFields();
    };

    const handleEditCopySubmit = async (values: { condition: BookCopy['condition'], notes?: string }) => {
        if (!editingCopy) return;

        try {
            await bookCopiesAPI.updateBookCopy(editingCopy.id, values);
            message.success('Book copy updated successfully');
            handleEditCopyCancel();
            loadBookCopies(editingCopy.book_id);
        } catch (error) {
            console.error('Failed to update book copy:', error);
            message.error('Failed to update book copy');
        }
    };

    const handleCopySubmit = async (values: { condition: BookCopy['condition'], notes?: string }) => {
        if (!selectedBookForCopy) return;

        try {
            await bookCopiesAPI.createBookCopy(selectedBookForCopy.id, values);
            message.success('Book copy created successfully');
            handleCopyCancel();
            loadBookCopies(selectedBookForCopy.id);
        } catch (error) {
            console.error('Failed to create book copy:', error);
            message.error('Failed to create book copy');
        }
    };

    const handleDeleteCopy = async (bookId: string, copyId: string) => {
        try {
            await bookCopiesAPI.deleteBookCopy(copyId);
            loadBookCopies(bookId);
        } catch (error) {
            console.error('Failed to delete book copy:', error);
        }
    };

    const handleImageError = (bookId: string) => {
        setImageErrors(prev => ({ ...prev, [bookId]: true }));
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
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status: BookCopy['status']) => (
                    <Tag color={
                        status === 'reserved' ? 'orange' :
                            status === 'available' ? 'green' :
                                status === 'borrowed' ? 'red' :
                                    'default'
                    }>
                        {status?.toUpperCase() || 'UNKNOWN'}
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
                            icon={<EditOutlined/>}
                            onClick={() => showEditCopyModal(record)}
                        >
                            Edit
                        </Button>
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

    const bookColumns = [
        {
            title: '',
            key: 'image',
            render: (record: Book) => (
                <img 
                    src={imageErrors[record.id] ? record.main_image : getBookImageUrl(record.id)}
                    alt={record.title}
                    onError={() => handleImageError(record.id)}
                    style={{ 
                        width: '100px',
                        objectFit: 'contain',
                    }}
                />
            ),
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => (
                <span style={{ fontWeight: 'bold' }}>
                    {text || 'N/A'}
                </span>
            ),
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
            title: 'ISBN-13',
            dataIndex: 'isbn13',
            key: 'isbn13',
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
            title: 'Format',
            dataIndex: 'format',
            key: 'format',
            render: (format: string) => (
                <Tag color={format === 'hardcover' ? 'blue' : 'green'}>
                    {format.charAt(0).toUpperCase() + format.slice(1)}
                </Tag>
            ),
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

    return (
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
                    <Input.Search
                        placeholder="Search by ISBN-13..."
                        allowClear
                        onSearch={(value) => {
                            setIsbn13(value);
                            setPagination(prev => ({...prev, current: 1}));
                        }}
                        style={{width: 300}}
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
                onRow={(row) => ({
                    style: { cursor: 'pointer' },
                    onClick: () =>  handleShowCopies(row.id),
                })}
                expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                }}
            />

            <BookForm
                visible={isBookModalVisible}
                onCancel={handleBookCancel}
                onSubmit={handleBookSubmit}
                initialValues={editingBook}
                authors={authors}
                categories={categories}
                loading={loading}
            />

            {/* Copy Modal */}
            <Modal
                title={`Add Copy - ${selectedBookForCopy?.title}`}
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

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Create Copy
                            </Button>
                            <Button onClick={handleCopyCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Copy Modal */}
            <Modal
                title={`Edit Copy - ${editingCopy?.book?.title}`}
                open={isEditCopyModalVisible}
                onCancel={handleEditCopyCancel}
                footer={null}
            >
                <Form
                    form={copyForm}
                    layout="vertical"
                    onFinish={handleEditCopySubmit}
                >
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

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Update Copy
                            </Button>
                            <Button onClick={handleEditCopyCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default BooksTab; 