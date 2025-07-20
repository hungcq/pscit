import React from 'react';
import {Card, Modal, Steps, Typography} from 'antd';
import {
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  FormOutlined,
  InboxOutlined,
  NotificationOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';

const {Paragraph} = Typography;

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={<Paragraph style={{ fontSize: '14pt', fontWeight: 600 }}>
        📚 Welcome to PSciT Library!
      </Paragraph>}
      width={600}
    >
      <Paragraph style={{ marginBottom: 24, fontSize: '12pt' }}>
        A curated private collection in Hanoi focused on Philosophy, Science, and Technology.
        <a href="/about" target="_blank" rel="noopener noreferrer"> Read more about it here</a>.
      </Paragraph>

      <Card
        title={<span style={{ whiteSpace: 'normal' }}>✨ Getting Started: How to Reserve Books</span>}
        bordered={false}
      >
        <Steps
          direction="vertical"
          current={-1}
          items={[
            { title: 'Add Books to Cart (up to 5)', icon: <ShoppingCartOutlined />, status: 'finish' },
            { title: 'Select Pickup & Return Dates', icon: <CalendarOutlined />, status: 'finish' },
            { title: 'Suggest Pickup & Return Timeslots (up to 5)', icon: <ClockCircleOutlined />, status: 'finish' },
            { title: 'Submit Reservation', icon: <FormOutlined />, status: 'finish' },
            { title: 'Admin Confirms or Rejects', icon: <NotificationOutlined />, status: 'finish' },
            { title: 'Pick Up Books at The Agreed Pickup Time', icon: <InboxOutlined />, status: 'finish' },
            { title: 'Return Book at The Agreed Return Time', icon: <CheckSquareOutlined />, status: 'finish' },
          ]}
        />
      </Card>
    </Modal>
  );
};

export default WelcomeModal; 