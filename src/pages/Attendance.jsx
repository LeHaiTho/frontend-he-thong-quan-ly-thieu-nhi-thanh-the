import React, { useState, useEffect, useCallback } from 'react';
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
  Typography,
  DatePicker,
  Tabs,
  Modal,
  message,
  Popconfirm,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  DeleteOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const TYPE_LABELS = {
  mass: 'Thánh lễ',
  catechism: 'Giáo lý',
};

const STATUS_OPTIONS = [
  { value: 'present', label: 'Hiện diện' },
  { value: 'absent', label: 'Vắng mặt' },
  { value: 'late', label: 'Đi muộn' },
  { value: 'excused', label: 'Có phép' },
];

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [nienHocs, setNienHocs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyBlocks, setHistoryBlocks] = useState([]);
  const [historyClasses, setHistoryClasses] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(20);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalSearch, setAddModalSearch] = useState('');
  const [addModalConfig, setAddModalConfig] = useState({ mass_required: 0, catechism_required: 0 });
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [configStatus, setConfigStatus] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]);

  const [filters, setFilters] = useState({
    academic_year_id: null,
    semester_id: null,
    block_id: 'all',
    class_id: null,
    attendance_type: 'all',
    search: '',
    from: null,
    to: null,
    session_date: dayjs(),
  });

  const buildClassesParams = (academicYearId, blockId) => {
    const params = { academic_year_id: academicYearId };
    if (blockId && blockId !== 'all') params.block_id = blockId;
    return params;
  };

  const [historyFilters, setHistoryFilters] = useState({
    academic_year_id: null,
    semester_id: null,
    block_id: 'all',
    class_id: null,
    attendance_type: 'all',
    status: 'all',
    search: '',
    attendant_search: '',
    from: null,
    to: null,
  });

  const [addForm, setAddForm] = useState({
    attendance_type: 'mass',
    attendance_date: dayjs(),
    status: 'present',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const yearRes = await api.get('/academic-years');
        if (yearRes.data.success) {
          setNienHocs(yearRes.data.data);
          const current = yearRes.data.data.find((y) => y.is_current) || yearRes.data.data[0];
          if (current) {
            const defaults = {
              academic_year_id: current.id,
              semester_id: current.semesters?.[0]?.id ?? null,
              block_id: 'all',
              class_id: null,
            };
            setFilters((prev) => ({ ...prev, ...defaults }));
            setHistoryFilters((prev) => ({
              ...prev,
              academic_year_id: prev.academic_year_id ?? defaults.academic_year_id,
              semester_id: prev.semester_id ?? defaults.semester_id,
              block_id: prev.block_id ?? 'all',
              class_id: null,
            }));
          }
        }
      } catch {
        message.error('Không tải được dữ liệu ban đầu');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!filters.academic_year_id) return;
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/blocks', {
          params: { academic_year_id: filters.academic_year_id },
        });
        if (res.data.success) {
          const blocksData = res.data.data;
          setBlocks(blocksData);
          
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          if (user && (user.role === 'LECTURER' || user.role === 'BRANCH_SECRETARY')) {
            if (blocksData.length > 0 && filters.block_id === 'all') {
              setFilters(prev => ({ ...prev, block_id: blocksData[0].id }));
            }
          }
        }
      } catch {
        message.error('Không thể tải danh sách khối');
      }
    };
    fetchBlocks();
  }, [filters.academic_year_id]);

  useEffect(() => {
    if (!filters.academic_year_id) return;
    if (filters.block_id === 'all') {
      setClasses([]);
      setFilters((prev) => ({ ...prev, class_id: null }));
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes', {
          params: buildClassesParams(filters.academic_year_id, filters.block_id),
        });
        if (res.data.success) {
          const list = res.data.data;
          setClasses(list);
          setFilters((prev) => {
            if (list.some((c) => c.id === prev.class_id)) return prev;
            return { ...prev, class_id: list[0]?.id ?? null };
          });
        }
      } catch {
        message.error('Không tải được danh sách lớp');
      }
    };
    fetchClasses();
  }, [filters.academic_year_id, filters.block_id]);

  useEffect(() => {
    if (!historyFilters.academic_year_id) return;
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/blocks', {
          params: { academic_year_id: historyFilters.academic_year_id },
        });
        if (res.data.success) {
          const blocksData = res.data.data;
          setHistoryBlocks(blocksData);
          
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          if (user && (user.role === 'LECTURER' || user.role === 'BRANCH_SECRETARY')) {
            if (blocksData.length > 0 && historyFilters.block_id === 'all') {
              setHistoryFilters(prev => ({ ...prev, block_id: blocksData[0].id }));
            }
          }
        }
      } catch {
        message.error('Không thể tải danh sách khối');
      }
    };
    fetchBlocks();
  }, [historyFilters.academic_year_id]);

  useEffect(() => {
    if (!historyFilters.academic_year_id) return;
    if (historyFilters.block_id === 'all') {
      setHistoryClasses([]);
      setHistoryFilters((prev) => ({ ...prev, class_id: null }));
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes', {
          params: buildClassesParams(historyFilters.academic_year_id, historyFilters.block_id),
        });
        if (res.data.success) {
          setHistoryClasses(res.data.data);
          setHistoryFilters((prev) => {
            if (!prev.class_id || res.data.data.some((c) => c.id === prev.class_id)) return prev;
            return { ...prev, class_id: null };
          });
        }
      } catch {
        message.error('Không tải được danh sách lớp');
      }
    };
    fetchClasses();
  }, [historyFilters.academic_year_id, historyFilters.block_id]);

  const fetchRecords = useCallback(async () => {
    if (!filters.class_id || !filters.semester_id) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const params = {
        class_id: filters.class_id,
        semester_id: filters.semester_id,
        search: filters.search || undefined,
        attendance_type: filters.attendance_type !== 'all' ? filters.attendance_type : undefined,
        from: filters.from ? filters.from.format('YYYY-MM-DD') : undefined,
        to: filters.to ? filters.to.format('YYYY-MM-DD') : undefined,
      };
      const res = await api.get('/attendance-records', { params });
      if (res.data.success) setRecords(res.data.data);
    } catch {
      message.error('Không tải được điểm danh');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchHistory = useCallback(
    async (page = historyPage) => {
      if (!historyFilters.academic_year_id) {
        setHistoryRecords([]);
        setHistoryTotal(0);
        return;
      }
      setHistoryLoading(true);
      try {
        const params = {
          academic_year_id: historyFilters.academic_year_id,
          semester_id: historyFilters.semester_id || undefined,
          block_id: historyFilters.block_id,
          class_id: historyFilters.class_id || undefined,
          attendance_type:
            historyFilters.attendance_type !== 'all' ? historyFilters.attendance_type : undefined,
          status: historyFilters.status !== 'all' ? historyFilters.status : undefined,
          search: historyFilters.search || undefined,
          attendant_search: historyFilters.attendant_search || undefined,
          from: historyFilters.from ? historyFilters.from.format('YYYY-MM-DD') : undefined,
          to: historyFilters.to ? historyFilters.to.format('YYYY-MM-DD') : undefined,
          limit: historyPageSize,
          offset: (page - 1) * historyPageSize,
        };
        const res = await api.get('/attendance-records/history', { params });
        if (res.data.success) {
          setHistoryRecords(res.data.data);
          setHistoryTotal(res.data.total ?? 0);
          setHistoryPage(page);
        }
      } catch (err) {
        message.error(err.response?.data?.message || 'Không tải được lịch sử điểm danh');
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyFilters, historyPageSize]
  );

  useEffect(() => {
    if (activeTab === '1') fetchRecords();
  }, [activeTab, fetchRecords]);

  useEffect(() => {
    if (activeTab === '2') fetchHistory(1);
  }, [activeTab, historyFilters, fetchHistory]);

  useEffect(() => {
    if (configStatus) {
      setAddModalConfig({
        mass_required: configStatus.mass_required ?? 0,
        catechism_required: configStatus.catechism_required ?? 0,
      });
    }
  }, [configStatus]);

  const sessionType =
    filters.attendance_type !== 'all' ? filters.attendance_type : addForm.attendance_type;
  const sessionDate = filters.session_date || addForm.attendance_date || dayjs();

  const fetchConfigStatus = useCallback(async () => {
    if (!filters.class_id || !filters.semester_id) {
      setConfigStatus(null);
      return;
    }
    try {
      const res = await api.get('/attendance-configs/status', {
        params: {
          class_id: filters.class_id,
          semester_id: filters.semester_id,
          attendance_date: sessionDate.format('YYYY-MM-DD'),
          attendance_type: sessionType !== 'all' ? sessionType : undefined,
        },
      });
      if (res.data.success) setConfigStatus(res.data.data);
    } catch {
      setConfigStatus(null);
    }
  }, [filters.class_id, filters.semester_id, sessionDate.format('YYYY-MM-DD'), sessionType]);

  const fetchEligibleStudents = async (search = addModalSearch, target = 'modal') => {
    if (!filters.class_id || !filters.semester_id) return;
    const type = target === 'session' ? sessionType : addForm.attendance_type;
    const date = target === 'session' ? sessionDate : addForm.attendance_date;
    if (!type || type === 'all') return;
    try {
      const res = await api.get('/attendance-records/eligible-students', {
        params: {
          class_id: filters.class_id,
          semester_id: filters.semester_id,
          attendance_date: date?.format('YYYY-MM-DD'),
          attendance_type: type,
          search: search || undefined,
        },
      });
      if (res.data.success) {
        if (target === 'session') {
          setSessionStudents(res.data.data);
        } else {
          setEligibleStudents(res.data.data);
        }
        if (res.data.attendance_config) setAddModalConfig(res.data.attendance_config);
      }
    } catch {
      message.error('Không tải danh sách học viên');
    }
  };

  useEffect(() => {
    fetchConfigStatus();
  }, [fetchConfigStatus]);

  useEffect(() => {
    if (isAddModalOpen) fetchEligibleStudents(addModalSearch, 'modal');
  }, [
    isAddModalOpen,
    filters.class_id,
    filters.semester_id,
    addForm.attendance_type,
    addForm.attendance_date?.format('YYYY-MM-DD'),
  ]);

  useEffect(() => {
    if (activeTab === '1' && filters.attendance_type !== 'all') {
      fetchEligibleStudents(filters.search, 'session');
    } else {
      setSessionStudents([]);
    }
  }, [
    activeTab,
    filters.class_id,
    filters.semester_id,
    filters.attendance_type,
    filters.session_date?.format('YYYY-MM-DD'),
    filters.search,
  ]);

  const handleStatusChange = async (record, status) => {
    try {
      await api.put(`/attendance-records/${record.id}`, { status });
      message.success('Đã cập nhật');
      fetchRecords();
    } catch {
      message.error('Lỗi cập nhật');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/attendance-records/${id}`);
      message.success('Đã xóa');
      fetchRecords();
    } catch {
      message.error('Lỗi xóa');
    }
  };

  const openAddModal = () => {
    if (filters.attendance_type === 'all') {
      message.warning('Vui lòng chọn loại điểm danh (Thánh lễ hoặc Giáo lý)');
      return;
    }
    if (configStatus && !configStatus.is_configured) {
      message.warning('Chưa cấu hình chuyên cần cho lớp/học kỳ. Vào Cài đặt → Chuyên cần và lưu lại.');
      return;
    }
    if (configStatus?.is_date_enabled === false) {
      message.warning(
        `Ngày ${sessionDate.format('DD/MM/YYYY')} (${configStatus.day_label}) không nằm trong lịch ${TYPE_LABELS[filters.attendance_type]} — vẫn có thể lưu nhưng có thể không tính Tl/Gl`
      );
    }
    setAddForm((p) => ({
      ...p,
      attendance_type: filters.attendance_type,
      attendance_date: filters.session_date || dayjs(),
    }));
    setIsAddModalOpen(true);
  };

  const handleToggleAttendance = async (student, mode = 'modal') => {
    if (!filters.class_id || !filters.semester_id) {
      message.warning('Chọn lớp và học kỳ');
      return;
    }
    const type = mode === 'session' ? sessionType : addForm.attendance_type;
    const date = mode === 'session' ? sessionDate : addForm.attendance_date;
    if (!type || type === 'all') {
      message.warning('Vui lòng chọn loại điểm danh');
      return;
    }
    setToggleLoadingId(student.id);
    try {
      if (student.attendance_record_id) {
        await api.delete(`/attendance-records/${student.attendance_record_id}`);
        message.success('Đã hủy điểm danh');
      } else {
        const res = await api.post('/attendance-records', {
          student_id: student.id,
          class_id: filters.class_id,
          semester_id: filters.semester_id,
          attendance_date: date.format('YYYY-MM-DD'),
          attendance_type: type,
          status: mode === 'session' ? 'present' : addForm.status,
          check_in_time: dayjs().format('HH:mm:ss'),
        });
        const savedType = res?.data?.data?.attendance_type || type;
        message.success(
          res?.data?.message || `Đã điểm danh ${TYPE_LABELS[savedType] || savedType}`
        );
      }
      await Promise.all([
        fetchEligibleStudents(addModalSearch, 'modal'),
        fetchEligibleStudents(filters.search, 'session'),
        fetchRecords(),
        fetchConfigStatus(),
      ]);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi thao tác điểm danh');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const formatCountScore = (present, required) => {
    if (!required) return `${present}`;
    const pts = ((present * 10) / required).toFixed(1);
    return `${present}/${required} (${pts})`;
  };

  const studentToggleColumns = (mode) => [
    { title: 'Mã', dataIndex: 'code', width: 80 },
    { title: 'Tên thánh', dataIndex: 'saint_name', width: 90 },
    { title: 'Họ', dataIndex: 'first_name', width: 120 },
    { title: 'Tên', dataIndex: 'last_name', width: 80 },
    {
      title: 'Tl',
      key: 'tl',
      width: 110,
      align: 'center',
      render: (_, row) => (
        <Text style={{ fontSize: 11 }}>
          {formatCountScore(row.mass_present ?? 0, row.mass_required ?? addModalConfig.mass_required)}
        </Text>
      ),
    },
    {
      title: 'Gl',
      key: 'gl',
      width: 110,
      align: 'center',
      render: (_, row) => (
        <Text style={{ fontSize: 11 }}>
          {formatCountScore(
            row.catechism_present ?? 0,
            row.catechism_required ?? addModalConfig.catechism_required
          )}
        </Text>
      ),
    },
    {
      title: 'Buổi này',
      key: 'session',
      width: 100,
      align: 'center',
      render: (_, row) =>
        row.is_marked ? (
          <Tag color={row.session_status === 'present' || row.session_status === 'late' ? 'green' : 'default'}>
            {STATUS_OPTIONS.find((o) => o.value === row.session_status)?.label || row.session_status}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: '',
      width: 130,
      fixed: 'right',
      render: (_, row) =>
        row.is_marked ? (
          <Button
            danger
            size="small"
            icon={<MinusCircleOutlined />}
            loading={toggleLoadingId === row.id}
            onClick={() => handleToggleAttendance(row, mode)}
          >
            Hủy ĐD
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<PlusCircleOutlined />}
            loading={toggleLoadingId === row.id}
            onClick={() => handleToggleAttendance(row, mode)}
          >
            Điểm danh
          </Button>
        ),
    },
  ];

  const statusLabel = (value) =>
    STATUS_OPTIONS.find((o) => o.value === value)?.label || value;

  const statusTagColor = (value) => {
    if (value === 'present') return 'green';
    if (value === 'late') return 'gold';
    if (value === 'excused') return 'blue';
    if (value === 'absent') return 'red';
    return 'default';
  };

  const columnsTab1 = [
    { title: 'STT', width: 50, align: 'center', render: (_, __, i) => i + 1 },
    { title: 'Mã HV', dataIndex: 'student_code', width: 90 },
    { title: 'Tên Thánh', dataIndex: 'saint_name', width: 100 },
    { title: 'Họ', dataIndex: 'first_name' },
    { title: 'Tên', dataIndex: 'last_name', render: (t) => <Text strong>{t}</Text> },
    { title: 'Lớp', dataIndex: 'class_name' },
    { title: 'Khối', dataIndex: 'block_name' },
    {
      title: 'Loại',
      dataIndex: 'attendance_type',
      width: 110,
      render: (t) => (
        <Tag color={t === 'mass' ? 'blue' : 'purple'}>{TYPE_LABELS[t] || t}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status, record) => (
        <Select
          size="small"
          value={status}
          style={{ width: 130 }}
          onChange={(val) => handleStatusChange(record, val)}
          options={STATUS_OPTIONS}
        />
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'attendance_date',
      width: 110,
      render: (d) => {
        const dow = d ? dayjs(d).day() : 0;
        return (
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 11 }}>{DAY_LABELS[dow]}</Text>
            <Text>{d ? dayjs(d).format('DD/MM/YYYY') : '-'}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Ghi nhận',
      key: 'recorded',
      width: 120,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>{r.recorded_at ? dayjs(r.recorded_at).format('DD/MM/YYYY') : '-'}</div>
          <div style={{ color: '#8c8c8c' }}>{r.check_in_time || ''}</div>
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Popconfirm title="Xóa bản ghi?" onConfirm={() => handleDelete(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const columnsHistory = [
    {
      title: 'STT',
      width: 50,
      align: 'center',
      render: (_, __, i) => (historyPage - 1) * historyPageSize + i + 1,
    },
    { title: 'Mã HV', dataIndex: 'student_code', width: 90 },
    { title: 'Tên Thánh', dataIndex: 'saint_name', width: 100 },
    {
      title: 'Học viên',
      key: 'name',
      width: 160,
      render: (_, r) => (
        <Text strong>
          {r.first_name} {r.last_name}
        </Text>
      ),
    },
    { title: 'Lớp', dataIndex: 'class_name', width: 100 },
    { title: 'Khối', dataIndex: 'block_name', width: 100 },
    {
      title: 'Loại',
      dataIndex: 'attendance_type',
      width: 100,
      render: (t) => <Tag color={t === 'mass' ? 'blue' : 'purple'}>{TYPE_LABELS[t] || t}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 110,
      render: (s) => <Tag color={statusTagColor(s)}>{statusLabel(s)}</Tag>,
    },
    {
      title: 'Ngày điểm danh',
      dataIndex: 'attendance_date',
      width: 120,
      render: (d) => {
        const dow = d ? dayjs(d).day() : 0;
        return (
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {DAY_LABELS[dow]}
            </Text>
            <Text>{d ? dayjs(d).format('DD/MM/YYYY') : '-'}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Giờ vào',
      dataIndex: 'check_in_time',
      width: 80,
      render: (t) => (t ? String(t).slice(0, 5) : '-'),
    },
    {
      title: 'Người điểm danh',
      key: 'attendant',
      width: 160,
      render: (_, r) => {
        const name = r.d2_attendant_name || r.recorder_name;
        const phone = r.d2_attendant_phone || r.recorder_phone;
        if (!name) return <Text type="secondary">—</Text>;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            {phone && <div style={{ fontSize: 11, color: '#8c8c8c' }}>{phone}</div>}
          </div>
        );
      },
    },
    {
      title: 'Nguồn',
      key: 'source',
      width: 90,
      render: (_, r) =>
        r.d2_sync_id ? <Tag color="geekblue">D2</Tag> : <Tag>Hệ thống</Tag>,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: (n) => n || '—',
    },
    {
      title: 'Ghi nhận lúc',
      dataIndex: 'recorded_at',
      width: 130,
      render: (t) => (t ? dayjs(t).format('DD/MM/YYYY HH:mm') : '-'),
    },
  ];

  const tabItems = [
    { key: '1', label: <span><InfoCircleOutlined /> Thông tin điểm danh</span> },
    { key: '2', label: <span><HistoryOutlined /> Lịch sử điểm danh</span> },
  ];

  return (
    <div className="attendance-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Điểm Danh Học Viên
        </Title>
        <Space>
          {activeTab === '1' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: '#52c41a' }}
              onClick={openAddModal}
              disabled={!filters.class_id}
            />
          )}
          <Button
            icon={<SyncOutlined />}
            style={{ backgroundColor: '#1890ff', color: '#fff' }}
            onClick={() => (activeTab === '1' ? fetchRecords() : fetchHistory(historyPage))}
          />
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

      {activeTab === '1' ? (
        <>
          <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
            <Row gutter={[12, 12]}>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Niên học</Text>
                <Select
                  value={filters.academic_year_id}
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => {
                    const year = nienHocs.find((y) => y.id === val);
                    setFilters((prev) => ({
                      ...prev,
                      academic_year_id: val,
                      semester_id: year?.semesters?.[0]?.id ?? null,
                      block_id: 'all',
                      class_id: null,
                    }));
                  }}
                >
                  {nienHocs.map((y) => <Option key={y.id} value={y.id}>{y.name}</Option>)}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Học kỳ</Text>
                <Select
                  value={filters.semester_id}
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={!filters.academic_year_id}
                  onChange={(val) => setFilters((prev) => ({ ...prev, semester_id: val }))}
                >
                  {nienHocs.find((y) => y.id === filters.academic_year_id)?.semesters?.map((s) => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Khối</Text>
                <Select
                  value={filters.block_id}
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={!filters.academic_year_id}
                  onChange={(val) => setFilters((prev) => ({ ...prev, block_id: val, class_id: null }))}
                >
                  <Option value="all">Tất cả khối</Option>
                  {blocks.map((b) => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Lớp</Text>
                <Select
                  value={filters.class_id}
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={filters.block_id === 'all'}
                  placeholder={filters.block_id === 'all' ? 'Chọn khối trước' : '-- Chọn lớp --'}
                  onChange={(val) => setFilters((prev) => ({ ...prev, class_id: val }))}
                >
                  {classes.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Loại điểm danh</Text>
                <Select
                  value={filters.attendance_type}
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFilters((prev) => ({ ...prev, attendance_type: val }))}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="mass">Thánh lễ</Option>
                  <Option value="catechism">Giáo lý</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Tìm kiếm</Text>
                <Input
                  prefix={<SearchOutlined />}
                  style={{ marginTop: 4 }}
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  onPressEnter={fetchRecords}
                />
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Ngày điểm danh</Text>
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  format="DD/MM/YYYY"
                  value={filters.session_date}
                  onChange={(d) =>
                    setFilters((prev) => ({
                      ...prev,
                      session_date: d || dayjs(),
                      from: d || prev.from,
                    }))
                  }
                />
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Từ ngày (lọc DS)</Text>
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  format="DD/MM/YYYY"
                  value={filters.from}
                  onChange={(d) => setFilters((prev) => ({ ...prev, from: d }))}
                />
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Đến ngày (lọc DS)</Text>
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  format="DD/MM/YYYY"
                  value={filters.to}
                  onChange={(d) => setFilters((prev) => ({ ...prev, to: d }))}
                />
              </Col>
            </Row>
          </Card>

          {configStatus && !configStatus.is_configured && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Chưa cấu hình chuyên cần"
              description="Vào Cài đặt → tab Chuyên cần, chọn lớp và học kỳ, định nghĩa số buổi Thánh lễ / Giáo lý rồi Lưu."
            />
          )}

          {filters.attendance_type !== 'all' && filters.class_id && (
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  Điểm danh buổi: {TYPE_LABELS[filters.attendance_type]} —{' '}
                  {filters.session_date?.format('DD/MM/YYYY')}
                  {configStatus?.day_label && (
                    <Tag color={configStatus.is_date_enabled ? 'green' : 'red'}>{configStatus.day_label}</Tag>
                  )}
                </Space>
              }
              style={{ marginBottom: 16 }}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tl cần {configStatus?.mass_required ?? addModalConfig.mass_required} · Gl cần{' '}
                  {configStatus?.catechism_required ?? addModalConfig.catechism_required}
                </Text>
              }
            >
              {configStatus?.is_date_enabled === false && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Ngày ngoài lịch"
                  description="Vẫn lưu được vào CSDL; chỉ các buổi đúng lịch mới được cộng vào cột Tl/Gl."
                />
              )}
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="Thánh lễ và Giáo lý lưu riêng"
                description="Mỗi học viên, mỗi ngày có tối đa 2 bản ghi (mass + catechism). Lọc Loại = Giáo lý chỉ hiển thị bản ghi giáo lý; chọn Tất cả để xem cả hai."
              />
              <Table
                size="small"
                bordered
                rowKey="id"
                dataSource={sessionStudents}
                pagination={{ pageSize: 15 }}
                scroll={{ x: 900 }}
                columns={studentToggleColumns('session')}
              />
            </Card>
          )}

          <Card bodyStyle={{ padding: 0 }}>
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Text strong>Kết quả ({records.length})</Text>
            </div>
            <Table
              columns={columnsTab1}
              dataSource={records}
              rowKey="id"
              loading={loading}
              size="small"
              bordered
              pagination={{ pageSize: 20, showTotal: (t) => `Tổng: ${t}` }}
            />
          </Card>
        </>
      ) : (
        <>
          <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
            <Row gutter={[12, 12]} align="bottom">
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Niên học</Text>
                <Select
                  value={historyFilters.academic_year_id}
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => {
                    const year = nienHocs.find((y) => y.id === val);
                    setHistoryFilters((prev) => ({
                      ...prev,
                      academic_year_id: val,
                      semester_id: year?.semesters?.[0]?.id ?? null,
                      block_id: 'all',
                      class_id: null,
                    }));
                  }}
                >
                  {nienHocs.map((y) => (
                    <Option key={y.id} value={y.id}>{y.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Học kỳ</Text>
                <Select
                  value={historyFilters.semester_id}
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={!historyFilters.academic_year_id}
                  onChange={(val) => setHistoryFilters((prev) => ({ ...prev, semester_id: val }))}
                >
                  {nienHocs
                    .find((y) => y.id === historyFilters.academic_year_id)
                    ?.semesters?.map((s) => (
                      <Option key={s.id} value={s.id}>{s.name}</Option>
                    ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Khối</Text>
                <Select
                  value={historyFilters.block_id}
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={!historyFilters.academic_year_id}
                  onChange={(val) =>
                    setHistoryFilters((prev) => ({ ...prev, block_id: val, class_id: null }))
                  }
                >
                  <Option value="all">Tất cả khối</Option>
                  {historyBlocks.map((b) => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Lớp</Text>
                <Select
                  value={historyFilters.class_id}
                  style={{ width: '100%', marginTop: 4 }}
                  allowClear
                  disabled={historyFilters.block_id === 'all'}
                  placeholder={
                    historyFilters.block_id === 'all' ? 'Chọn khối trước' : 'Tất cả lớp'
                  }
                  onChange={(val) => setHistoryFilters((prev) => ({ ...prev, class_id: val ?? null }))}
                >
                  {historyClasses.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Loại điểm danh</Text>
                <Select
                  value={historyFilters.attendance_type}
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setHistoryFilters((prev) => ({ ...prev, attendance_type: val }))}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="mass">Thánh lễ</Option>
                  <Option value="catechism">Giáo lý</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Trạng thái</Text>
                <Select
                  value={historyFilters.status}
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setHistoryFilters((prev) => ({ ...prev, status: val }))}
                >
                  <Option value="all">Tất cả</Option>
                  {STATUS_OPTIONS.map((o) => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Tìm học viên</Text>
                <Input
                  prefix={<SearchOutlined />}
                  style={{ marginTop: 4 }}
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters((prev) => ({ ...prev, search: e.target.value }))}
                  onPressEnter={() => fetchHistory(1)}
                />
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Người điểm danh</Text>
                <Input
                  prefix={<TeamOutlined />}
                  placeholder="Tên / SĐT"
                  style={{ marginTop: 4 }}
                  value={historyFilters.attendant_search}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({ ...prev, attendant_search: e.target.value }))
                  }
                  onPressEnter={() => fetchHistory(1)}
                />
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Từ ngày</Text>
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  format="DD/MM/YYYY"
                  value={historyFilters.from}
                  onChange={(d) => setHistoryFilters((prev) => ({ ...prev, from: d }))}
                />
              </Col>
              <Col span={4}>
                <Text strong style={{ fontSize: 12 }}>Đến ngày</Text>
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  format="DD/MM/YYYY"
                  value={historyFilters.to}
                  onChange={(d) => setHistoryFilters((prev) => ({ ...prev, to: d }))}
                />
              </Col>
              <Col span={4}>
                <Button type="primary" block style={{ marginTop: 22 }} onClick={() => fetchHistory(1)}>
                  Áp dụng lọc
                </Button>
              </Col>
            </Row>
          </Card>
          <Card bodyStyle={{ padding: 0 }}>
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Text strong>Lịch sử điểm danh ({historyTotal})</Text>
            </div>
            <Table
              columns={columnsHistory}
              dataSource={historyRecords}
              rowKey="id"
              loading={historyLoading}
              size="small"
              bordered
              scroll={{ x: 1400 }}
              pagination={{
                current: historyPage,
                pageSize: historyPageSize,
                total: historyTotal,
                showTotal: (t) => `Tổng: ${t}`,
                onChange: (page) => fetchHistory(page),
              }}
            />
          </Card>
        </>
      )}

      <Modal
        title="Chọn học viên điểm danh"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        width={1000}
        footer={null}
      >
        <Row gutter={12} style={{ marginBottom: 8 }}>
          <Col span={6}>
            <Text strong style={{ fontSize: 12 }}>Loại</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={addForm.attendance_type}
              onChange={(v) => setAddForm((p) => ({ ...p, attendance_type: v }))}
            >
              <Option value="mass">Thánh lễ</Option>
              <Option value="catechism">Giáo lý</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Text strong style={{ fontSize: 12 }}>Ngày</Text>
            <DatePicker
              style={{ width: '100%', marginTop: 4 }}
              value={addForm.attendance_date}
              onChange={(d) => setAddForm((p) => ({ ...p, attendance_date: d || dayjs() }))}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col span={6}>
            <Text strong style={{ fontSize: 12 }}>Trạng thái</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={addForm.status}
              onChange={(v) => setAddForm((p) => ({ ...p, status: v }))}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col span={6}>
            <Text strong style={{ fontSize: 12 }}>Tìm</Text>
            <Input
              style={{ marginTop: 4 }}
              value={addModalSearch}
              onChange={(e) => setAddModalSearch(e.target.value)}
              onPressEnter={() => fetchEligibleStudents(addModalSearch)}
            />
          </Col>
        </Row>
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6ffed', borderRadius: 6, fontSize: 12 }}>
          <Text type="secondary">
            Buổi cần trong học kỳ: Thánh lễ <strong>{addModalConfig.mass_required}</strong>, Giáo lý{' '}
            <strong>{addModalConfig.catechism_required}</strong>.
            Chỉ trạng thái <strong>Hiện diện</strong> / <strong>Đi muộn</strong> được cộng vào Tl/Gl (theo cấu hình ngày).
            Điểm chuyên cần tự tính khi xem tab Điểm số → Chuyên cần.
          </Text>
        </div>
        <Table
          size="small"
          bordered
          rowKey="id"
          dataSource={eligibleStudents}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 900 }}
          columns={studentToggleColumns('modal')}
        />
      </Modal>
    </div>
  );
};

export default Attendance;
