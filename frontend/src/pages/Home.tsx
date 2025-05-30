import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, Col, Input, message, Pagination, Row, Select, Spin, Typography} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {booksAPI, categoriesAPI, authorsAPI} from '../services/api';
import {Book, Category, Author} from '../types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Title level={2}>Library Catalog</Title>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search books..."
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
            >
              {authors.map(author => (
                <Option key={author.id} value={author.name}>
                  {author.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {books.map((book) => (
              <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={book.title}
                      src={book.main_image}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  }
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <Card.Meta
                    title={book.title}
                    description={
                      <>
                        <Text type="secondary">
                          {book.authors.map(a => a.name).join(', ')}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {book.categories.map(c => c.name).join(', ')}
                        </Text>
                      </>
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
    </div>
  );
};

export default Home; 