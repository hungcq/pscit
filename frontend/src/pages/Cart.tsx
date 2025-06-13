import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Grid,
  message,
  Modal,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography
} from 'antd';
import {DeleteOutlined, PlusOutlined, ShoppingCartOutlined} from '@ant-design/icons';
import {cartAPI} from '../api';
import dayjs, {Dayjs} from 'dayjs';
import {Book, CartItem} from '../types';
import {useCart} from '../contexts/CartContext';
import {getBookImageUrl} from "../utils";

const {Text} = Typography;
const MAX_SUGGESTED_TIMESLOTS = 5;
const {useBreakpoint} = Grid;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedPickupTimeslots, setSelectedPickupTimeslots] = useState<Dayjs[]>([]);
  const [selectedReturnTimeslots, setSelectedReturnTimeslots] = useState<Dayjs[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const {cartItems, reloadCart} = useCart();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleRemoveFromCart = async (bookCopyId: string) => {
    try {
      await cartAPI.removeFromCart(bookCopyId);
      message.success('Item removed from cart');
      await reloadCart();
    } catch (error: any) {
      message.error(error.message || 'Failed to remove item from cart');
    }
  };

  const handleClearCart = async () => {
    try {
      await cartAPI.clearCart();
      message.success('Cart cleared');
      await reloadCart();
    } catch (error: any) {
      message.error(error.message || 'Failed to clear cart');
    }
  };

  const handleAddPickupTimeslot = () => {
    if (!selectedDates) return;
    if (selectedPickupTimeslots.length >= MAX_SUGGESTED_TIMESLOTS) {
      message.warning(`You can only suggest up to ${MAX_SUGGESTED_TIMESLOTS} pickup times`);
      return;
    }
    const newTimeslot = selectedDates[0].hour(9).minute(0).second(0);
    setSelectedPickupTimeslots([...selectedPickupTimeslots, newTimeslot]);
  };

  const handleAddReturnTimeslot = () => {
    if (!selectedDates) return;
    if (selectedReturnTimeslots.length >= MAX_SUGGESTED_TIMESLOTS) {
      message.warning(`You can only suggest up to ${MAX_SUGGESTED_TIMESLOTS} return times`);
      return;
    }
    const newTimeslot = selectedDates[1].hour(17).minute(0).second(0);
    setSelectedReturnTimeslots([...selectedReturnTimeslots, newTimeslot]);
  };

  const handleRemovePickupTimeslot = (index: number) => {
    setSelectedPickupTimeslots(selectedPickupTimeslots.filter((_, i) => i !== index));
  };

  const handleRemoveReturnTimeslot = (index: number) => {
    setSelectedReturnTimeslots(selectedReturnTimeslots.filter((_, i) => i !== index));
  };

  const handleReserve = async () => {
    if (!selectedDates || selectedPickupTimeslots.length === 0 || selectedReturnTimeslots.length === 0) {
      message.error('Please select dates and at least one pickup and return time');
      return;
    }

    try {
      setSubmitting(true);
      await cartAPI.checkoutCart({
        startDate: selectedDates[0].toISOString(),
        endDate: selectedDates[1].toISOString(),
        suggestedPickupTimeslots: selectedPickupTimeslots.map(slot => slot.toISOString()),
        suggestedReturnTimeslots: selectedReturnTimeslots.map(slot => slot.toISOString()),
      });

      message.success('Reservation request submitted successfully');
      setCheckoutModalVisible(false);
      setSelectedDates(null);
      setSelectedPickupTimeslots([]);
      setSelectedReturnTimeslots([]);
      await reloadCart();
      navigate('/reservations');
    } catch (error: any) {
      message.error(error.message || 'Failed to submit reservation request');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Book',
      dataIndex: ['book_copy', 'book'],
      key: 'title',
      render: (book: Book) => (
        <div>
          <img
            src={getBookImageUrl(book)}
            alt={book.title}
            style={{
              width: '100px',
              objectFit: 'contain',
              marginRight: '1vw'
            }}
          />
          <Text strong>{book.title}</Text>
        </div>
      ),
    },
    {
      title: 'Format',
      dataIndex: ['book_copy', 'book', 'format'],
      key: 'title',
      render: (format: string) => (
        <Tag color={format === 'hardcover' ? 'blue' : 'green'}>
          {format.charAt(0).toUpperCase() + format.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Condition',
      dataIndex: ['book_copy', 'condition'],
      key: 'condition',
      render: (condition: string) => (

        <Tag color={
          condition === 'new' ? 'green' :
            condition === 'like_new' ? 'lime' :
              condition === 'good' ? 'blue' :
                condition === 'fair' ? 'orange' :
                  'red'
        }>
          {condition.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined/>}
          onClick={() => handleRemoveFromCart(record.book_copy.id)}
        >Remove</Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{width: '100%'}}>
      <Card title={"Reservation Cart"}
            extra={
              cartItems.length > 0 && (
                isMobile ? (
                  <Space direction="vertical" style={{width: 120}}>
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined/>}
                      onClick={() => setCheckoutModalVisible(true)}
                      block
                    >
                      Reserve
                    </Button>
                    <Button onClick={handleClearCart} block>
                      Clear Cart
                    </Button>
                  </Space>
                ) : (
                  <Space align="end">
                    <Button onClick={handleClearCart}>Clear Cart</Button>
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined/>}
                      onClick={() => setCheckoutModalVisible(true)}
                    >
                      Reserve
                    </Button>
                  </Space>
                )
              )
            }>
        <Space direction="vertical" size="large" style={{width: '100%'}}>
          {cartItems.length === 0 ? (
            <Empty
              description="Your cart is empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            isMobile ? (
              <Space direction="vertical" style={{width: '100%'}}>
                {cartItems.map((item) => (
                  <Card key={item.id} style={{marginBottom: '16px'}}>
                    <Space direction="vertical" align="center" style={{width: '100%'}}>
                      <img
                        src={getBookImageUrl(item.book_copy.book)}
                        alt={item.book_copy.book.title}
                        style={{width: '100px', objectFit: 'contain', marginRight: '1vw'}}
                      />
                      <Text strong>{item.book_copy.book.title}</Text>
                      <Tag color={item.book_copy.book.format === 'hardcover' ? 'blue' : 'green'}>
                        {item.book_copy.book.format.charAt(0).toUpperCase() + item.book_copy.book.format.slice(1)}
                      </Tag>
                      <Tag color={
                        item.book_copy.condition === 'new' ? 'green' :
                          item.book_copy.condition === 'like_new' ? 'lime' :
                            item.book_copy.condition === 'good' ? 'blue' :
                              item.book_copy.condition === 'fair' ? 'orange' :
                                'red'
                      }>
                        {item.book_copy.condition.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Tag>
                      <div style={{marginTop: 12}}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined/>}
                          onClick={() => handleRemoveFromCart(item.book_copy.id)}
                          block
                        >Remove</Button>
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Table
                columns={columns}
                dataSource={cartItems}
                rowKey={(record) => record.id}
                pagination={false}
              />
            )
          )}
        </Space>
      </Card>

      <Modal
        title="Checkout"
        open={checkoutModalVisible}
        onOk={handleReserve}
        onCancel={() => {
          setCheckoutModalVisible(false);
          setSelectedDates(null);
          setSelectedPickupTimeslots([]);
          setSelectedReturnTimeslots([]);
        }}
        okText="Submit Request"
        cancelText="Cancel"
        confirmLoading={submitting}
        width="95%"
        style={{maxWidth: '500px'}}
      >
        <Form layout="vertical">
          <Text>From - To:</Text>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <DatePicker
              placeholder="Start Date"
              onChange={(date) => {
                if (date && selectedDates?.[1]) {
                  setSelectedDates([date, selectedDates[1]]);
                } else if (date) {
                  setSelectedDates([date, date]);
                }
              }}
              value={selectedDates?.[0]}
              style={{width: '100%'}}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              format="DD-MM-YYYY"
            />
            <DatePicker
              placeholder="End Date"
              onChange={(date) => {
                if (date && selectedDates?.[0]) {
                  setSelectedDates([selectedDates[0], date]);
                }
              }}
              value={selectedDates?.[1]}
              style={{width: '100%'}}
              disabledDate={(current) => {
                if (!current) return false;
                const today = dayjs().startOf('day');
                const isBeforeToday = current.isBefore(today);
                const hasStartDate = !!selectedDates?.[0];
                const isBeforeStartDate = hasStartDate && current.isBefore(selectedDates[0]);
                return isBeforeToday || isBeforeStartDate;
              }}
              format="DD-MM-YYYY"
            />
          </div>

          {selectedDates && (
            <Form.Item
              style={{marginTop: '10px'}}
              label={`Suggested Pickup Times (on ${selectedDates?.[0]?.format('DD-MM-YYYY')})`}
              required
              validateStatus={selectedPickupTimeslots.length > 0 ? '' : 'error'}
              help={
                selectedPickupTimeslots.length > 0
                  ? `You can suggest up to ${MAX_SUGGESTED_TIMESLOTS} time slots (${selectedPickupTimeslots.length}/${MAX_SUGGESTED_TIMESLOTS})`
                  : 'Please add at least one pickup time'
              }
            >
              <Space direction="vertical" style={{width: '100%'}}>
                {selectedPickupTimeslots.map((slot, index) => (
                  <Space key={index} style={{width: '100%', justifyContent: 'space-between'}}>
                    <Space>
                      <TimePicker
                        value={slot}
                        onChange={(time) => {
                          const newTimeslots = [...selectedPickupTimeslots];
                          newTimeslots[index] = time || slot;
                          setSelectedPickupTimeslots(newTimeslots);
                        }}
                        format="HH:mm"
                        minuteStep={30}
                        needConfirm={false}
                        showNow={false}
                      />
                      - <TimePicker
                      value={slot.add(30, 'minute')}
                      disabled
                      format="HH:mm"
                      needConfirm={false}
                      showNow={false}
                    />
                    </Space>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined/>}
                      onClick={() => handleRemovePickupTimeslot(index)}
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={handleAddPickupTimeslot}
                  icon={<PlusOutlined/>}
                  disabled={!selectedDates || selectedPickupTimeslots.length >= MAX_SUGGESTED_TIMESLOTS}
                  style={{width: '100%'}}
                >
                  Add Pickup Time
                </Button>
              </Space>
            </Form.Item>
          )}

          {selectedDates && (
            <Form.Item
              label={`Suggested Return Times (on ${selectedDates?.[1]?.format('DD-MM-YYYY')})`}
              required
              validateStatus={selectedReturnTimeslots.length > 0 ? '' : 'error'}
              help={
                selectedReturnTimeslots.length > 0
                  ? `You can suggest up to ${MAX_SUGGESTED_TIMESLOTS} time slots (${selectedReturnTimeslots.length}/${MAX_SUGGESTED_TIMESLOTS})`
                  : 'Please add at least one return time'
              }
            >
              <Space direction="vertical" style={{width: '100%'}}>
                {selectedReturnTimeslots.map((slot, index) => (
                  <Space key={index} style={{width: '100%', justifyContent: 'space-between'}}>
                    <Space>
                      <TimePicker
                        value={slot}
                        onChange={(time) => {
                          const newTimeslots = [...selectedReturnTimeslots];
                          newTimeslots[index] = time || slot;
                          setSelectedReturnTimeslots(newTimeslots);
                        }}
                        format="HH:mm"
                        minuteStep={30}
                        needConfirm={false}
                        showNow={false}
                      />
                      - <TimePicker
                      value={slot.add(30, 'minute')}
                      disabled
                      format="HH:mm"
                      needConfirm={false}
                      showNow={false}
                    />
                    </Space>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined/>}
                      onClick={() => handleRemoveReturnTimeslot(index)}
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={handleAddReturnTimeslot}
                  icon={<PlusOutlined/>}
                  disabled={!selectedDates || selectedReturnTimeslots.length >= MAX_SUGGESTED_TIMESLOTS}
                  style={{width: '100%'}}
                >
                  Add Return Time
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  );
};

export default Cart; 