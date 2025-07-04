import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Card, Col, Empty, Input, message, Pagination, Row, Select, Space, Spin, Tabs, Typography} from 'antd';
import {authorsAPI, booksAPI, categoriesAPI, tagsAPI} from '../api';
import {Author, Book, Category, Tag} from '../types';
import {getBookImageUrl} from '../utils';
import useBreakpoint from "antd/es/grid/hooks/useBreakpoint";
import WelcomeModal from '../components/WelcomeModal';

const {Text, Title} = Typography;
const {Option} = Select;
const {Meta} = Card;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: Number(searchParams.get('page')) || 1,
    pageSize: 12,
    total: 0,
  });
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedAuthor, setSelectedAuthor] = useState<string>(searchParams.get('author') || '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(searchParams.get('lang') || '');
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagKey, setSelectedTagKey] = useState<string>(searchParams.get('tag') || '');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [availableFilter, setAvailableFilter] = useState<string>(searchParams.get('available') || '');

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    // Update URL when filters or page change
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedAuthor) params.author = selectedAuthor;
    if (selectedLanguage) params.lang = selectedLanguage;
    if (selectedTagKey) params.tag = selectedTagKey;
    if (availableFilter) params.available = availableFilter;
    if (pagination.current > 1) params.page = pagination.current;
    setSearchParams(params, {replace: true});
    loadData();
  }, [pagination.current, searchQuery, selectedCategory, selectedAuthor, selectedLanguage, selectedTagKey, availableFilter]);

  useEffect(() => {
    const hasSeenWelcomeModal = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcomeModal) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasSeenWelcomeModal', 'true');
    }
  }, []);

  useEffect(() => {
    // Fetch tags on mount
    tagsAPI.getTags().then(res => setTags(res.data.sort((a, b) => {
      if (a.key === 'featured') return -1;
      if (b.key === 'featured') return 1;
      return 0;
    }))).catch(() => setTags([]));
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksResponse, categoriesResponse, authorsResponse] = await Promise.all([
        booksAPI.getBooks(
          searchQuery,
          selectedCategory,
          selectedAuthor,
          selectedLanguage,
          selectedTagKey,
          availableFilter === 'true' ? true : availableFilter === 'false' ? false : undefined,
          pagination.current,
          pagination.pageSize,
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

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setPagination(prev => ({...prev, current: 1}));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({...prev, current: page}));
  };

  const handleImageError = (bookId: string) => {
    setImageErrors(prev => ({...prev, [bookId]: true}));
  };

  const handleTagChange = (key: string) => {
    setSelectedTagKey(key);
    setPagination(prev => ({...prev, current: 1}));
  };

  const handleAvailabilityFilter = (value: string) => {
    setAvailableFilter(value);
    setPagination(prev => ({...prev, current: 1}));
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  if (loading) {
    return (
      <Space direction="vertical" align="center" style={{width: '100%', marginTop: '100px'}}>
        <Spin size="large"/>
      </Space>
    );
  }

  return (
    <>
      <Space direction="vertical" size="small" style={{width: '100%', minHeight: '84.5vh'}}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Space>
              <img
                src="/pscit-icon-large.png"
                alt="PSciT Library"
                style={{width: '60px', height: '60px'}}
              />
              <div>
                <Title level={2} style={{margin: 0}}>PSciT Library</Title>
                <Text type="secondary">A curated private library in Hanoi</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={18}>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12} md={7}>
                <Input.Search
                  placeholder="Search by title or subtitle or ISBN..."
                  allowClear
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={(value) => {
                    setSearchQuery(value);
                    setPagination(prev => ({...prev, current: 1}));
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={7}>
                <Select
                  placeholder="Select Category"
                  allowClear
                  style={{width: '100%'}}
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
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Select Author"
                  allowClear
                  style={{width: '100%'}}
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
              <Col xs={24} sm={12} md={3}>
                <Select
                  placeholder="Select Language"
                  allowClear
                  style={{width: '100%'}}
                  onChange={handleLanguageChange}
                  value={selectedLanguage || undefined}
                >
                  <Option value="en">English</Option>
                  <Option value="vi">Vietnamese</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Select
                  placeholder="Availability"
                  allowClear
                  style={{width: '100%'}}
                  onChange={handleAvailabilityFilter}
                  value={availableFilter || undefined}
                >
                  <Option value="true">Available</Option>
                  <Option value="false">All</Option>
                </Select>
              </Col>
            </Row>
            <Row>
              <Tabs
                activeKey={selectedTagKey || 'all'}
                onChange={key => handleTagChange(key === 'all' ? '' : key)}
                style={{width: '100%'}}
              >
                <Tabs.TabPane tab="# all" key="all"/>
                {tags.map(tag => (
                  <Tabs.TabPane tab={tag.name} key={tag.key}/>
                ))}
              </Tabs>
            </Row>
          </Col>
        </Row>

        {books.length === 0 ? (
          <Empty description="No books found"/>
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
                        src={imageErrors[book.id] ? book.main_image : getBookImageUrl(book)}
                        onError={() => handleImageError(book.id)}
                        style={{ width: '100%', maxHeight: '230px', objectFit: 'contain' }}
                      />
                    }
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    <Meta
                      title={
                        <Text
                          strong
                          style={isMobile ? {
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            display: 'block',
                          } : {}}
                        >
                          {book.title}
                        </Text>
                      }
                      description={
                        !isMobile && (
                          <Text ellipsis style={{ width: '100%' }}>
                            By {book.authors.map(a => a.name).join(', ')}
                          </Text>
                        )
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Space>

      <Row justify="center">
        <Pagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={handlePageChange}
          showSizeChanger={false}
        />
      </Row>

      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </>
  );
};

export default Home;