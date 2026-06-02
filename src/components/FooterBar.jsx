import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const FooterBar = () => {
  return (
    <Footer style={{ textAlign: 'center', color: '#8c8c8c' }}>
      Hệ thống Quản lý Thiếu nhi Thánh thể ©{new Date().getFullYear()}
    </Footer>
  );
};

export default FooterBar;
