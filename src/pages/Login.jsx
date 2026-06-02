import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, Space, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { systemName } from '../utils/constants';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Lưu vào AuthContext (và localStorage bên trong context)
        login(user, token);
        
        message.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-wrapper">
            <img src="/icon-App-Computer.ico" alt={`${systemName} Logo`} className="logo-img" />
          </div>
          <Title level={1} className="system-title">{systemName}</Title>
          <Text className="system-subtitle">Hệ thống thông tin Thiếu nhi và Giáo lý viên</Text>
        </div>

        {/* Login Form */}
        <Card className="login-card" bordered={false}>
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              label={<Space><UserOutlined className="form-icon" /> Tên đăng nhập</Space>}
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input placeholder="Nhập tên đăng nhập" />
            </Form.Item>

            <Form.Item
              label={<Space><LockOutlined className="form-icon" /> Mật khẩu</Space>}
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="login-button" 
                icon={<LoginOutlined />}
                loading={loading}
              >
                Đăng Nhập
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-container {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .login-content {
          width: 100%;
          max-width: 400px;
          padding: 0 16px;
        }
        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo-wrapper {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .logo-img {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
        }
        .system-title {
          margin: 0 !important;
          color: #1f2937 !important;
          font-weight: 700 !important;
          font-size: 30px !important;
        }
        .system-subtitle {
          display: block;
          color: #4b5563;
          font-size: 16px;
          margin-top: 8px;
        }
        .login-card {
          border-radius: 16px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
          backdrop-filter: blur(4px);
          background: rgba(255, 255, 255, 0.9) !important;
        }
        .form-icon {
          color: #9ca3af;
          margin-right: 8px;
        }
        .login-button {
          width: 100%;
          height: 48px !important;
          border-radius: 8px !important;
          background-color: #2563eb !important;
          border-color: #2563eb !important;
          font-weight: 500 !important;
          font-size: 16px !important;
          margin-top: 8px;
        }
        .login-button:hover {
          background-color: #1d4ed8 !important;
          border-color: #1d4ed8 !important;
        }
        .ant-form-item-label > label {
          font-size: 14px !important;
          color: #374151 !important;
          font-weight: 500 !important;
        }
        .ant-input, .ant-input-password {
          border-radius: 8px !important;
          padding: 10px 16px !important;
        }
        .ant-form-item {
          margin-bottom: 20px !important;
        }
      `}} />
    </div>
  );
};

export default Login;
