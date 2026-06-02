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
  Popconfirm,
  Upload,
  App as AntdApp, Dropdown,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
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
  FileExcelOutlined,
  ImportOutlined, DownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { resolveMediaUrl, toStoredMediaPath } from '../utils/mediaUrl';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;

const Students = () => {
  const { message, modal } = AntdApp.useApp();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [nienHocs, setNienHocs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    academic_year_id: null,
    block_id: 'all',
    class_id: 'all',
    search: ''
  });

  const fetchNienHocs = async () => {
    try {
      const response = await api.get('/academic-years');
      if (response.data.success) {
        setNienHocs(response.data.data);
        if (!filters.academic_year_id && response.data.data.length > 0) {
          const current = response.data.data.find(y => y.is_current) || response.data.data[0];
          setFilters(prev => ({ ...prev, academic_year_id: current.id }));
        }
      }
    } catch (error) {
      message.error('Không thể tải danh sách niên học');
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await api.get('/blocks');
      if (response.data.success) {
        const blocksData = response.data.data;
        setBlocks(blocksData);

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user && (user.role === 'LECTURER' || user.role === 'BRANCH_SECRETARY')) {
          if (blocksData.length > 0 && filters.block_id === 'all') {
            setFilters(prev => ({ ...prev, block_id: blocksData[0].id }));
          }
        }
      }
    } catch (error) {
      message.error('Không thể tải danh sách khối');
    }
  };

  const fetchClasses = async () => {
    if (!filters.academic_year_id) return;
    try {
      const response = await api.get('/classes', {
        params: {
          academic_year_id: filters.academic_year_id,
          block_id: filters.block_id
        }
      });
      if (response.data.success) {
        const classesData = response.data.data;
        setClasses(classesData);

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user && (user.role === 'LECTURER' || user.role === 'BRANCH_SECRETARY')) {
          if (classesData.length === 1 && filters.class_id === 'all') {
            setFilters(prev => ({ ...prev, class_id: classesData[0].id }));
          }
        }
      }
    } catch (error) {
      message.error('Không thể tải danh sách lớp học');
    }
  };


  const handleExportExcel = () => {
    if (!students || students.length === 0) {
      message.warning('Không có dữ liệu để xuất!');
      return;
    }
    const dataToExport = students.map((s, index) => ({
      'STT': index + 1,
      'Mã hệ thống': s.code || '',
      'Mã thẻ': s.card_code || '',
      'Tên Thánh': s.saint_name || '',
      'Họ': s.first_name || '',
      'Tên': s.last_name || '',
      'Thường gọi': s.nickname || '',
      'Ngày sinh': s.dob ? dayjs(s.dob).format('DD/MM/YYYY') : '',
      'Nơi sinh': s.birth_place || '',
      'Giới tính': s.gender === 'Nam' ? 'Nam' : 'Nữ',
      'Ngày rửa tội': s.baptism_date ? dayjs(s.baptism_date).format('DD/MM/YYYY') : '',
      'Rửa tội tại': s.baptism_place || '',
      'Cha rửa tội': s.baptism_priest || '',
      'Ngày rước lễ': s.eucharist_date ? dayjs(s.eucharist_date).format('DD/MM/YYYY') : '',
      'Rước lễ tại': s.eucharist_place || '',
      'Ngày thêm sức': s.confirmation_date ? dayjs(s.confirmation_date).format('DD/MM/YYYY') : '',
      'Thêm sức tại': s.confirmation_place || '',
      'Cha thêm sức': s.confirmation_priest || '',
      'Ghi chú': s.note || '',
      'Lớp': s.class_name || '',
      'Ngành': s.block_name || '',
      'Khối': s.grade_name || '',
      'Tình trạng học viên': s.status || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Tùy chỉnh độ rộng cột
    const wscols = [
      { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học viên');

    let fileName = 'danh_sach_hoc_vien.xlsx';
    if (filters.class_id && filters.class_id !== 'all' && classes.length > 0) {
      const cls = classes.find(c => c.id === filters.class_id);
      if (cls) fileName = `danh_sach_lop_${cls.name}.xlsx`;
    }

    XLSX.writeFile(workbook, fileName);
  };

  const printMenu = [
    { key: '1', label: 'Danh sách lớp bản rút gọn', onClick: handleExportExcel },
    { key: '2', label: 'Danh sách lớp bản đầy đủ', onClick: handleExportExcel },
    { key: '3', label: 'Danh sách một khối/ ngành', onClick: handleExportExcel },
    { key: '4', label: 'Danh sách các khối/ ngành', onClick: handleExportExcel },
    { key: '5', label: 'Danh sách chỉ số tổng quan', onClick: handleExportExcel },
    { key: '6', label: 'Danh sách tình trạng học viên', onClick: handleExportExcel },
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students', { params: filters });
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNienHocs();
    fetchBlocks();
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [filters.academic_year_id, filters.block_id]);

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        baptism_date: values.baptism_date ? values.baptism_date.format('YYYY-MM-DD') : null,
        first_communion_date: values.first_communion_date ? values.first_communion_date.format('YYYY-MM-DD') : null,
        confirmation_date: values.confirmation_date ? values.confirmation_date.format('YYYY-MM-DD') : null,
        academic_year_id: filters.academic_year_id,
        class_id: values.class_id
      };

      if (isAdding) {
        const createPayload = { ...payload };
        delete createPayload.code;
        const res = await api.post('/students', createPayload);
        const newCode = res.data?.data?.code;
        message.success(newCode ? `Thêm học viên thành công. Mã: ${newCode}` : 'Thêm học viên mới thành công');
      } else {
        await api.put(`/students/${selectedStudent.id}`, payload);
        message.success('Cập nhật học viên thành công');
      }

      setIsAdding(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      message.success('Đã xóa học viên');
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      message.error('Lỗi khi xóa học viên');
    }
  };

  const handleDownloadImportTemplate = async () => {
    if (!filters.academic_year_id) {
      message.warning('Vui lòng chọn niên học trước khi tải file mẫu');
      return;
    }
    try {
      const res = await api.get('/students/import-template', {
        params: { academic_year_id: filters.academic_year_id },
        responseType: 'blob',
      });
      const ct = res.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        const text = await res.data.text();
        const j = JSON.parse(text);
        message.error(j.message || 'Không tải được file mẫu');
        return;
      }
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_import_hoc_vien.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success('Đã tải file mẫu import');
    } catch (error) {
      message.error(error.response?.data?.message || 'Không tải được file mẫu');
    }
  };

  const showImportResult = (payload) => {
    const errList = payload?.errors || [];
    modal.info({
      title: 'Kết quả import',
      width: 560,
      content: (
        <div>
          <p>Đã thêm thành công: <strong>{payload?.imported ?? 0}</strong> học viên.</p>
          {errList.length > 0 && (
            <>
              <p style={{ marginBottom: 8 }}>Các dòng chưa import được:</p>
              <ul style={{ maxHeight: 280, overflow: 'auto', paddingLeft: 18, margin: 0 }}>
                {errList.map((e, i) => (
                  <li key={`${e.row}-${i}`}>
                    Dòng {e.row}
                    {e.code ? ` (${e.code})` : ''}: {e.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ),
    });
  };

  const handleImportExcel = async (file) => {
    if (!filters.academic_year_id) {
      message.warning('Vui lòng chọn niên học trước khi import');
      return false;
    }
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academic_year_id', filters.academic_year_id);
      const res = await api.post('/students/import', formData);
      if (res.data.success) {
        message.success(res.data.message);
        if (res.data.data?.errors?.length > 0) {
          showImportResult(res.data.data);
        }
        fetchStudents();
      } else {
        message.error(res.data.message || 'Import thất bại');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi import file');
    } finally {
      setImportLoading(false);
    }
    return false;
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Mã số',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Tên Thánh',
      dataIndex: 'saint_name',
      key: 'saint_name',
      width: 100,
    },
    {
      title: 'Họ',
      dataIndex: 'first_name',
      key: 'first_name',
    },
    {
      title: 'Tên',
      dataIndex: 'last_name',
      key: 'last_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Ngày Sinh',
      dataIndex: 'dob',
      key: 'dob',
      width: 110,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Lớp',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Tình trạng',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' || status === 'Bình thường' ? 'green' : 'orange'}>
          {status === 'active' ? 'Bình thường' : status}
        </Tag>
      ),
    },

  ];

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
      setSelectedStudent((prev) => (prev ? { ...prev, avatar_url: storedPath } : prev));
      message.success('Tải ảnh lên thành công');
    } else if (info.file.status === 'error') {
      const errMsg =
        info.file.response?.message ||
        info.file.error?.message ||
        'Tải ảnh lên thất bại';
      message.error(errMsg);
    }
  };

  const handleRowClick = (record) => {
    setIsAdding(false);
    setSelectedStudent(record);
    const genderNorm =
      record.gender === 'Nam' || record.gender === 'nam' || record.gender === 'male'
        ? 'male'
        : record.gender === 'Nữ' || record.gender === 'nu' || record.gender === 'female'
          ? 'female'
          : record.gender;
    form.setFieldsValue({
      ...record,
      avatar_url: toStoredMediaPath(record.avatar_url) ?? record.avatar_url,
      gender: genderNorm,
      dob: record.dob ? dayjs(record.dob) : null,
      baptism_date: record.baptism_date ? dayjs(record.baptism_date) : null,
      first_communion_date: record.first_communion_date ? dayjs(record.first_communion_date) : null,
      confirmation_date: record.confirmation_date ? dayjs(record.confirmation_date) : null,
    });
  };

  return (
    <div className="students-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <IdcardOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Hồ Sơ Học Viên
        </Title>
        <Space>
          <Tooltip title="Điền tên lớp ở dòng 2 (ô cạnh Lớp:). Mã học viên tự sinh; tình trạng mặc định Bình thường. Giới tính: nam hoặc nữ.">
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleDownloadImportTemplate}
              style={{ backgroundColor: '#237804', color: '#fff' }}
            >
              Tải mẫu Excel
            </Button>
          </Tooltip>
          <Upload accept=".xlsx" showUploadList={false} beforeUpload={handleImportExcel} disabled={importLoading}>
            <Tooltip title="Chọn .xlsx: mỗi dòng có ít nhất một ô có dữ liệu; không cần mã hay lớp/giáo xứ">
              <Button
                icon={<ImportOutlined />}
                loading={importLoading}
                style={{ backgroundColor: '#fa8c16', color: '#fff' }}
              >
                Import Excel
              </Button>
            </Tooltip>
          </Upload>
          {/* <Tooltip title="Chọn hàng loạt"><Button icon={<TeamOutlined />} style={{ backgroundColor: '#722ed1', color: '#fff' }} /></Tooltip> */}
          <Tooltip title="Thêm">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: '#52c41a' }}
              onClick={() => {
                setIsAdding(true);
                setSelectedStudent({});
                form.resetFields();
              }}
            />
          </Tooltip>
          {(selectedStudent || isAdding) && (
            <>
              <Tooltip title="Lưu"><Button icon={<SaveOutlined />} style={{ backgroundColor: '#52c41a', color: '#fff' }} onClick={handleSave} /></Tooltip>
              <Tooltip title="Hủy"><Button icon={<UndoOutlined />} style={{ backgroundColor: '#faad14', color: '#fff' }} onClick={() => { setSelectedStudent(null); setIsAdding(false); }} /></Tooltip>
              {selectedStudent?.id && (
                <Popconfirm title="Xóa học viên này?" onConfirm={() => handleDelete(selectedStudent.id)}>
                  <Tooltip title="Xóa"><Button danger icon={<DeleteOutlined />} style={{ backgroundColor: '#ff4d4f', color: '#fff' }} /></Tooltip>
                </Popconfirm>
              )}
            </>
          )}
          <Tooltip title="Làm mới"><Button icon={<SyncOutlined />} style={{ backgroundColor: '#1890ff', color: '#fff' }} onClick={fetchStudents} /></Tooltip>
          <Dropdown menu={{ items: printMenu }} trigger={['click']}>
            <Button icon={<PrinterOutlined />} style={{ backgroundColor: '#8c8c8c', color: '#fff' }}>
              Danh sách <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* Filters */}
      <Card bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
        <Row gutter={12} align="bottom">
          <Col span={4}>
            <Text strong style={{ fontSize: '12px' }}>Niên học</Text>
            <Select
              value={filters.academic_year_id}
              style={{ width: '100%' }}
              onChange={(val) => setFilters(prev => ({ ...prev, academic_year_id: val }))}
            >
              {nienHocs.map(y => <Option key={y.id} value={y.id}>{y.name}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: '12px' }}>Khối / Ngành</Text>
            <Select
              value={filters.block_id}
              style={{ width: '100%' }}
              onChange={(val) => setFilters(prev => ({ ...prev, block_id: val, class_id: 'all' }))}
            >
              <Option value="all">Tất cả</Option>
              {blocks.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: '12px' }}>Lớp / Chi Đoàn</Text>
            <Select
              value={filters.class_id}
              style={{ width: '100%' }}
              onChange={(val) => setFilters(prev => ({ ...prev, class_id: val }))}
            >
              <Option value="all">Tất cả</Option>
              {classes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col span={10}>
            <Text strong style={{ fontSize: '12px' }}>Tìm Kiếm</Text>
            <Input
              placeholder="Nhập từ khóa..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={fetchStudents}
            />
          </Col>
          <Col span={2}>
            <Button type="primary" icon={<SearchOutlined />} block onClick={fetchStudents} />
          </Col>
        </Row>
      </Card>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden', minHeight: 0 }}>
        {/* Table Section */}
        <div style={{
          flex: selectedStudent ? '0 0 60%' : '0 0 100%',
          transition: 'all 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0 // Quan trọng để table không đẩy container
        }}>
          {/* Quick Stats */}
          <Card bodyStyle={{ padding: '8px 16px', background: 'linear-gradient(to right, #f0f5ff, #f6ffed)' }} style={{ marginBottom: 12 }}>
            <Row gutter={8}>
              <Col span={6}>
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#e6f7ff' }} icon={<TeamOutlined style={{ color: '#1890ff' }} />} />
                  <Text strong style={{ color: '#1890ff', fontSize: '12px' }}>{students.length} học viên</Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#f6ffed' }} icon={<UserOutlined style={{ color: '#52c41a' }} />} />
                  <Text strong style={{ color: '#52c41a', fontSize: '11px' }} ellipsis>
                    {classes.find(c => c.id === filters.class_id)?.head_teacher_first_name ?
                      `${classes.find(c => c.id === filters.class_id).head_teacher_saint_name || ''} ${classes.find(c => c.id === filters.class_id).head_teacher_first_name} ${classes.find(c => c.id === filters.class_id).head_teacher_last_name}`
                      : 'Chưa có GLV chủ nhiệm'}
                  </Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#f9f0ff' }} icon={<HomeOutlined style={{ color: '#722ed1' }} />} />
                  <Text strong style={{ color: '#722ed1', fontSize: '12px' }}>{classes.find(c => c.id === filters.class_id)?.room || '-'}</Text>
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={students}
            rowKey="id"
            pagination={false}
            bordered
            size="small"
            loading={loading}
            scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              className: selectedStudent?.id === record.id ? 'ant-table-row-selected' : '',
              style: { cursor: 'pointer' }
            })}
          />
        </div>

        {/* Detail Panel Section */}
        {(selectedStudent || isAdding) && (
          <Card
            style={{
              flex: '0 0 40%',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
              borderLeft: '1px solid #f0f0f0'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{isAdding ? 'Thêm học viên mới' : 'Thông tin chi tiết'}</Title>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => { setSelectedStudent(null); setIsAdding(false); }}
                danger
              />
            </div>

            <Form form={form} layout="vertical" size="small">
              <Row gutter={16}>
                <Col span={10}>
                  <div style={{ position: 'relative', textAlign: 'center' }}>
                    <Avatar
                      shape="square"
                      size={120}
                      src={resolveMediaUrl(selectedStudent?.avatar_url) || "../src/assets/user.png"}
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
                    {/* <div style={{ position: 'absolute', top: 30, left: -10 }}>
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
                          setSelectedStudent({ ...selectedStudent, avatar_url: null });
                        }}
                      />
                    </div>
                  </div>
                  <Form.Item name="avatar_url" hidden>
                    <Input />
                  </Form.Item>
                </Col>
                {/* <Col span={14} style={{ textAlign: 'center' }}>
                  <QRCode value={selectedStudent?.code || 'NEW'} size={100} bordered={false} />
                  <Text type="secondary" style={{ fontSize: '10px' }}>||||| {selectedStudent?.code || 'NEW'}</Text>
                </Col> */}
              </Row>

              <Title level={5} style={{ marginTop: 16, color: '#52c41a' }}>
                <IdcardOutlined /> Danh Tính
              </Title>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label={<Space><UserOutlined style={{ color: '#1890ff' }} /> Tên Thánh</Space>} name="saint_name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={<Space><EditOutlined style={{ color: '#8c8c8c' }} /> Họ</Space>} name="first_name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={<Space><EditOutlined style={{ color: '#8c8c8c' }} /> Tên</Space>} name="last_name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Mã số học viên"
                    name="code"
                    tooltip="Tự động: MHV-YYYYMMDD-0001 (theo ngày tạo, không trùng)"
                  >
                    <Input
                      disabled={isAdding}
                      placeholder={isAdding ? 'Tự động khi lưu (MHV-YYYYMMDD-0001)' : undefined}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Lớp học" name="class_id" rules={[{ required: true }]}>
                    <Select placeholder="Chọn lớp">
                      {classes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>
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
                <Col span={10}>
                  <Form.Item label={<Space><ManOutlined style={{ color: '#722ed1' }} /> Giới Tính</Space>} name="gender">
                    <Select>
                      <Option value="male">Nam</Option>
                      <Option value="female">Nữ</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={14}>
                  <Form.Item label={<Space><UserOutlined style={{ color: '#52c41a' }} /> Tình trạng</Space>} name="status">
                    <Select>
                      <Option value="active">Bình thường</Option>
                      <Option value="inactive">Tạm nghỉ</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8, color: '#722ed1' }}>
                <EnvironmentOutlined /> Bí Tích
              </Title>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="Ngày Rửa Tội" name="baptism_date">
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Nơi Rửa Tội" name="baptism_place">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="Ngày Rước Lễ" name="first_communion_date">
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Nơi Rước Lễ" name="first_communion_place">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="Ngày Thêm Sức" name="confirmation_date">
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Nơi Thêm Sức" name="confirmation_place">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8, color: '#52c41a' }}>
                <TeamOutlined /> Gia Đình
              </Title>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Tên Thánh & Họ Tên Cha" name="father_name">
                    <Input prefix={<ManOutlined style={{ color: '#1890ff' }} />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Tên Thánh & Họ Tên Mẹ" name="mother_name">
                    <Input prefix={<WomanOutlined style={{ color: '#eb2f96' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Số điện thoại" name="phone">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Số sổ gia đình" name="family_number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Địa chỉ" name="address">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item label="Ghi chú" name="notes">
                <Input.TextArea rows={2} />
              </Form.Item>

              <Button type="primary" block icon={<SaveOutlined />} onClick={handleSave} style={{ marginTop: 16 }}>
                {isAdding ? 'Thêm mới' : 'Cập nhật'}
              </Button>
            </Form>
          </Card>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .ant-table-row-selected td {
          background-color: #e6f7ff !important;
        }
        .students-page .ant-card {
          border-radius: 8px;
        }
        .students-page .ant-btn {
          border-radius: 4px;
        }
      `}} />
    </div>
  );
};

export default Students;
