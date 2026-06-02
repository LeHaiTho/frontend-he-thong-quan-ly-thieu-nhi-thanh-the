import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Tooltip,
  Tabs,
  Tag,
  Form,
  Popconfirm,
  message,
  Spin
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  CheckOutlined,
  CloseOutlined,
  SaveOutlined 
} from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

const System = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, blocksRes, rolesRes, teachersRes] = await Promise.all([
        api.get('/users'),
        api.get('/blocks'),
        api.get('/roles'),
        api.get('/teachers'),
      ]);

      if (usersRes.data.success) {
        const mappedUsers = usersRes.data.data.map((user, index) => ({
          key: user.id,
          index: index + 1,
          name: user.name,
          username: user.username,
          phone: user.phone,
          email: user.email,
          role: user.role_name,
          roleId: user.role_id,
          roleCode: user.role_code,
          subRole: user.block_name,
          subRoleBlockId: user.sub_role_block_id,
          teacherId: user.teacher_id,
          teacherName: user.teacher_name,
          teacherCode: user.teacher_code,
          status: user.status,
          isEditing: false,
        }));
        setUsers(mappedUsers);
      }

      if (blocksRes.data.success) {
        setBlocks(blocksRes.data.data);
      }

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data);
      }

      if (teachersRes.data.success) {
        setTeachers(teachersRes.data.data);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      message.error('Không thể tải dữ liệu hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleEdit = (key) => {
    setUsers(users.map(user => 
      user.key === key ? { ...user, isEditing: !user.isEditing } : user
    ));
  };

  const handleInputChange = (key, field, value) => {
    setUsers(users.map(user => 
      user.key === key ? { ...user, [field]: value } : user
    ));
  };

  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    const defaultRole = roles[0] || {};
    const newUser = {
      key: 'new-' + Date.now(),
      index: 1,
      name: '',
      username: '',
      phone: '',
      email: '',
      password: '',
      role: defaultRole.name || '',
      roleId: defaultRole.id || '',
      roleCode: defaultRole.code || '',
      status: 'active',
      isEditing: true,
      isNew: true,
    };
    setUsers([newUser, ...users.map(u => ({ ...u, index: u.index + 1 }))]);
  };

  const handleCancelAdd = (key) => {
    setUsers(users.filter(user => user.key !== key).map((u, i) => ({ ...u, index: i + 1 })));
    setIsAdding(false);
  };

  const handleRoleChange = (key, roleId) => {
    const selectedRole = roles.find(r => r.id === roleId);
    setUsers(users.map(user => 
      user.key === key ? { 
        ...user, 
        roleId: roleId, 
        role: selectedRole?.name,
        roleCode: selectedRole?.code,
        subRoleBlockId: selectedRole?.code === 'BRANCH_SECRETARY' ? user.subRoleBlockId : null,
        teacherId: selectedRole?.code === 'LECTURER' ? user.teacherId : null,
        teacherName: selectedRole?.code === 'LECTURER' ? user.teacherName : null,
        teacherCode: selectedRole?.code === 'LECTURER' ? user.teacherCode : null,
      } : user
    ));
  };

  const handleTeacherChange = (key, teacherId) => {
    const selected = teachers.find((t) => t.id === teacherId);
    const label = selected
      ? [selected.saint_name, selected.first_name, selected.last_name].filter(Boolean).join(' ')
      : '';
    setUsers(users.map((user) =>
      user.key === key
        ? {
            ...user,
            teacherId,
            teacherName: label,
            teacherCode: selected?.code,
          }
        : user
    ));
  };

  const teacherOptionLabel = (t) => {
    const name = [t.saint_name, t.first_name, t.last_name].filter(Boolean).join(' ');
    return `${t.code}${name ? ` — ${name}` : ''}`;
  };

  const teachersAvailableFor = (record) => {
    const linkedElsewhere = (teacherId) =>
      users.some((u) => u.teacherId === teacherId && u.key !== record.key);
    return teachers.filter(
      (t) => t.id === record.teacherId || !linkedElsewhere(t.id)
    );
  };

  const handleBlockChange = (key, blockId) => {
    const selectedBlock = blocks.find(b => b.id === blockId);
    setUsers(users.map(user => 
      user.key === key ? { 
        ...user, 
        subRoleBlockId: blockId,
        subRole: selectedBlock?.name
      } : user
    ));
  };

  const handleSave = async (record) => {
    if (!record.name || !record.username || !record.roleId) {
      message.warning('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Username, Vai trò)');
      return;
    }
    if (record.roleCode === 'LECTURER' && !record.teacherId) {
      message.warning('Vai lòng chọn Giáo lý viên liên kết với tài khoản');
      return;
    }
    if (record.roleCode === 'BRANCH_SECRETARY' && !record.subRoleBlockId) {
      message.warning('Vui lòng chọn Khối/ngành cho Quản lý ngành');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: record.name,
        username: record.username,
        phone: record.phone,
        email: record.email,
        role_id: record.roleId,
        sub_role_block_id: record.roleCode === 'BRANCH_SECRETARY' ? record.subRoleBlockId : null,
        teacher_id: record.roleCode === 'LECTURER' ? record.teacherId : null,
        status: record.status,
        password: record.password // Có thể để trống nếu là edit
      };

      if (record.isNew) {
        await api.post('/users', payload);
        message.success('Thêm người dùng thành công');
        setIsAdding(false);
      } else {
        await api.put(`/users/${record.key}`, payload);
        message.success('Cập nhật người dùng thành công');
      }
      fetchData(); // Tải lại danh sách
    } catch (error) {
      console.error('Save user error:', error);
      message.error(error.response?.data?.message || 'Lỗi khi lưu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/users/${id}`);
      message.success('Đã xóa người dùng');
      fetchData();
    } catch (error) {
      console.error('Delete user error:', error);
      message.error(error.response?.data?.message || 'Lỗi khi xóa người dùng');
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      align: 'center',
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        record.isEditing ? (
          <Input 
            value={text} 
            size="small" 
            placeholder="Tên người dùng"
            onChange={(e) => handleInputChange(record.key, 'name', e.target.value)}
          />
        ) : (
          <Text strong>{text}</Text>
        )
      ),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        record.isEditing ? (
          <Input 
            value={text} 
            size="small" 
            placeholder="Tên đăng nhập"
            onChange={(e) => handleInputChange(record.key, 'username', e.target.value)}
          />
        ) : (
          text
        )
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text, record) => (
        record.isEditing ? (
          <Input 
            value={text} 
            size="small" 
            placeholder="Số điện thoại"
            onChange={(e) => handleInputChange(record.key, 'phone', e.target.value)}
          />
        ) : (
          text || '-'
        )
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'roleId',
      key: 'role',
      render: (roleId, record) => (
        record.isEditing ? (
          <div style={{ minWidth: 200 }}>
            <Select 
              value={roleId} 
              size="small" 
              style={{ width: '100%' }}
              onChange={(value) => handleRoleChange(record.key, value)}
            >
              {roles.map(r => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
            {record.roleCode === 'BRANCH_SECRETARY' && (
              <div style={{ marginTop: 8, padding: 8, border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fff' }}>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: 4 }}>Khối/ngành (vai trò Quản lý ngành)</Text>
                <Select
                  value={record.subRoleBlockId}
                  size="small"
                  style={{ width: '100%' }}
                  placeholder="Chọn Khối/ ngành"
                  onChange={(value) => handleBlockChange(record.key, value)}
                >
                  {blocks.map(b => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </div>
            )}
            {record.roleCode === 'LECTURER' && (
              <div style={{ marginTop: 8, padding: 8, border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fff' }}>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: 4 }}>
                  Giáo lý viên liên kết (bắt buộc)
                </Text>
                <Select
                  value={record.teacherId}
                  size="small"
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn hồ sơ GLV"
                  onChange={(value) => handleTeacherChange(record.key, value)}
                  options={teachersAvailableFor(record).map((t) => ({
                    value: t.id,
                    label: teacherOptionLabel(t),
                  }))}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div>{record.role}</div>
            {record.subRole && (
              <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: 4 }}>
                Khối/ ngành được phân quyền:
                <div style={{ marginTop: 2 }}>
                  <Tag color="blue" style={{ fontSize: '10px' }}>{record.subRole}</Tag>
                </div>
              </div>
            )}
            {record.roleCode === 'LECTURER' && record.teacherId && (
              <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: 4 }}>
                GLV liên kết:
                <div style={{ marginTop: 2 }}>
                  <Tag color="purple" style={{ fontSize: '10px' }}>
                    {record.teacherCode}
                    {record.teacherName ? ` — ${record.teacherName}` : ''}
                  </Tag>
                </div>
              </div>
            )}
          </div>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        record.isEditing ? (
          <Select 
            value={status} 
            size="small" 
            style={{ width: '100%' }}
            onChange={(value) => handleInputChange(record.key, 'status', value)}
          >
            <Option value="active">Đang sử dụng</Option>
            <Option value="inactive">Khoá tài khoản</Option>
          </Select>
        ) : (
          <Tag color={status === 'active' ? 'success' : 'error'} style={{ borderRadius: 12 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: status === 'active' ? '#52c41a' : '#ff4d4f', marginRight: 6 }}></span>
            {status === 'active' ? 'Đang sử dụng' : 'Khoá'}
          </Tag>
        )
      ),
    },
    {
      title: 'Mật khẩu',
      dataIndex: 'password',
      key: 'password',
      render: (text, record) => (
        record.isEditing ? (
          <Input.Password 
            value={text}
            placeholder={record.isNew ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không đổi)"} 
            size="small" 
            onChange={(e) => handleInputChange(record.key, 'password', e.target.value)}
          />
        ) : (
          <Space style={{ color: '#bfbfbf' }}>
            <LockOutlined />
            <span>********</span>
          </Space>
        )
      ),
    },
    {
      title: 'Nút lệnh',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          {record.isEditing ? (
            <>
              <Tooltip title="Lưu">
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<CheckOutlined />} 
                  style={{ backgroundColor: '#52c41a' }}
                  onClick={() => handleSave(record)}
                />
              </Tooltip>
              <Tooltip title="Hủy">
                <Button 
                  size="small" 
                  icon={<CloseOutlined />} 
                  onClick={() => {
                    if (record.isNew) {
                      handleCancelAdd(record.key);
                    } else {
                      toggleEdit(record.key);
                    }
                  }}
                />
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Sửa">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                  onClick={() => toggleEdit(record.key)}
                />
              </Tooltip>
              <Popconfirm 
                title="Bạn có chắc chắn muốn xóa người dùng này?"
                onConfirm={() => handleDelete(record.key)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Tooltip title="Xóa">
                  <Button 
                    type="text" 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />} 
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleRefresh = () => {
    if (activeTab === 'user') {
      fetchData();
    }
    // Future tabs can be handled here
  };

  return (
    <div className="system-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SettingOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          Cài đặt Hệ Thống
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={isAdding} />
          <Button 
            icon={<SyncOutlined />} 
            style={{ backgroundColor: '#1890ff', color: '#fff' }} 
            onClick={handleRefresh}
            loading={loading}
          />
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={[
          { 
            key: 'user', 
            label: <span><UserOutlined /> Người dùng</span>,
            children: (
              <Card bodyStyle={{ padding: 0 }}>
                <Table
                  columns={userColumns}
                  dataSource={users}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  bordered
                  loading={loading}
                />
              </Card>
            )
          },
          // { 
          //   key: 'system', 
          //   label: <span><SettingOutlined /> Hệ thống</span>,
          //   children: (
          //     <Card>
          //       <Form layout="vertical" style={{ maxWidth: 600 }}>
          //         <Form.Item label="Tên hệ thống" initialValue="HỆ THỐNG THÔNG TIN THIẾU NHI & GIÁO LÝ VIÊN">
          //           <Input />
          //         </Form.Item>
          //         <Form.Item label="Tên giáo xứ" initialValue="Nhã Lộng">
          //           <Input />
          //         </Form.Item>
          //         <Form.Item label="Email thông báo">
          //           <Input placeholder="admin@example.com" />
          //         </Form.Item>
          //         <Form.Item>
          //           <Button type="primary" icon={<SaveOutlined />} style={{ backgroundColor: '#52c41a' }}>Lưu cài đặt</Button>
          //         </Form.Item>
          //       </Form>
          //     </Card>
          //   )
          // },
        ]} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .system-page .ant-table-thead > tr > th {
          background-color: #f0f2f5;
          font-weight: 600;
        }
        .system-page .ant-tabs-nav {
          margin-bottom: 16px;
        }
      `}} />
    </div>
  );
};

export default System;
