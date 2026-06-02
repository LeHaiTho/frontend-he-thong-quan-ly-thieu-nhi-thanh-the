import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Form,
  DatePicker,
  Avatar,
  Divider,
  Tooltip,
  Typography,
  QRCode,
  Switch,
  Popconfirm,
  Upload,
  App,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  HomeOutlined,
  UserOutlined,
  CameraOutlined,
  UploadOutlined,
  CloseOutlined,
  SaveOutlined,
  UndoOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  BookOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  ReadOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { resolveMediaUrl, toStoredMediaPath } from '../utils/mediaUrl';


const { Title, Text } = Typography;
const { Option } = Select;

const Teachers = () => {
  const { message } = App.useApp();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchParishes();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teachers');
      if (response.data.success) {
        setTeachers(response.data.data.map((t, index) => ({ ...t, key: t.id, stt: index + 1 })));
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách giáo lý viên');
    } finally {
      setLoading(false);
    }
  };

  const fetchParishes = async () => {
    try {
      const response = await api.get('/parishes');
      if (response.data.success) {
        setParishes(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách giáo họ:', error);
    }
  };

  const handleRowClick = (record) => {
    setSelectedTeacher(record);
    form.setFieldsValue({
      ...record,
      avatar_url: toStoredMediaPath(record.avatar_url) ?? record.avatar_url,
      dob: record.dob ? dayjs(record.dob) : null,
      baptism_date: record.baptism_date ? dayjs(record.baptism_date) : null,
      first_communion_date: record.first_communion_date ? dayjs(record.first_communion_date) : null,
      confirmation_date: record.confirmation_date ? dayjs(record.confirmation_date) : null,
      vow_date: record.vow_date ? dayjs(record.vow_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
  };

  const handleAdd = () => {
    setSelectedTeacher({ isNew: true });
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      allow_attendance: true,
      code: undefined,
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Format dates for MySQL
      const formattedValues = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        baptism_date: values.baptism_date ? values.baptism_date.format('YYYY-MM-DD') : null,
        first_communion_date: values.first_communion_date ? values.first_communion_date.format('YYYY-MM-DD') : null,
        confirmation_date: values.confirmation_date ? values.confirmation_date.format('YYYY-MM-DD') : null,
        vow_date: values.vow_date ? values.vow_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };

      if (selectedTeacher.isNew) {
        const payload = { ...formattedValues };
        delete payload.code;
        const res = await api.post('/teachers', payload);
        const newCode = res.data?.data?.code;
        message.success(newCode ? `Thêm GLV thành công. Mã: ${newCode}` : 'Thêm giáo lý viên thành công');
      } else {
        await api.put(`/teachers/${selectedTeacher.id}`, formattedValues);
        message.success('Cập nhật giáo lý viên thành công');
      }

      fetchTeachers();
      setSelectedTeacher(null);
    } catch (error) {
      message.error('Lỗi khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/teachers/${id}`);
      message.success('Đã xóa giáo lý viên');
      fetchTeachers();
      setSelectedTeacher(null);
    } catch (error) {
      message.error('Lỗi khi xóa giáo lý viên');
    }
  };

  const uploadAvatar = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post('/upload', formData);
      if (res.data?.success) {
        onSuccess(res.data, file);
      } else {
        onError(new Error(res.data?.message || 'Upload thất bại'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload thất bại';
      onError(new Error(msg));
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = (info) => {
    if (info.file.status === 'done') {
      const payload = info.file.response?.data;
      const storedPath = toStoredMediaPath(payload?.path || payload?.url);
      if (!storedPath) {
        message.error('Không nhận được URL ảnh từ server');
        return;
      }
      form.setFieldsValue({ avatar_url: storedPath });
      setSelectedTeacher((prev) => (prev ? { ...prev, avatar_url: storedPath } : prev));
      message.success('Tải ảnh lên thành công');
    } else if (info.file.status === 'error') {
      const errMsg =
        info.file.response?.message ||
        info.file.error?.message ||
        'Tải ảnh lên thất bại';
      message.error(errMsg);
    }
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 60,
      align: 'center',
    },
    {
      title: 'Mã GLV',
      dataIndex: 'code',
      key: 'code',
      width: "15%",
    },
    {
      title: 'Tên Thánh',
      dataIndex: 'saint_name',
      key: 'saint_name',
      width: 120,
    },
    {
      title: 'Họ',
      dataIndex: 'first_name',
      key: 'first_name',
      width: "15%",
    },
    {
      title: 'Tên',
      dataIndex: 'last_name',
      key: 'last_name',
      render: (text) => <Text strong>{text}</Text>,
      width: "15%",
    },

    {
      title: 'Tình Trạng',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? 'Bình thường' : status}
        </Tag>
      ),
    },
  ];

  const filteredTeachers = teachers.filter(t =>
    `${t.saint_name} ${t.first_name} ${t.last_name}`.toLowerCase().includes(searchText.toLowerCase()) ||
    t.phone?.includes(searchText) ||
    t.code?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="teachers-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <UserOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Hồ Sơ Giáo Lý Viên
        </Title>
        <Space>
          <Tooltip title="Thêm"><Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#52c41a' }} onClick={handleAdd} /></Tooltip>
          {selectedTeacher && (
            <>
              <Tooltip title="Lưu"><Button icon={<SaveOutlined />} style={{ backgroundColor: '#52c41a', color: '#fff' }} onClick={handleSave} loading={loading} /></Tooltip>
              {!selectedTeacher.isNew && (
                <Popconfirm title="Bạn có chắc chắn muốn xóa giáo lý viên này?" onConfirm={() => handleDelete(selectedTeacher.id)}>
                  <Tooltip title="Xóa"><Button danger icon={<DeleteOutlined />} style={{ backgroundColor: '#ff4d4f', color: '#fff' }} /></Tooltip>
                </Popconfirm>
              )}
            </>
          )}
          <Tooltip title="Làm mới"><Button icon={<SyncOutlined />} style={{ backgroundColor: '#1890ff', color: '#fff' }} onClick={fetchTeachers} /></Tooltip>
          <Tooltip title="Nhập từ PMS"><Button icon={<UploadOutlined />} style={{ backgroundColor: '#faad14', color: '#fff' }} /></Tooltip>
          <Button icon={<PrinterOutlined />} style={{ backgroundColor: '#8c8c8c', color: '#fff' }}>In</Button>
        </Space>
      </div>

      {/* Filters */}
      <Card bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
        <Row gutter={12} align="bottom">
          <Col span={6}>
            <Text strong style={{ fontSize: '12px' }}>Khối / Ngành</Text>
            <Select defaultValue="all" style={{ width: '100%', marginTop: 4 }}>
              <Option value="all">Tất cả</Option>
              <Option value="1">Chiên Con</Option>
              <Option value="2">Ấu Nhi</Option>
              <Option value="3">Thiếu Nhi</Option>
              <Option value="4">Nghĩa Sĩ</Option>
              <Option value="5">Hiệp Sĩ</Option>
              <Option value="6">Dự Trưởng</Option>
            </Select>
          </Col>
          <Col span={14}>
            <Text strong style={{ fontSize: '12px' }}>Tìm Kiếm</Text>
            <Input
              placeholder="Nhập tên, số điện thoại hoặc mã GLV..."
              prefix={<SearchOutlined />}
              style={{ marginTop: 4 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Button type="primary" icon={<SearchOutlined />} block style={{ marginTop: 4 }} onClick={() => { }}>Tìm kiếm</Button>
          </Col>
        </Row>
      </Card>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden', minHeight: 0 }}>
        {/* Table Section */}
        <div style={{
          flex: selectedTeacher ? '0 0 60%' : '0 0 100%',
          transition: 'all 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          <Table
            columns={columns}
            dataSource={filteredTeachers}
            pagination={{ pageSize: 20 }}
            bordered
            size="small"
            loading={loading}
            scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              className: selectedTeacher?.id === record.id ? 'ant-table-row-selected' : '',
              style: { cursor: 'pointer' }
            })}
          />
        </div>

        {/* Detail Panel Section */}
        {selectedTeacher && (
          <Card
            style={{
              flex: '0 0 40%',
              maxWidth: 500,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
              borderLeft: '1px solid #f0f0f0',
              height: '700px'
            }}
            bodyStyle={{
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '700px',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                <UserOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                {selectedTeacher.isNew ? 'Thêm Giáo Lý Viên Mới' : 'Thông tin Giáo Lý Viên'}
              </Title>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setSelectedTeacher(null)}
                danger
              />
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <Form form={form} layout="vertical" size="small">
                <Row gutter={16}>
                  <Col span={10}>
                    <div style={{ position: 'relative', textAlign: 'center' }}>
                      <Avatar
                        shape="square"
                        size={120}
                        src={resolveMediaUrl(selectedTeacher.avatar_url) || "../src/assets/user.png"}
                        style={{ border: '4px solid #595959', borderRadius: 4 }}
                      />
                      <div style={{ position: 'absolute', top: 5, left: 15 }}>
                        <Upload
                          name="file"
                          customRequest={uploadAvatar}
                          showUploadList={false}
                          onChange={handleUpload}
                          disabled={uploading}
                        >
                          <Button shape="circle" size="small" icon={<EditOutlined />} style={{ backgroundColor: '#595959', color: '#fff' }} />
                        </Upload>
                      </div>
                      {/* <div style={{ position: 'absolute', bottom: -10, left: -10 }}>
                        <Button shape="circle" size="small" icon={<CameraOutlined />} style={{ backgroundColor: '#1890ff', color: '#fff' }} />
                      </div> */}
                      <div style={{ position: 'absolute', top: -10, right: -10 }}>
                        <Button
                          shape="circle"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          style={{ backgroundColor: '#ff4d4f', color: '#fff' }}
                          onClick={() => {
                            form.setFieldsValue({ avatar_url: null });
                            setSelectedTeacher({ ...selectedTeacher, avatar_url: null });
                          }}
                        />
                      </div>
                    </div>
                    <Form.Item name="avatar_url" hidden>
                      <Input />
                    </Form.Item>
                  </Col>
                  {/* <Col span={14} style={{ textAlign: 'center' }}>
                    <QRCode value={selectedTeacher.family_code || 'gxnhalongbn048'} size={100} bordered={false} />
                    <Text type="secondary" style={{ fontSize: '10px' }}><IdcardOutlined /> {selectedTeacher.family_code || 'gxnhalongbn048'}</Text>
                  </Col> */}
                </Row>

                <Title level={5} style={{ marginTop: 24, color: '#52c41a' }}>
                  <IdcardOutlined /> Danh Tính
                </Title>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Item
                      label="Mã GLV"
                      name="code"
                      tooltip="Tự động: MGV-YYYYMMDD-0001 (theo ngày tạo, không trùng)"
                    >
                      <Input
                        disabled={selectedTeacher.isNew}
                        placeholder={selectedTeacher.isNew ? 'Tự động khi lưu (MGV-YYYYMMDD-0001)' : undefined}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={10}>
                    <Form.Item label={<Space><BookOutlined style={{ color: '#722ed1' }} /> Tên Thánh</Space>} name="saint_name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item label={<Space>Họ *</Space>} name="first_name" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item label={<Space>Tên *</Space>} name="last_name" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={10}>
                    <Form.Item label={<Space><CalendarOutlined style={{ color: '#52c41a' }} /> Ngày Sinh</Space>} name="dob">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={14}>
                    <Form.Item label={<Space><EnvironmentOutlined style={{ color: '#ff4d4f' }} /> Nơi Sinh</Space>} name="pob">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item label={<Space><ManOutlined style={{ color: '#722ed1' }} /> Giới Tính</Space>} name="gender">
                      <Select>
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={<Space><CalendarOutlined style={{ color: '#52c41a' }} /> Ngày quan thầy</Space>} name="patron_day">
                      <Input placeholder="dd/mm" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={<Space><UserOutlined style={{ color: '#52c41a' }} /> Tình trạng</Space>} name="status">
                      <Select>
                        <Option value="active">Bình thường</Option>
                        <Option value="inactive">Tạm nghỉ</Option>
                        <Option value="retired">Nghỉ luôn</Option>
                        <Option value="transferred">Chuyển xứ</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={10}>
                    <Form.Item label={<Space><CheckCircleOutlined style={{ color: '#1890ff' }} /> Điểm danh GLV</Space>} name="allow_attendance" valuePropName="checked">
                      <Switch checkedChildren="Cho phép" unCheckedChildren="Không cho phép" />
                    </Form.Item>
                  </Col>
                  <Col span={14}>
                    <Form.Item label={<Space><KeyOutlined style={{ color: '#1890ff' }} /> Mật khẩu D2 (nếu có)</Space>} name="d2_password_hash">
                      <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={5} style={{ marginTop: 8, color: '#52c41a' }}>
                  <PhoneOutlined /> Thông tin liên hệ
                </Title>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Điện Thoại" name="phone">
                      <Input prefix={<PhoneOutlined style={{ color: '#52c41a' }} />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Email" name="email">
                      <Input prefix={<MailOutlined style={{ color: '#1890ff' }} />} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label={<Space><HomeOutlined style={{ color: '#faad14' }} /> Địa Chỉ</Space>} name="address">
                  <Input.TextArea rows={2} />
                </Form.Item>

                <Title level={5} style={{ marginTop: 8, color: '#722ed1' }}>
                  <EnvironmentOutlined /> Thông tin Giáo Xứ
                </Title>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Giáo Họ" name="parish_id">
                      <Select placeholder="Chọn giáo họ">
                        {parishes.map(p => (
                          <Option key={p.id} value={p.id}>{p.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Xóm/Tổ" name="village">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label={<Space><IdcardOutlined style={{ color: '#1890ff' }} /> Số gia đình</Space>} name="family_number">
                  <Input placeholder="4-108" />
                </Form.Item>

                <Title level={5} style={{ marginTop: 8, color: '#722ed1' }}>
                  <BookOutlined /> Bí Tích Rửa Tội
                </Title>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item label="Ngày" name="baptism_date">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Nơi" name="baptism_place">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Số sổ" name="baptism_book">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={5} style={{ marginTop: 8, color: '#ff4d4f' }}>
                  <SafetyCertificateOutlined /> Xưng Tội Rước Lễ Lần Đầu
                </Title>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Ngày" name="first_communion_date">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Nơi" name="first_communion_place">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={5} style={{ marginTop: 8, color: '#722ed1' }}>
                  <SafetyCertificateOutlined /> Bí Tích Thêm Sức
                </Title>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item label="Ngày" name="confirmation_date">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Nơi" name="confirmation_place">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Số sổ" name="confirmation_book">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={5} style={{ marginTop: 8, color: '#1890ff' }}>
                  <SolutionOutlined /> Tham gia Giáo lý viên
                </Title>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item label="Ngày tuyên hứa" name="vow_date">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Cấp bậc" name="level">
                      <Select>
                        <Option value="1">Cấp 1</Option>
                        <Option value="2">Cấp 2</Option>
                        <Option value="3">Cấp 3</Option>
                        <Option value="4">GLV lớn tuổi</Option>
                        <Option value="5">Dự trưởng</Option>
                        <Option value="6">Khác</Option>
                        <Option value="7">GLV1 - HTr 1</Option>
                        <Option value="8">GLV2 - HTr 1</Option>
                        <Option value="9">GLV2 - HTr 2</Option>
                        <Option value="10">GLV3 - HTr 1</Option>
                        <Option value="11">GLV3 - HTr 2</Option>
                        <Option value="12">GLV3 - HTr 3</Option>
                        <Option value="13">Huấn luyện viên</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Ngày kết thúc" name="end_date">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={5} style={{ marginTop: 8, color: '#faad14' }}>
                  <ReadOutlined /> Những lớp đang dạy
                </Title>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8, backgroundColor: '#fafafa', marginBottom: 16 }}>
                  <table style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <th style={{ textAlign: 'left', padding: '4px' }}>Lớp</th>
                        <th style={{ textAlign: 'left', padding: '4px' }}>Vai trò</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeacher.teachingClasses && selectedTeacher.teachingClasses.length > 0 ? (
                        selectedTeacher.teachingClasses.map(cls => (
                          <tr key={cls.id}>
                            <td style={{ padding: '4px' }}>{cls.name}</td>
                            <td style={{ padding: '4px' }}>{cls.role}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'center', padding: '8px', color: '#bfbfbf' }}>Chưa có lớp nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Form.Item label={<Space><MessageOutlined style={{ color: '#8c8c8c' }} /> Ghi Chú</Space>} name="notes">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Form>
            </div>
          </Card>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .ant-table-row-selected td {
          background-color: #e6f7ff !important;
        }
        .teachers-page .ant-card {
          border-radius: 8px;
        }
        .teachers-page .ant-btn {
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}} />
    </div>
  );
};

export default Teachers;
