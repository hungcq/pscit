import React from 'react';
import {Layout, Typography} from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const Footer: React.FC = () => {
    return (
        <AntFooter style={{ textAlign: 'center', paddingTop: '0px', paddingBottom: '10px', marginTop: '-17px', marginBottom: '0px'}}>
            <Text type="secondary">© Hung Chu - PSciT Library</Text>
        </AntFooter>
    );
};

export default Footer; 