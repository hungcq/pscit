import React from 'react';
import {Layout, Typography} from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const Footer: React.FC = () => {
    return (
        <AntFooter style={{ textAlign: 'center', padding: 0}}>
            <Text type="secondary">© Hung Chu - PSciT Library</Text>
        </AntFooter>
    );
};

export default Footer; 