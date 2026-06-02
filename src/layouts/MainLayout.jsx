import React, { useState, useEffect } from 'react';
import { Layout, ConfigProvider, App } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';

const { Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(true);

  // Auto collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <App>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar collapsed={collapsed} />
          <Layout
            style={{
              marginLeft: collapsed ? 80 : 250,
              transition: 'margin-left 0.2s',
              background: '#f0f2f5'
            }}
          >
            <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Content
              style={{
                margin: '16px',
                padding: '16px',
                minHeight: 280,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden', // Ngăn content tràn ra ngoài
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Outlet />
            </Content>
            <FooterBar />
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
};

export default MainLayout;
