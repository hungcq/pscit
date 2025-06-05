import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, Col, Empty, Input, message, Pagination, Row, Select, Space, Spin, Typography} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {authorsAPI, booksAPI, categoriesAPI} from '../services/api';
import {Author, Book, Category} from '../types';
import {getBookImageUrl} from '../utils/imageUtils';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Meta } = Card;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  const loadData = async () => {
    try {
      const [categoriesResponse, authorsResponse] = await Promise.all([
        categoriesAPI.getCategories(),
        authorsAPI.getAuthors(),
      ]);
      setCategories(categoriesResponse.data);
      setAuthors(authorsResponse.data);
    } catch (error) {
      console.error('Failed to load filters:', error);
      message.error('Failed to load filters');
    }
  };

  const loadBooks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks(
        searchQuery,
        selectedCategory,
        selectedAuthor,
        page
      );
      setBooks(response.data.books);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load books:', error);
      message.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadBooks(currentPage);
  }, [currentPage, searchQuery, selectedCategory, selectedAuthor]);

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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleAuthorChange = (value: string) => {
    setSelectedAuthor(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleImageError = (bookId: string) => {
    setImageErrors(prev => ({ ...prev, [bookId]: true }));
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Space direction="vertical" align="center" style={{ width: '100%', marginTop: '100px' }}>
        <Spin size="large" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: '24px' }}>
      <Title level={2}>Library Catalog</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search by title or subtitle..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
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
          <Col xs={24} sm={12} md={8}>
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
        </Row>

      {filteredBooks.length === 0 ? (
        <Empty description="No books found" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {filteredBooks.map((book) => (
              <Col xs={12} sm={8} md={6} lg={4} key={book.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={book.title}
                      src={imageErrors[book.id] ? book.main_image : getBookImageUrl(book.id)}
                      onError={() => handleImageError(book.id)}
                      style={{ height: '300px', objectFit: 'contain' }}
                    />
                  }
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <Meta
                    title={book.title}
                    description={
                      <Space direction="vertical">
                        <Text>By {book.authors.map(a => a.name).join(', ')}</Text>
                        <Text type="secondary">{book.published_year}</Text>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Pagination
              current={currentPage}
              total={total}
              pageSize={12}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </Space>
  );
};

export default Home; 