import React from 'react';
import {Col, Divider, Row, Space, Typography} from 'antd';
import {
    GithubOutlined,
    GlobalOutlined,
    LinkedinOutlined,
    MailOutlined,
    PhoneOutlined,
    WhatsAppOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Introduction: React.FC = () => {
    const socialLinks = [
        { icon: <GithubOutlined />, href: 'https://github.com/hungcq', label: 'GitHub' },
        { icon: <LinkedinOutlined />, href: 'https://linkedin.com/in/hungcq', label: 'LinkedIn' },
        { icon: <WhatsAppOutlined />, href: 'https://wa.me/qr/4EEYREOFSGMVN1', label: 'WhatsApp' },
        { icon: <MailOutlined />, href: 'mailto:hungcqrt@gmail.com', label: 'Email' },
        { icon: <PhoneOutlined />, href: 'tel:+84987134200', label: 'Phone' },
        { icon: <GlobalOutlined />, href: 'https://portfolio.hungcq.xyz', label: 'Portfolio' }
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Cover Image Section */}
            <Row justify="center">
                <Col xs={24} md={16} lg={12}>
                            <img
                                alt="Library Cover"
                                src="/cover.jpg"
                                style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }}
                            />
                </Col>
            </Row>

            {/* Content Section */}
            <Row justify="center">
                <Col xs={24} md={16} lg={12}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Title level={2}>About the Owner and the Library</Title>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                Hi there, I'm Hung Chu. I see myself as a skeptic - someone who questions accepted beliefs
                                and seeks understanding through logical reasoning and empirical evidence.
                            </Paragraph>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                I believe knowledge is essential to both personal fulfillment and the progress of humanity.
                                For me, books are among the most reliable and structured paths to knowledge.
                                As a dedicated reader who has struggled to find truly valuable books,
                                I understand how rare and precious good ones are.
                                That's why I created the <b>PSciT Library - a curated physical library located in Hanoi, Vietnam</b>,
                                filled with books I've personally selected and mostly read.
                            </Paragraph>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                <b>PSciT</b> stands for <b>Philosophy, Science, and Technology, </b>
                                which are the core themes of the collection.
                                You'll also find key works in fiction, history, sociology, and practical subjects.
                                Most titles are in English and Vietnamese - the two languages I'm fluent in - but I plan
                                to expand the collection as I learn new languages.
                            </Paragraph>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                Feel free to browse the library, reserve a book, or just reach out for a chat over coffee.
                                <b>Reserved books can be picked up at my place in <a href='https://maps.app.goo.gl/yEbHKpyqVknWia6L8'>
                                    No 57, 38 alley, 189 lane, Hoi Phu hamlet, Dong Hoi commune,
                                    Dong Anh district, Hanoi, Vietnam.</a></b>
                            </Paragraph>
                            <Space wrap>
                                {socialLinks.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'white' }}
                                    >
                                        {React.cloneElement(link.icon, {
                                            style: { fontSize: '18px', margin: '0 8px' }
                                        })}
                                    </a>
                                ))}
                            </Space>
                        </div>
                    </Space>
                <Divider />

                {/* About the Website Column */}
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Title level={2}>About the Website</Title>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                This website lets you explore the library, manage books/authors/categories,
                                request or approve reservations, and receive email notifications.
                                I built the core features in just one week,
                                using <b>Cursor</b> to boost development speed.
                            </Paragraph>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                Although hosted on a single <b>Vultr</b> instance for cost-efficiency,
                                this is a production-grade system. It includes <b>automated builds and deployments,
                                strong security, flexible configuration, and observability</b>.
                                The backend is powered by <b>Golang, PostgreSQL, Docker, Kubernetes, GitHub Actions, and HAProxy</b>,
                                observed using <b>Prometheus, Grafana, ElasticSearch, and Kibana</b>.
                                The frontend is built with <b>React.js, hosted on AWS S3, and served via AWS CloudFront. </b>
                                I manage the domain using <b>AWS Route 53 and Certificate Manager</b>.
                            </Paragraph>
                            <Paragraph style={{ fontSize: '13pt' }}>
                                You can find the source code here:{' '}
                                <a href="https://github.com/hungcq/pscit" target="_blank" rel="noopener noreferrer">
                                    <b>GitHub Repository</b>
                                </a>
                            </Paragraph>
                        </div>
                    </Space>
                </Col>
            </Row>
        </Space>
    );
};

export default Introduction; 