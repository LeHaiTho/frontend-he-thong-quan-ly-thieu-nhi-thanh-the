import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, message, Card } from 'antd';
import { SearchOutlined, UserAddOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Ngành quản lý',
      dataIndex: 'block_name',
      key: 'block_name',
      render: (block) => block ? <Tag color="cyan">{block}</Tag> : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'active' ? 'green' : 'volcano';
        return (
          <Tag color={color}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Lần đăng nhập cuối',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : 'Chưa đăng nhập',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link">Sửa</Button>
          <Button type="link" danger>Xóa</Button>
        </Space>
      ),
    },
  ];

  const filteredData = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card bordered={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Quản lý người dùng</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>Làm mới</Button>
          <Button type="primary" icon={<UserAddOutlined />}>
            Thêm người dùng
          </Button>
        </Space>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <Input 
          placeholder="Tìm kiếm theo tên hoặc username..." 
          prefix={<SearchOutlined />} 
          style={{ width: 300 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredData} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default Users;
