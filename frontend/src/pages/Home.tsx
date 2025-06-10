import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, Col, Empty, Input, message, Pagination, Row, Select, Space, Spin, Typography} from 'antd';
import {authorsAPI, booksAPI, categoriesAPI} from '../api';
import {Author, Book, Category} from '../types';
import {getBookImageUrl} from '../utils';

const { Title, Text } = Typography;
const { Option } = Select;
const { Meta } = Card;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [isbn13SearchInput, setIsbn13SearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [isbn13, setIsbn13] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, searchQuery, selectedCategory, selectedAuthor, isbn13]);

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
      const [booksResponse, categoriesResponse, authorsResponse] = await Promise.all([
        booksAPI.getBooks(
          searchQuery,
          selectedCategory,
          selectedAuthor,
          isbn13,
          pagination.current,
          pagination.pageSize
        ),
        categoriesAPI.getCategories(),
        authorsAPI.getAuthors(),
      ]);
      setBooks(booksResponse.data.books);
      setPagination(prev => ({
        ...prev,
        total: booksResponse.data.total
      }));
      setCategories(categoriesResponse.data);
      setAuthors(authorsResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPagination(prev => ({...prev, current: 1}));
  };

  const handleAuthorChange = (value: string) => {
    setSelectedAuthor(value);
    setPagination(prev => ({...prev, current: 1}));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({...prev, current: page}));
  };

  const handleImageError = (bookId: string) => {
    setImageErrors(prev => ({ ...prev, [bookId]: true }));
  };

  if (loading) {
    return (
      <Space direction="vertical" align="center" style={{ width: '100%', marginTop: '100px' }}>
        <Spin size="large" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', minHeight: '85vh', position: 'relative' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Space>
            <img
              src="/pscit-icon-large.png"
              alt="PSciT Library"
              style={{ width: '50px', height: '50px' }}
            />
            <div>
              <Title level={3} style={{ margin: 0 }}>PSciT Library</Title>
              <Text type="secondary">A curated physical library in Hanoi</Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} md={16}>
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md={6}>
              <Input.Search
                placeholder="Search by title or subtitle..."
                size="large"
                allowClear
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={(value) => {
                  setSearchQuery(value);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Select Category"
                allowClear
                style={{ width: '100%' }}
                size="large"
                onChange={handleCategoryChange}
                value={selectedCategory || undefined}
                showSearch
                filterOption={(input, option) =>
                  String(option?.children).toLowerCase().includes(input.toLowerCase())
                }
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.name}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Select Author"
                allowClear
                style={{ width: '100%' }}
                size="large"
                onChange={handleAuthorChange}
                value={selectedAuthor || undefined}
                showSearch
                filterOption={(input, option) =>
                  String(option?.children).toLowerCase().includes(input.toLowerCase())
                }
              >
                {authors.map(author => (
                  <Option key={author.id} value={author.name}>
                    {author.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input.Search
                  placeholder="Search by ISBN-13..."
                  size="large"
                  allowClear
                  value={isbn13SearchInput}
                  onChange={(e) => setIsbn13SearchInput(e.target.value)}
                  onSearch={(value) => {
                    setIsbn13(value);
                    setPagination(prev => ({ ...prev, current: 1 }));
                  }}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {books.length === 0 ? (
        <Empty description="No books found" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {books.map((book) => (
              <Col xs={12} sm={8} md={6} lg={4} key={book.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={book.title}
                      src={imageErrors[book.id] ? book.main_image : getBookImageUrl(book.id)}
                      onError={() => handleImageError(book.id)}
                      style={{ height: '230px', objectFit: 'contain' }}
                    />
                  }
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <Meta
                    title={book.title}
                    description={
                      <Text ellipsis style={{ width: '100%' }}>
                        By {book.authors.map(a => a.name).join(', ')}
                      </Text>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row justify="center">
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </Row>
        </>
      )}
    </Space>
  );
};

export default Home; 