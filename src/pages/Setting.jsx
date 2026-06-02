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
  Typography,
  Tooltip,
  Tabs,
  Tag,
  Form,
  DatePicker,
  Checkbox,
  Divider,
  List,
  Avatar,
  InputNumber,
  TimePicker,
  Modal,
  message,
  Popconfirm,
  Dropdown,
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined,
  CalendarOutlined,
  EditOutlined,
  CloseOutlined,
  CopyOutlined,
  CheckOutlined,
  FileTextOutlined,
  TeamOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  EnvironmentOutlined,
  UserOutlined,
  UserSwitchOutlined,
  HolderOutlined,
  DeleteOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Setting = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [selectedNienHoc, setSelectedNienHoc] = useState(null);
  const [selectedLophoc, setSelectedLophoc] = useState(null);
  const [selectedSourceLop, setSelectedSourceLop] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFilter, setPreviewFilter] = useState('all');
  const [formNienHoc] = Form.useForm();
  const [formLophoc] = Form.useForm();
  
  // Tab 3: Xếp lớp states
  const [filtersTab3, setFiltersTab3] = useState({
    source_academic_year_id: null,
    source_block_id: 'all',
    source_class_id: null,
    target_academic_year_id: null
  });
  const [sourceStudents, setSourceStudents] = useState([]);
  const [targetClasses, setTargetClasses] = useState([]);
  const [enrollmentChanges, setEnrollmentChanges] = useState({}); // { student_id: to_class_id }
  const [bulkTargetClass, setBulkTargetClass] = useState(null);
  const [isSavingXepLop, setIsSavingXepLop] = useState(false);

  const [nienHocs, setNienHocs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [scoreTypes, setScoreTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNienHoc, setIsAddingNienHoc] = useState(false);
  const [isAddingLophoc, setIsAddingLophoc] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [formBlock] = Form.useForm();

  const [filtersTab2, setFiltersTab2] = useState({
    academic_year_id: null,
    block_id: 'all'
  });

  const [filtersTab5, setFiltersTab5] = useState({
    academic_year_id: null,
    semester_id: null,
    block_id: 'all',
    class_id: null
  });

  const [filtersTab4, setFiltersTab4] = useState({
    academic_year_id: null,
    semester_id: null,
    block_id: 'all',
    class_id: null
  });

  const [attendanceData, setAttendanceData] = useState({
    mass: Array(7).fill({ is_enabled: false, start_time: null, end_time: null }),
    catechism: Array(7).fill({ is_enabled: false, start_time: null, end_time: null }),
    mass_required: 0,
    mass_allowed_absence: 0,
    catechism_required: 0,
    catechism_allowed_absence: 0,
    count_all_mass_days: false,
    disable_ethics_score: false
  });

  const [scoreConfigs, setScoreConfigs] = useState([]);
  const [availableScoreTypes, setAvailableScoreTypes] = useState([]);
  const [isClassScoreConfigured, setIsClassScoreConfigured] = useState(false);

  const [globalScoreSettings, setGlobalScoreSettings] = useState({
    academic_percentage: 60,
    diligence_percentage: 40,
    control_score: 2.5
  });

  const fetchNienHocs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/academic-years');
      if (response.data.success) {
        setNienHocs(response.data.data);
        // Set default filter if not set
        if (!filtersTab2.academic_year_id && response.data.data.length > 0) {
          const current = response.data.data.find(y => y.is_current) || response.data.data[0];
          setFiltersTab2(prev => ({ ...prev, academic_year_id: current.id }));
          
          // Set default for Tab 5
          setFiltersTab5(prev => ({ 
            ...prev, 
            academic_year_id: current.id,
            semester_id: current.semesters?.[0]?.id 
          }));

          // Set default for Tab 4
          setFiltersTab4(prev => ({ 
            ...prev, 
            academic_year_id: current.id,
            semester_id: current.semesters?.[0]?.id 
          }));

          // Set default for Tab 3
          setFiltersTab3(prev => ({
            ...prev,
            source_academic_year_id: current.id,
            target_academic_year_id: current.id
          }));
        }
      }
    } catch (error) {
      console.error('Fetch nien hocs error:', error);
      message.error('Không thể tải danh sách niên học');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async (academicYearId) => {
    try {
      const params = {};
      if (academicYearId) params.academic_year_id = academicYearId;
      const response = await api.get('/blocks', { params });
      if (response.data.success) {
        setBlocks(response.data.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách khối');
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/teachers');
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách giáo lý viên');
    }
  };

  const fetchScoreTypes = async () => {
    try {
      const response = await api.get('/score-types');
      if (response.data.success) {
        setScoreTypes(response.data.data);
      }
    } catch (error) {
      console.error('Fetch score types error:', error);
    }
  };

  const buildClassesParams = (academicYearId, blockId) => {
    const params = { academic_year_id: academicYearId };
    if (blockId && blockId !== 'all') params.block_id = blockId;
    return params;
  };

  const fetchClasses = async () => {
    if (!filtersTab2.academic_year_id) return;
    setLoading(true);
    try {
      const response = await api.get('/classes', {
        params: buildClassesParams(filtersTab2.academic_year_id, filtersTab2.block_id),
      });
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === '1') {
      fetchNienHocs();
    } else if (activeTab === '2') {
      fetchNienHocs();
      fetchTeachers();
    } else if (activeTab === '3') {
      fetchNienHocs();
    } else if (activeTab === '4') {
      fetchNienHocs();
    } else if (activeTab === '5') {
      fetchNienHocs();
      fetchScoreTypes();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === '2' && filtersTab2.academic_year_id) {
      fetchBlocks(filtersTab2.academic_year_id);
      fetchClasses();
    }
  }, [filtersTab2.academic_year_id, filtersTab2.block_id, activeTab]);

  useEffect(() => {
    if (activeTab === '3' && filtersTab3.source_academic_year_id) {
      fetchBlocks(filtersTab3.source_academic_year_id);
    }
  }, [filtersTab3.source_academic_year_id, activeTab]);

  useEffect(() => {
    if (activeTab === '4' && filtersTab4.academic_year_id) {
      fetchBlocks(filtersTab4.academic_year_id);
    }
  }, [filtersTab4.academic_year_id, activeTab]);

  useEffect(() => {
    if (activeTab === '5' && filtersTab5.academic_year_id) {
      fetchBlocks(filtersTab5.academic_year_id);
    }
  }, [filtersTab5.academic_year_id, activeTab]);

  useEffect(() => {
    if (activeTab === '3') {
      fetchSourceClasses();
    }
  }, [filtersTab3.source_academic_year_id, filtersTab3.source_block_id, activeTab]);

  useEffect(() => {
    if (activeTab === '3') {
      fetchTargetClasses();
    }
  }, [filtersTab3.target_academic_year_id, activeTab]);

  useEffect(() => {
    if (activeTab === '3' && filtersTab3.source_class_id) {
      fetchSourceStudents();
    }
  }, [filtersTab3.source_class_id, activeTab]);

  useEffect(() => {
    if (activeTab === '4') {
      fetchClassesTab4();
    }
  }, [filtersTab4.academic_year_id, filtersTab4.block_id, activeTab]);

  useEffect(() => {
    if (activeTab === '4' && filtersTab4.class_id && filtersTab4.semester_id) {
      fetchAttendanceConfigs();
    }
  }, [filtersTab4.class_id, filtersTab4.semester_id, activeTab]);

  const fetchClassesTab4 = async () => {
    if (!filtersTab4.academic_year_id || activeTab !== '4') return;
    if (filtersTab4.block_id === 'all') {
      setClasses([]);
      setFiltersTab4((prev) => ({ ...prev, class_id: null }));
      return;
    }
    try {
      const response = await api.get('/classes', {
        params: buildClassesParams(filtersTab4.academic_year_id, filtersTab4.block_id),
      });
      if (response.data.success) {
        const list = response.data.data;
        setClasses(list);
        setFiltersTab4((prev) => {
          if (list.some((c) => c.id === prev.class_id)) return prev;
          return { ...prev, class_id: list[0]?.id ?? null };
        });
      }
    } catch (error) {
      message.error('Không thể tải danh sách lớp học');
    }
  };

  const fetchSourceClasses = async () => {
    if (!filtersTab3.source_academic_year_id) return;
    if (filtersTab3.source_block_id === 'all') {
      setClasses([]);
      setFiltersTab3((prev) => ({ ...prev, source_class_id: null }));
      return;
    }
    try {
      const response = await api.get('/classes', {
        params: buildClassesParams(
          filtersTab3.source_academic_year_id,
          filtersTab3.source_block_id
        ),
      });
      if (response.data.success) {
        const list = response.data.data;
        setClasses(list);
        setFiltersTab3((prev) => {
          if (list.some((c) => c.id === prev.source_class_id)) return prev;
          return { ...prev, source_class_id: list[0]?.id ?? null };
        });
      }
    } catch (error) {
      message.error('Không thể tải danh sách lớp nguồn');
    }
  };

  const fetchTargetClasses = async () => {
    if (!filtersTab3.target_academic_year_id) return;
    try {
      const response = await api.get('/classes', {
        params: buildClassesParams(filtersTab3.target_academic_year_id, 'all'),
      });
      if (response.data.success) {
        setTargetClasses(response.data.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách lớp đích');
    }
  };

  const fetchSourceStudents = async () => {
    if (!filtersTab3.source_class_id) return;
    setLoading(true);
    try {
      const response = await api.get('/enrollments', { 
        params: { 
          academic_year_id: filtersTab3.source_academic_year_id,
          class_id: filtersTab3.source_class_id 
        } 
      });
      if (response.data.success) {
        setSourceStudents(response.data.data);
        // Reset enrollment changes when source class changes
        setEnrollmentChanges({});
      }
    } catch (error) {
      message.error('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBulkClass = () => {
    if (!bulkTargetClass) {
      message.warning('Vui lòng chọn lớp đích trước khi áp dụng');
      return;
    }
    const newChanges = { ...enrollmentChanges };
    sourceStudents.forEach(student => {
      newChanges[student.id] = bulkTargetClass;
    });
    setEnrollmentChanges(newChanges);
    message.success(`Đã áp dụng lớp mới cho ${sourceStudents.length} học viên`);
  };

  const handleSaveXepLop = async () => {
    const changedStudentIds = Object.keys(enrollmentChanges);
    if (changedStudentIds.length === 0) {
      message.warning('Chưa có thay đổi nào để lưu');
      return;
    }

    setIsSavingXepLop(true);
    try {
      const enrollments = changedStudentIds.map(studentId => {
        const student = sourceStudents.find(s => s.id === studentId);
        return {
          student_id: studentId,
          to_class_id: enrollmentChanges[studentId],
          from_class_id: student.current_class_id,
          from_academic_year_id: student.current_academic_year_id
        };
      });

      const response = await api.post('/enrollments/bulk', {
        enrollments,
        target_academic_year_id: filtersTab3.target_academic_year_id
      });

      if (response.data.success) {
        message.success('Cập nhật xếp lớp thành công');
        setEnrollmentChanges({});
        fetchSourceStudents(); // Refresh data
      }
    } catch (error) {
      console.error('Save xep lop error:', error);
      message.error('Lỗi khi lưu thông tin xếp lớp');
    } finally {
      setIsSavingXepLop(false);
    }
  };

  const columnsXepLop = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Mã HV',
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
      title: 'Họ và Tên',
      key: 'full_name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Lớp hiện tại',
      dataIndex: 'current_class_name',
      key: 'current_class_name',
      render: (text) => <Tag color="blue">{text || 'N/A'}</Tag>
    },
    {
      title: 'Lớp xếp vào',
      key: 'target_class',
      render: (_, record) => (
        <Select
          placeholder="-- Chọn lớp --"
          style={{ width: '100%' }}
          value={enrollmentChanges[record.id] || null}
          onChange={(val) => setEnrollmentChanges(prev => ({ ...prev, [record.id]: val }))}
          allowClear
        >
          {targetClasses.map(c => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>
      )
    }
  ];

  const columnsPreviewXepLop = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Học viên',
      key: 'student',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: '500' }}>{record.saint_name} {record.first_name} {record.last_name}</div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.code}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Lớp cũ',
      dataIndex: 'current_class_name',
      key: 'current_class_name',
    },
    {
      title: 'Lớp mới',
      key: 'new_class',
      render: (_, record) => {
        const targetClassId = enrollmentChanges[record.id];
        const targetClass = targetClasses.find(c => c.id === targetClassId);
        return targetClass ? <Tag color="green">{targetClass.name}</Tag> : <Tag color="orange">Chưa chọn</Tag>;
      }
    }
  ];

  const assignedCount = sourceStudents.filter(s => enrollmentChanges[s.id]).length;
  const unassignedCount = sourceStudents.length - assignedCount;

  const fetchAttendanceConfigs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance-configs', { 
        params: { 
          class_id: filtersTab4.class_id, 
          semester_id: filtersTab4.semester_id 
        } 
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const configs = response.data.data;
        
        // Initialize empty arrays for 7 days
        const massArray = Array(7).fill(null).map(() => ({ is_enabled: false, start_time: null, end_time: null }));
        const catechismArray = Array(7).fill(null).map(() => ({ is_enabled: false, start_time: null, end_time: null }));
        
        let mass_required = 0;
        let mass_allowed_absence = 0;
        let catechism_required = 0;
        let catechism_allowed_absence = 0;
        let count_all_mass_days = false;
        let disable_ethics_score = false;

        configs.forEach(c => {
          const timeFormat = 'HH:mm:ss';
          const dayConfig = {
            is_enabled: c.is_enabled === 1,
            start_time: c.start_time ? dayjs(c.start_time, timeFormat) : null,
            end_time: c.end_time ? dayjs(c.end_time, timeFormat) : null
          };

          if (c.config_type === 'mass') {
            massArray[c.day_of_week] = dayConfig;
            mass_required = c.required_count;
            mass_allowed_absence = c.allowed_absence;
          } else if (c.config_type === 'catechism') {
            catechismArray[c.day_of_week] = dayConfig;
            catechism_required = c.required_count;
            catechism_allowed_absence = c.allowed_absence;
          }
          
          // These are global per class/semester, so we can take from any record
          count_all_mass_days = c.count_all_mass_days === 1;
          disable_ethics_score = c.disable_ethics_score === 1;
        });

        setAttendanceData({
          mass: massArray,
          catechism: catechismArray,
          mass_required,
          mass_allowed_absence,
          catechism_required,
          catechism_allowed_absence,
          count_all_mass_days,
          disable_ethics_score
        });
      } else {
        // Reset to default if no config found
        setAttendanceData({
          mass: Array(7).fill(null).map(() => ({ is_enabled: false, start_time: null, end_time: null })),
          catechism: Array(7).fill(null).map(() => ({ is_enabled: false, start_time: null, end_time: null })),
          mass_required: 0,
          mass_allowed_absence: 0,
          catechism_required: 0,
          catechism_allowed_absence: 0,
          count_all_mass_days: false,
          disable_ethics_score: false
        });
      }
    } catch (error) {
      console.error('Fetch attendance configs error:', error);
      message.error('Không thể tải cấu hình chuyên cần');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendanceConfigs = async () => {
    if (!filtersTab4.class_id || !filtersTab4.semester_id) {
      return message.warning('Vui lòng chọn lớp và học kỳ');
    }

    setLoading(true);
    try {
      const configs = [];
      const timeFormat = 'HH:mm:ss';
      
      // Prepare mass configs
      attendanceData.mass.forEach((day, index) => {
        configs.push({
          config_type: 'mass',
          day_of_week: index,
          is_enabled: day.is_enabled,
          start_time: day.start_time ? day.start_time.format(timeFormat) : null,
          end_time: day.end_time ? day.end_time.format(timeFormat) : null,
          required_count: attendanceData.mass_required,
          allowed_absence: attendanceData.mass_allowed_absence
        });
      });

      // Prepare catechism configs
      attendanceData.catechism.forEach((day, index) => {
        configs.push({
          config_type: 'catechism',
          day_of_week: index,
          is_enabled: day.is_enabled,
          start_time: day.start_time ? day.start_time.format(timeFormat) : null,
          end_time: day.end_time ? day.end_time.format(timeFormat) : null,
          required_count: attendanceData.catechism_required,
          allowed_absence: attendanceData.catechism_allowed_absence
        });
      });

      const payload = {
        class_id: filtersTab4.class_id,
        semester_id: filtersTab4.semester_id,
        configs,
        global_settings: {
          count_all_mass_days: attendanceData.count_all_mass_days,
          disable_ethics_score: attendanceData.disable_ethics_score
        }
      };

      await api.post('/attendance-configs/bulk', payload);
      message.success('Lưu cấu hình chuyên cần thành công');
      fetchAttendanceConfigs(); // Refresh data
    } catch (error) {
      console.error('Save attendance configs error:', error);
      message.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình chuyên cần');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === '5') {
      fetchClassesTab5();
    }
  }, [filtersTab5.academic_year_id, filtersTab5.block_id, activeTab]);

  useEffect(() => {
    if (activeTab === '5' && filtersTab5.class_id && filtersTab5.semester_id) {
      fetchScoreConfigs();
    }
  }, [filtersTab5.class_id, filtersTab5.semester_id, activeTab]);

  const fetchClassesTab5 = async () => {
    if (!filtersTab5.academic_year_id || activeTab !== '5') return;
    if (filtersTab5.block_id === 'all') {
      setClasses([]);
      setFiltersTab5((prev) => ({ ...prev, class_id: null }));
      return;
    }
    try {
      const response = await api.get('/classes', {
        params: buildClassesParams(filtersTab5.academic_year_id, filtersTab5.block_id),
      });
      if (response.data.success) {
        const list = response.data.data;
        setClasses(list);
        setFiltersTab5((prev) => {
          if (list.some((c) => c.id === prev.class_id)) return prev;
          return { ...prev, class_id: list[0]?.id ?? null };
        });
      }
    } catch (error) {
      message.error('Không thể tải danh sách lớp học');
    }
  };

  const fetchScoreConfigs = async () => {
    if (!filtersTab5.class_id || !filtersTab5.semester_id) return;
    try {
      const response = await api.get('/score-configs', {
        params: {
          class_id: filtersTab5.class_id,
          semester_id: filtersTab5.semester_id,
        },
      });
      if (response.data.success) {
        const payload = response.data.data;
        const configs = payload.configs || payload;
        setScoreConfigs(Array.isArray(configs) ? configs : []);
        setAvailableScoreTypes(payload.available_types || []);
        setIsClassScoreConfigured(Boolean(payload.is_class_configured));
        if (payload.global_settings) {
          setGlobalScoreSettings(payload.global_settings);
        }
      }
    } catch (error) {
      console.error('Fetch score configs error:', error);
      message.error('Không tải được cấu hình điểm');
    }
  };

  const handleRemoveScoreColumn = (scoreTypeId) => {
    const removed = scoreConfigs.find((c) => c.score_type_id === scoreTypeId);
    setScoreConfigs((prev) => prev.filter((c) => c.score_type_id !== scoreTypeId));
    if (removed) {
      setAvailableScoreTypes((prev) => [
        ...prev,
        {
          id: removed.score_type_id,
          name: removed.score_type_name,
          code: removed.score_type_code,
        },
      ].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    }
  };

  const handleAddScoreColumn = (type) => {
    if (!type?.id) return;
    setScoreConfigs((prev) => [
      ...prev,
      {
        score_type_id: type.id,
        score_type_name: type.name,
        score_type_code: type.code,
        column_count: 1,
        weight_factor:
          type.code === 'THI' ? 3 : type.code === '45PH' || type.code === 'KK' ? 2 : 1,
        is_active: true,
        is_default_template: false,
      },
    ]);
    setAvailableScoreTypes((prev) => prev.filter((t) => t.id !== type.id));
  };

  const handleSaveScoreConfigs = async () => {
    if (!filtersTab5.class_id || !filtersTab5.semester_id) {
      return message.warning('Vui lòng chọn lớp và học kỳ');
    }

    setLoading(true);
    try {
      const payload = {
        class_id: filtersTab5.class_id,
        semester_id: filtersTab5.semester_id,
        configs: scoreConfigs.map((c) => ({
          score_type_id: c.score_type_id,
          column_count: c.column_count,
          weight_factor: c.weight_factor,
          is_active: c.is_active !== false,
        })),
        global_settings: globalScoreSettings,
      };

      await api.post('/score-configs/bulk', payload);
      await fetchScoreConfigs();
      message.success('Lưu cấu hình điểm thành công');
    } catch (error) {
      message.error('Lỗi khi lưu cấu hình điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLophoc = async () => {
    try {
      const values = await formLophoc.validateFields();
      const payload = {
        ...values,
        academic_year_id: filtersTab2.academic_year_id,
        teacher_ids: values.teacher_ids || []
      };

      if (isAddingLophoc) {
        await api.post('/classes', payload);
        message.success('Thêm lớp học mới thành công');
      } else {
        await api.put(`/classes/${selectedLophoc.id}`, payload);
        message.success('Cập nhật lớp học thành công');
      }

      setIsAddingLophoc(false);
      setSelectedLophoc(null);
      fetchClasses();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu lớp học');
    }
  };

  const handleDeleteLophoc = async (id) => {
    try {
      await api.delete(`/classes/${id}`);
      message.success('Đã xóa lớp học');
      setSelectedLophoc(null);
      fetchClasses();
    } catch (error) {
      message.error('Lỗi khi xóa lớp học');
    }
  };

  const tab2YearName = nienHocs.find((y) => y.id === filtersTab2.academic_year_id)?.name || '';

  const openAddBlockModal = () => {
    if (!filtersTab2.academic_year_id) {
      message.warning('Vui lòng chọn niên học trước');
      return;
    }
    setEditingBlock(null);
    formBlock.resetFields();
    setBlockModalOpen(true);
  };

  const openEditBlockModal = (block) => {
    setEditingBlock(block);
    formBlock.setFieldsValue({ name: block.name, code: block.code });
    setBlockModalOpen(true);
  };

  const handleSaveBlock = async () => {
    try {
      const values = await formBlock.validateFields();
      if (!filtersTab2.academic_year_id) {
        message.warning('Vui lòng chọn niên học');
        return;
      }
      setLoading(true);
      if (editingBlock?.id) {
        await api.put(`/blocks/${editingBlock.id}`, values);
        message.success('Cập nhật khối thành công');
      } else {
        await api.post('/blocks', {
          ...values,
          academic_year_id: filtersTab2.academic_year_id,
        });
        message.success('Thêm khối thành công');
      }
      setBlockModalOpen(false);
      setEditingBlock(null);
      await fetchBlocks(filtersTab2.academic_year_id);
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu khối');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlock = async (id) => {
    try {
      await api.delete(`/blocks/${id}`);
      message.success('Đã xóa khối');
      if (filtersTab2.block_id === id) {
        setFiltersTab2((prev) => ({ ...prev, block_id: 'all' }));
      }
      await fetchBlocks(filtersTab2.academic_year_id);
      fetchClasses();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể xóa khối');
    }
  };

  const handleActivateNienHoc = async (id) => {
    try {
      const response = await api.patch(`/academic-years/${id}/activate`);
      if (response.data.success) {
        message.success('Đã kích hoạt niên học hiện tại');
        fetchNienHocs();
      }
    } catch (error) {
      message.error('Lỗi khi kích hoạt niên học');
    }
  };

  const handleDeleteNienHoc = async (id) => {
    try {
      const response = await api.delete(`/academic-years/${id}`);
      if (response.data.success) {
        message.success('Đã xóa niên học');
        setSelectedNienHoc(null);
        fetchNienHocs();
      }
    } catch (error) {
      message.error('Lỗi khi xóa niên học');
    }
  };

  const handleSaveNienHoc = async () => {
    try {
      const values = await formNienHoc.validateFields();
      const payload = {
        name: values.name,
        note: values.note,
        semesters: [
          {
            id: selectedNienHoc?.semesters?.[0]?.id,
            name: 'Học kỳ I',
            semester_number: 1,
            start_date: values.hk1_start.format('YYYY-MM-DD'),
            end_date: values.hk1_end.format('YYYY-MM-DD'),
          },
          {
            id: selectedNienHoc?.semesters?.[1]?.id,
            name: 'Học kỳ II',
            semester_number: 2,
            start_date: values.hk2_start.format('YYYY-MM-DD'),
            end_date: values.hk2_end.format('YYYY-MM-DD'),
          }
        ]
      };

      if (isAddingNienHoc) {
        await api.post('/academic-years', payload);
        message.success('Thêm niên học mới thành công');
      } else {
        await api.put(`/academic-years/${selectedNienHoc.id}`, payload);
        message.success('Cập nhật niên học thành công');
      }
      
      setIsAddingNienHoc(false);
      setSelectedNienHoc(null);
      fetchNienHocs();
    } catch (error) {
      console.error('Save error:', error);
      message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
    }
  };

  // --- Data cho Niên học (Tab 1) ---
  const columnsNienHoc = [
    { 
      title: 'STT', 
      key: 'stt', 
      width: 60, 
      align: 'center',
      render: (_, __, index) => index + 1
    },
    { title: 'Tên niên học', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { 
      title: 'Học kỳ I', 
      key: 'hk1', 
      render: (_, record) => {
        const hk = record.semesters?.find(s => s.semester_number === 1);
        return hk ? <div style={{ fontSize: '14px' }}>{dayjs(hk.start_date).format('DD/MM/YYYY')} - {dayjs(hk.end_date).format('DD/MM/YYYY')}</div> : '-';
      }
    },
    { 
      title: 'Học kỳ II', 
      key: 'hk2', 
      render: (_, record) => {
        const hk = record.semesters?.find(s => s.semester_number === 2);
        return hk ? <div style={{ fontSize: '14px' }}>{dayjs(hk.start_date).format('DD/MM/YYYY')} - {dayjs(hk.end_date).format('DD/MM/YYYY')}</div> : '-';
      }
    },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'is_current', 
      key: 'is_current', 
      render: (isCurrent, record) => (
        <Space>
          {isCurrent ? (
            <Tag icon={<CheckOutlined />} color="success">Hiện tại</Tag>
          ) : (
            <Tooltip title="Kích hoạt làm niên học hiện tại">
              <Button 
                type="text" 
                icon={<StarOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivateNienHoc(record.id);
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Popconfirm title="Xóa niên học này?" onConfirm={() => handleDeleteNienHoc(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // --- Data cho Lớp học (Tab 2) ---
  const dataLophoc = [
    {
      key: '1',
      name: 'Matta - Chiên 1',
      khoi: 'Chiên Con',
      phong: 'C5',
      glv_chunhiem: 'Anna Nguyễn Hương Ly',
      glvs: ['Anna Nguyễn Hương Ly'],
    },
    {
      key: '2',
      name: 'Tôma - Chiên 1',
      khoi: 'Chiên Con',
      phong: 'Nhà thờ Soi Chiễn',
      glv_chunhiem: 'Phêrô Nguyễn Văn Hào',
      glvs: ['Phêrô Nguyễn Văn Hào', 'Maria Nguyễn Thị Thành'],
    },
    {
      key: '3',
      name: 'Anna - Chiên 2',
      khoi: 'Chiên Con',
      phong: 'C6',
      glv_chunhiem: 'Đaminh Lê Văn Bình',
      glvs: ['Đaminh Lê Văn Bình'],
    },
  ];

  // --- Data cho Cấu hình điểm (Tab 5) ---
  const scoreColumns = [
    {
      title: '',
      key: 'remove',
      width: 44,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Bỏ cột điểm này khỏi lớp">
          <Button
            type="text"
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleRemoveScoreColumn(record.score_type_id)}
          />
        </Tooltip>
      ),
    },
    {
      title: <Text strong style={{ color: '#cf1322' }}>Cột điểm</Text>,
      dataIndex: 'score_type_name',
      key: 'score_type_name',
      width: '28%',
      render: (name, record) => (
        <Space size={4}>
          <Text>{name}</Text>
          {record.is_default_template && !isClassScoreConfigured && (
            <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
              Mặc định
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: <Text strong>Số cột điểm</Text>,
      dataIndex: 'column_count',
      key: 'column_count',
      width: '35%',
      render: (val, record, index) => (
        <InputNumber 
          min={0} 
          value={val} 
          style={{ width: '100%' }} 
          onChange={(newVal) => {
            const newConfigs = [...scoreConfigs];
            newConfigs[index].column_count = newVal;
            setScoreConfigs(newConfigs);
          }}
        />
      ),
    },
    {
      title: <Text strong>Hệ số tính</Text>,
      dataIndex: 'weight_factor',
      key: 'weight_factor',
      width: '35%',
      render: (val, record, index) => (
        <InputNumber 
          min={0} 
          step={0.1}
          value={val} 
          style={{ width: '100%' }} 
          onChange={(newVal) => {
            const newConfigs = [...scoreConfigs];
            newConfigs[index].weight_factor = newVal;
            setScoreConfigs(newConfigs);
          }}
        />
      ),
    },
  ];


  // --- Data cho Chuyên cần (Tab 4) ---
  const daysOfWeek = [
    { label: 'Chủ Nhật', color: '#ff4d4f' },
    { label: 'Thứ Hai', color: '#595959' },
    { label: 'Thứ Ba', color: '#595959' },
    { label: 'Thứ Tư', color: '#595959' },
    { label: 'Thứ Năm', color: '#1890ff' },
    { label: 'Thứ Sáu', color: '#595959' },
    { label: 'Thứ Bảy', color: '#595959' },
  ];

  const handleNienHocRowClick = (record) => {
    setIsAddingNienHoc(false);
    setSelectedNienHoc(record);
    const hk1 = record.semesters?.find(s => s.semester_number === 1);
    const hk2 = record.semesters?.find(s => s.semester_number === 2);
    
    formNienHoc.setFieldsValue({
      name: record.name,
      note: record.note,
      hk1_start: hk1 ? dayjs(hk1.start_date) : null,
      hk1_end: hk1 ? dayjs(hk1.end_date) : null,
      hk2_start: hk2 ? dayjs(hk2.start_date) : null,
      hk2_end: hk2 ? dayjs(hk2.end_date) : null,
    });
  };

  const handleLophocItemClick = (lop) => {
    setSelectedLophoc(lop);
    formLophoc.setFieldsValue({
      name: lop.name,
      khoi: lop.khoi,
      phong: lop.phong,
      chunhiem: lop.glv_chunhiem,
      glv1: lop.glvs[0] || '',
      glv2: lop.glvs[1] || '',
      glv3: lop.glvs[2] || '',
      note: '',
    });
  };

  return (
    <div className="setting-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SettingOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          Cài đặt Hệ thống
        </Title>
        <Space>
          {activeTab !== '5' && activeTab !== '4' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              if (activeTab === '1') { 
                setIsAddingNienHoc(true);
                setSelectedNienHoc({}); 
                formNienHoc.resetFields(); 
              }
              else if (activeTab === '2') { 
                setIsAddingLophoc(true);
                setSelectedLophoc({}); 
                formLophoc.resetFields(); 
              }
            }} />
          )}
          <Button 
            icon={<SaveOutlined />} 
            style={{ backgroundColor: '#52c41a', color: '#fff' }}
            onClick={() => {
              if (activeTab === '1') handleSaveNienHoc();
              else if (activeTab === '2') handleSaveLophoc();
              else if (activeTab === '3') handleSaveXepLop();
              else if (activeTab === '4') handleSaveAttendanceConfigs();
              else if (activeTab === '5') handleSaveScoreConfigs();
            }}
          >
            Lưu
          </Button>
          {activeTab === '2' && selectedLophoc?.id && (
            <Popconfirm title="Xóa lớp học này?" onConfirm={() => handleDeleteLophoc(selectedLophoc.id)}>
              <Button danger icon={<DeleteOutlined />} style={{ backgroundColor: '#ff4d4f', color: '#fff' }}>Xóa</Button>
            </Popconfirm>
          )}
          <Button icon={<SyncOutlined />} style={{ backgroundColor: '#1890ff', color: '#fff' }} onClick={() => {
            if (activeTab === '1') fetchNienHocs();
            else if (activeTab === '2') fetchClasses();
            else if (activeTab === '3') {
              fetchSourceClasses();
              fetchTargetClasses();
              fetchSourceStudents();
            }
            else if (activeTab === '4') fetchAttendanceConfigs();
            else if (activeTab === '5') fetchScoreConfigs();
          }} />
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={[
          { key: '1', label: <span><CalendarOutlined /> 1. Niên học mới</span> },
          { key: '2', label: <span><TeamOutlined /> 2. Tên lớp mới</span> },
          { key: '3', label: <span><UserSwitchOutlined /> 3. Xếp lớp/ chuyển lớp</span> },
          { key: '4', label: <span><CheckCircleOutlined /> 4. Chuyên cần</span> },
          { key: '5', label: <span><LineChartOutlined /> 5. Học lực</span> },
        ]} 
        style={{ marginBottom: 16 }} 
      />

      {/* Tab 1: Niên học mới */}
      {activeTab === '1' && (
        <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden' }}>
          <div style={{ flex: selectedNienHoc ? '0 0 65%' : '0 0 100%', transition: 'all 0.3s ease-in-out', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Card title={<Space><CalendarOutlined /><span>Danh sách niên học</span><Tag color="blue">{nienHocs.length} niên học</Tag></Space>} bodyStyle={{ padding: 0 }}>
              <Table
                columns={columnsNienHoc}
                dataSource={nienHocs}
                rowKey="id"
                pagination={false}
                bordered
                size="small"
                loading={loading}
                onRow={(record) => ({
                  onClick: () => handleNienHocRowClick(record),
                  style: { cursor: 'pointer' },
                  className: selectedNienHoc?.id === record.id ? 'ant-table-row-selected' : '',
                })}
              />
            </Card>
            <Card style={{ marginTop: 16, backgroundColor: '#fffbe6', borderLeft: '4px solid #faad14' }} bodyStyle={{ padding: '12px 16px' }}>
              <Title level={5} style={{ color: '#d48806', marginBottom: 8 }}><InfoCircleOutlined /> Lưu ý:</Title>
              <ul style={{ paddingLeft: 20, fontSize: '13px', color: 'rgba(0, 0, 0, 0.65)', lineHeight: '1.8' }}>
                <li>Tạo niên học mới sẽ tự động tạo 2 học kỳ: "Học kỳ I" và "Học kỳ II".</li>
                <li><strong>Kích hoạt:</strong> Nhấn icon ngôi sao để chọn niên học làm niên học hiện tại của hệ thống.</li>
                <li><strong>Chỉnh sửa:</strong> Click vào hàng trong bảng để tải dữ liệu lên form bên phải.</li>
              </ul>
            </Card>
          </div>
          {selectedNienHoc && (
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    {isAddingNienHoc ? <PlusOutlined /> : <EditOutlined />}
                    <span>{isAddingNienHoc ? 'Thêm mới niên học' : 'Chỉnh sửa niên học'}</span>
                  </Space>
                  <Button type="text" icon={<CloseOutlined />} onClick={() => { setSelectedNienHoc(null); setIsAddingNienHoc(false); }} />
                </div>
              } 
              style={{ flex: '0 0 35%', overflowY: 'auto' }} 
              bodyStyle={{ padding: '16px' }}
            >
              <Form form={formNienHoc} layout="vertical" size="small">
                <Form.Item 
                  label={<Space><CalendarOutlined /> Tên niên học <span style={{ color: 'red' }}>*</span></Space>} 
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên niên học' }]}
                >
                  <Input placeholder="VD: 2025-2026" />
                </Form.Item>
                <Form.Item label={<Space><FileTextOutlined /> Ghi chú</Space>} name="note">
                  <Input placeholder="Nhập ghi chú (tùy chọn)" />
                </Form.Item>
                
                <Title level={5} style={{ marginTop: 16 }}><CalendarOutlined /> Thông tin học kỳ</Title>
                
                <div style={{ padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '8px', marginBottom: 12, border: '1px solid #adc6ff' }}>
                  <Title level={5} style={{ color: '#1d39c4', fontSize: '14px', marginBottom: 12 }}><CalendarOutlined /> Học kỳ I</Title>
                  <Form.Item label="Ngày bắt đầu *" name="hk1_start" rules={[{ required: true }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="Ngày kết thúc *" name="hk1_end" rules={[{ required: true }]} style={{ marginBottom: 0 }}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: '8px', marginBottom: 12, border: '1px solid #b7eb8f' }}>
                  <Title level={5} style={{ color: '#389e0d', fontSize: '14px', marginBottom: 12 }}><CalendarOutlined /> Học kỳ II</Title>
                  <Form.Item label="Ngày bắt đầu *" name="hk2_start" rules={[{ required: true }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="Ngày kết thúc *" name="hk2_end" rules={[{ required: true }]} style={{ marginBottom: 0 }}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
                </div>

                <Button type="primary" block icon={<SaveOutlined />} onClick={handleSaveNienHoc} loading={loading}>
                  {isAddingNienHoc ? 'Thêm mới' : 'Cập nhật'}
                </Button>
              </Form>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Tên lớp mới */}
      {activeTab === '2' && (
        <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden', flexDirection: 'column' }}>
          <Card bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong style={{ fontSize: '12px' }}>Niên học</Text>
                <Select 
                  value={filtersTab2.academic_year_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFiltersTab2((prev) => ({ ...prev, academic_year_id: val, block_id: 'all' }))}
                >
                  {nienHocs.map(y => <Option key={y.id} value={y.id}>{y.name}</Option>)}
                </Select>
              </Col>
              <Col span={12}>
                <Text strong style={{ fontSize: '12px' }}>Khối</Text>
                <Select 
                  value={filtersTab2.block_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFiltersTab2(prev => ({ ...prev, block_id: val }))}
                >
                  <Option value="all">Tất cả khối</Option>
                  {blocks.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                </Select>
              </Col>
            </Row>
          </Card>
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <BookOutlined />
                <span>Khối theo niên học</span>
                {tab2YearName ? <Tag color="processing">{tab2YearName}</Tag> : null}
              </Space>
            }
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={openAddBlockModal}
                disabled={!filtersTab2.academic_year_id}
              >
                Thêm khối
              </Button>
            }
          >
            {!filtersTab2.academic_year_id ? (
              <Text type="secondary">Chọn niên học để quản lý khối</Text>
            ) : (
              <List
                size="small"
                dataSource={blocks}
                locale={{ emptyText: 'Chưa có khối trong niên học này — bấm Thêm khối' }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="edit"
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditBlockModal(item)}
                      />,
                      <Popconfirm
                        key="del"
                        title="Xóa khối này?"
                        description={
                          Number(item.class_count) > 0
                            ? `Khối còn ${item.class_count} lớp — không thể xóa`
                            : 'Thao tác không hoàn tác'
                        }
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        disabled={Number(item.class_count) > 0}
                        onConfirm={() => handleDeleteBlock(item.id)}
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={Number(item.class_count) > 0}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <Space>
                      <Tag color="blue">{item.code}</Tag>
                      <Text strong>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({item.class_count || 0} lớp)
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden' }}>
            <div style={{ flex: selectedLophoc ? '0 0 65%' : '0 0 100%', transition: 'all 0.3s ease-in-out', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Card title={<Space><TeamOutlined /><span>Khối/ lớp</span><Tag color="blue">{classes.length} lớp</Tag></Space>} bodyStyle={{ padding: 0 }} style={{ flex: 1, overflowY: 'auto' }}>
                {/* Group classes by block */}
                {blocks.filter(b => filtersTab2.block_id === 'all' || b.id === filtersTab2.block_id).map(block => {
                  const blockClasses = classes.filter(c => c.block_id === block.id);
                  if (blockClasses.length === 0) return null;
                  
                  return (
                    <div key={block.id} className="khoi-group">
                      <div style={{ backgroundColor: '#f5f5f5', padding: '10px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Space><HolderOutlined style={{ color: '#bfbfbf' }} /><span>{block.name} ({blockClasses.length} lớp)</span></Space>
                        <span style={{ fontSize: '12px' }}>Phòng/ Giáo lý viên</span>
                        <span></span>
                      </div>
                      <List 
                        dataSource={blockClasses} 
                        renderItem={(item) => (
                          <List.Item 
                            onClick={() => {
                              setIsAddingLophoc(false);
                              setSelectedLophoc(item);
                              formLophoc.setFieldsValue({
                                ...item,
                                teacher_ids: item.teachers?.map(t => t.teacher_id) || []
                              });
                            }} 
                            style={{ padding: '12px 24px', cursor: 'pointer', backgroundColor: selectedLophoc?.id === item.id ? '#e6f7ff' : 'transparent', borderBottom: '1px solid #f0f0f0' }} 
                            className="lophoc-item-hover"
                          >
                            <Row style={{ width: '100%' }} align="middle">
                              <Col span={8}>
                                <Space>
                                  <HolderOutlined style={{ color: '#d9d9d9' }} />
                                  <div>
                                    <div style={{ fontWeight: '500', color: '#262626' }}>{item.name}</div>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Khối: {item.block_name}</div>
                                  </div>
                                </Space>
                              </Col>
                              <Col span={12}>
                                <div style={{ fontSize: '13px' }}>
                                  <div><EnvironmentOutlined style={{ marginRight: 8, color: '#8c8c8c' }} /><strong>{item.room || 'Chưa xếp phòng'}</strong></div>
                                  <div>
                                    <UserOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                                    {item.head_teacher_first_name ? `${item.head_teacher_saint_name || ''} ${item.head_teacher_first_name} ${item.head_teacher_last_name}` : 'Chưa có GLV chủ nhiệm'}
                                  </div>
                                </div>
                              </Col>
                              <Col span={4} style={{ textAlign: 'right' }}>
                                <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} />
                              </Col>
                            </Row>
                          </List.Item>
                        )} 
                      />
                    </div>
                  );
                })}
              </Card>
            </div>
            {selectedLophoc && (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      {isAddingLophoc ? <PlusOutlined /> : <EditOutlined />}
                      <span>{isAddingLophoc ? 'Thêm lớp mới' : 'Chỉnh sửa lớp'}</span>
                    </Space>
                    <Button type="text" icon={<CloseOutlined />} onClick={() => { setSelectedLophoc(null); setIsAddingLophoc(false); }} />
                  </div>
                } 
                style={{ flex: '0 0 35%', overflowY: 'auto' }} 
                bodyStyle={{ padding: '16px' }}
              >
                <Form form={formLophoc} layout="vertical" size="small">
                  <Form.Item label="Khối *" name="block_id" rules={[{ required: true }]}>
                    <Select>
                      {blocks.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Tên lớp *" name="name" rules={[{ required: true }]}>
                    <Input placeholder="Nhập tên lớp học" />
                  </Form.Item>
                  <Form.Item label="Phòng học" name="room">
                    <Input placeholder="Nhập phòng học" />
                  </Form.Item>
                  <Form.Item label="GLV Chủ nhiệm *" name="head_teacher_id" rules={[{ required: true }]}>
                    <Select showSearch optionFilterProp="children" placeholder="Chọn GLV chủ nhiệm">
                      {teachers.map(t => (
                        <Option key={t.id} value={t.id}>
                          {t.saint_name} {t.first_name} {t.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Danh sách GLV" name="teacher_ids">
                    <Select mode="multiple" placeholder="Chọn các GLV giảng dạy">
                      {teachers.map(t => (
                        <Option key={t.id} value={t.id}>
                          {t.saint_name} {t.first_name} {t.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Ghi chú" name="note">
                    <Input.TextArea rows={3} placeholder="Ghi chú thêm về lớp học" />
                  </Form.Item>
                  <Button type="primary" block icon={<SaveOutlined />} onClick={handleSaveLophoc} loading={loading}>
                    {isAddingLophoc ? 'Thêm mới' : 'Cập nhật'}
                  </Button>
                </Form>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Xếp lớp/ chuyển lớp */}
      {activeTab === '3' && (
        <div style={{ display: 'flex', flex: 1, gap: 16, overflowY: 'auto', flexDirection: 'column', paddingBottom: 24 }}>
          {/* Section 1: Preview */}
          <Card 
            title={<Space><EyeOutlined style={{ color: '#722ed1' }} /><span>Preview - Tổng quan xếp lớp</span></Space>}
            extra={<Text type="secondary" style={{ fontSize: '12px' }}><InfoCircleOutlined /> Xem trước kết quả trước khi lưu</Text>}
            bodyStyle={{ padding: '16px' }}
          >
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <div style={{ background: 'linear-gradient(to right, #f0f5ff, #efdbff)', padding: '16px', borderRadius: '8px', border: '1px solid #adc6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d39c4' }}>{sourceStudents.length}</div>
                    <div style={{ fontSize: '12px', color: '#2f54eb' }}>Tổng học viên</div>
                  </div>
                  <Avatar size={40} style={{ backgroundColor: '#2f54eb' }} icon={<TeamOutlined />} />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: 'linear-gradient(to right, #f6ffed, #d9f7be)', padding: '16px', borderRadius: '8px', border: '1px solid #b7eb8f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#389e0d' }}>{assignedCount}</div>
                    <div style={{ fontSize: '12px', color: '#52c41a' }}>Đã chọn lớp mới</div>
                  </div>
                  <Avatar size={40} style={{ backgroundColor: '#52c41a' }} icon={<CheckOutlined />} />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: 'linear-gradient(to right, #fff7e6, #ffe7ba)', padding: '16px', borderRadius: '8px', border: '1px solid #ffd591', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d46b08' }}>{unassignedCount}</div>
                    <div style={{ fontSize: '12px', color: '#fa8c16' }}>Chưa chọn lớp</div>
                  </div>
                  <Avatar size={40} style={{ backgroundColor: '#fa8c16' }} icon={<InfoCircleOutlined />} />
                </div>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ color: '#595959' }}><HolderOutlined /> Phân bổ theo lớp mới</Text>
              <Button 
                type="primary" 
                size="small" 
                style={{ backgroundColor: '#722ed1' }} 
                icon={<TeamOutlined />}
                onClick={() => setIsPreviewModalOpen(true)}
              >
                Xem chi tiết
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(
                Object.values(enrollmentChanges).reduce((acc, classId) => {
                  acc[classId] = (acc[classId] || 0) + 1;
                  return acc;
                }, {})
              ).map(([classId, count]) => {
                const className = targetClasses.find(c => c.id === classId)?.name || 'N/A';
                return (
                  <Card key={classId} size="small" style={{ width: 200, cursor: 'pointer', backgroundColor: '#fafafa' }} bodyStyle={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '13px' }}>{className}</div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{count} học viên</div>
                      </div>
                      <Tag color="blue" style={{ borderRadius: '10px', margin: 0 }}>{count}</Tag>
                    </div>
                  </Card>
                );
              })}
              {unassignedCount > 0 && (
                <Card size="small" style={{ width: 200, cursor: 'pointer', backgroundColor: '#fff7e6' }} bodyStyle={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '13px' }}>Chưa xếp lớp</div>
                      <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{unassignedCount} học viên</div>
                    </div>
                    <Tag color="orange" style={{ borderRadius: '10px', margin: 0 }}>{unassignedCount}</Tag>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* Section 2: Implementation */}
          <Card 
            title={<Space><UserSwitchOutlined /><span>Thực hiện xếp lớp</span></Space>}
            extra={<Text type="secondary" style={{ fontSize: '12px' }}><InfoCircleOutlined /> Chuyển học viên từ lớp cũ sang lớp mới</Text>}
            bodyStyle={{ padding: '20px' }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <div style={{ backgroundColor: '#f0f5ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1890ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff', marginRight: 8, fontWeight: 'bold' }}>1</Avatar>
                    <Text strong style={{ color: '#003a8c' }}>Chọn lớp nguồn (chuyển từ)</Text>
                  </div>
                  <Form layout="vertical" size="small">
                    <Form.Item label={<Space><CalendarOutlined /> Niên học cũ</Space>}>
                      <Select 
                        value={filtersTab3.source_academic_year_id}
                        onChange={(val) => setFiltersTab3(prev => ({
                          ...prev,
                          source_academic_year_id: val,
                          source_block_id: 'all',
                          source_class_id: null
                        }))}
                      >
                        {nienHocs.map(y => <Option key={y.id} value={y.id}>{y.name}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item label={<Space><TeamOutlined /> Khối lớp</Space>}>
                      <Select 
                        value={filtersTab3.source_block_id}
                        onChange={(val) => setFiltersTab3(prev => ({ ...prev, source_block_id: val, source_class_id: null }))}
                      >
                        <Option value="all">Tất cả khối</Option>
                        {blocks.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item label={<Space><TeamOutlined /> Lớp cụ thể</Space>}>
                      <Select 
                        value={filtersTab3.source_class_id}
                        disabled={filtersTab3.source_block_id === 'all'}
                        placeholder={filtersTab3.source_block_id === 'all' ? 'Chọn khối trước' : '-- Chọn lớp --'}
                        onChange={(val) => setFiltersTab3(prev => ({ ...prev, source_class_id: val }))}
                      >
                        {classes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Form>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ backgroundColor: '#f6ffed', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #52c41a', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <Avatar size="small" style={{ backgroundColor: '#52c41a', marginRight: 8, fontWeight: 'bold' }}>2</Avatar>
                    <Text strong style={{ color: '#135200' }}>Chọn niên học đích (chuyển đến)</Text>
                  </div>
                  <Form layout="vertical" size="small">
                    <Form.Item label={<Space><PlusOutlined /> Niên học mới</Space>}>
                      <Select 
                        placeholder="-- Chọn niên học --"
                        value={filtersTab3.target_academic_year_id}
                        onChange={(val) => setFiltersTab3(prev => ({ ...prev, target_academic_year_id: val }))}
                      >
                        {nienHocs.map(y => <Option key={y.id} value={y.id}>{y.name}</Option>)}
                      </Select>
                    </Form.Item>
                    <div style={{ marginTop: 24, padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '4px', color: '#0050b3', fontSize: '13px' }}>
                      <ThunderboltOutlined style={{ marginRight: 8 }} />
                      Lớp đích sẽ được chọn cho từng học viên trong bảng bên dưới
                    </div>
                  </Form>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Section 3: Student List */}
          <Card 
            title={
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Avatar size="small" style={{ backgroundColor: '#fa8c16', marginRight: 8, fontWeight: 'bold' }}>3</Avatar>
                  <Text strong>Danh sách học viên cần xếp lớp</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>Chọn lớp mới cho từng học viên hoặc áp dụng hàng loạt</Text>
              </div>
            }
            bodyStyle={{ padding: 0 }}
            style={{ background: 'linear-gradient(to bottom, #fff7e6, #ffffff)' }}
          >
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ffd591' }}>
              <Space>
                <InfoCircleOutlined style={{ color: '#fa8c16' }} />
                <Text style={{ fontSize: '13px' }}>Tổng số học viên: <b>{sourceStudents.length}</b> | Đã chọn lớp mới: <b style={{ color: '#52c41a' }}>{assignedCount}</b></Text>
              </Space>
              <div style={{ backgroundColor: '#fff7e6', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ffd591', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text strong style={{ fontSize: '13px', color: '#d46b08' }}><ThunderboltOutlined /> Chọn lớp xếp vào:</Text>
                <Select 
                  placeholder="-- Chọn lớp --" 
                  style={{ width: 180 }} 
                  size="small"
                  value={bulkTargetClass}
                  onChange={setBulkTargetClass}
                >
                  {targetClasses.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  size="small" 
                  style={{ backgroundColor: '#fa8c16' }} 
                  icon={<ThunderboltOutlined />}
                  onClick={handleApplyBulkClass}
                >
                  Áp dụng tất cả
                </Button>
              </div>
            </div>
            <Table
              columns={columnsXepLop}
              dataSource={sourceStudents}
              rowKey="id"
              pagination={false}
              bordered
              size="small"
              rowClassName="xeplop-row"
              loading={loading}
            />
          </Card>

          {/* Preview Modal */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ backgroundColor: '#f9f0ff', padding: '8px', borderRadius: '50%' }}>
                  <ClockCircleOutlined style={{ color: '#722ed1', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Preview chi tiết kết quả xếp lớp</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 'normal' }}>Danh sách học viên theo lớp mới được chọn</div>
                </div>
              </div>
            }
            open={isPreviewModalOpen}
            onCancel={() => setIsPreviewModalOpen(false)}
            width={1000}
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <Text type="secondary">Hiển thị {sourceStudents.length} / {sourceStudents.length} học viên</Text>
                <Space>
                  <Button type="primary" icon={<DownloadOutlined />} style={{ backgroundColor: '#1890ff' }}>Xuất Excel</Button>
                  <Button onClick={() => setIsPreviewModalOpen(false)} style={{ backgroundColor: '#8c8c8c', color: '#fff' }}>Đóng</Button>
                </Space>
              </div>
            }
            bodyStyle={{ padding: '0 24px 24px 24px' }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, marginTop: 16 }}>
              <Button 
                size="small" 
                icon={<TeamOutlined />} 
                type={previewFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setPreviewFilter('all')}
                style={previewFilter === 'all' ? { backgroundColor: '#1890ff' } : {}}
              >
                Tất cả ({sourceStudents.length})
              </Button>
              <Button 
                size="small" 
                icon={<CheckOutlined />} 
                type={previewFilter === 'selected' ? 'primary' : 'default'}
                onClick={() => setPreviewFilter('selected')}
                style={previewFilter === 'selected' ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
              >
                Đã chọn lớp ({assignedCount})
              </Button>
              <Button 
                size="small" 
                icon={<ExclamationCircleOutlined />} 
                type={previewFilter === 'none' ? 'primary' : 'default'}
                onClick={() => setPreviewFilter('none')}
                style={previewFilter === 'none' ? { backgroundColor: '#fa8c16', borderColor: '#fa8c16' } : {}}
              >
                Chưa chọn lớp ({unassignedCount})
              </Button>
            </div>
            <Table
              columns={columnsPreviewXepLop}
              dataSource={sourceStudents.filter(s => {
                if (previewFilter === 'all') return true;
                if (previewFilter === 'selected') return enrollmentChanges[s.id];
                if (previewFilter === 'none') return !enrollmentChanges[s.id];
                return true;
              })}
              rowKey="id"
              pagination={false}
              bordered
              size="small"
              scroll={{ y: 400 }}
              rowClassName="preview-row"
            />
          </Modal>
        </div>
      )}

      {/* Tab 4: Chuyên cần */}
      {activeTab === '4' && (
        <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden', flexDirection: 'column' }}>
          {/* Filters for Tab 4 */}
          <Card bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><CalendarOutlined /> Niên học</Text>
                <Select 
                  value={filtersTab4.academic_year_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => {
                    const year = nienHocs.find(y => y.id === val);
                    setFiltersTab4(prev => ({ 
                      ...prev, 
                      academic_year_id: val,
                      semester_id: year?.semesters?.[0]?.id || null,
                      block_id: 'all',
                      class_id: null
                    }));
                  }}
                >
                  {nienHocs.map(y => <Option key={y.id} value={y.id}>{y.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><CalendarOutlined /> Học Kỳ</Text>
                <Select 
                  value={filtersTab4.semester_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFiltersTab4(prev => ({ ...prev, semester_id: val }))}
                >
                  {nienHocs.find(y => y.id === filtersTab4.academic_year_id)?.semesters?.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><CloseOutlined /> Khối/Ngành</Text>
                <Select 
                  value={filtersTab4.block_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFiltersTab4(prev => ({ ...prev, block_id: val, class_id: null }))}
                >
                  <Option value="all">Tất cả khối</Option>
                  {blocks.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><BookOutlined /> Lớp học</Text>
                <Select 
                  value={filtersTab4.class_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={filtersTab4.block_id === 'all'}
                  placeholder={filtersTab4.block_id === 'all' ? 'Chọn khối trước' : '-- Chọn lớp --'}
                  onChange={(val) => setFiltersTab4(prev => ({ ...prev, class_id: val }))}
                >
                  {classes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Col>
            </Row>
          </Card>

          {/* Note Section for Tab 4 */}
          <Card 
            style={{ marginBottom: 16, backgroundColor: '#fff1f0', borderLeft: '4px solid #ff4d4f' }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Title level={5} style={{ color: '#cf1322', marginBottom: 8 }}><CloseOutlined /> Lưu ý:</Title>
            <ul style={{ paddingLeft: 20, fontSize: '13px', color: '#cf1322', lineHeight: '1.8' }}>
              <li>Bảng này quy định ngày giờ điểm danh Thánh lễ & học Giáo lý.</li>
              <li>Trong màn hình cài đặt chuyên cần, cần định nghĩa <b>từng lớp</b> và nhấn nút <b>lưu lại</b>.</li>
              <li>Khi đánh dấu vào ô: <b>"Tính hết các ngày hiện diện Thánh Lễ"</b> thì hệ thống ghi nhận và tính hết không chỉ những ngày đã định nghĩa theo lịch.</li>
            </ul>
          </Card>

          {/* Attendance Config Table */}
          <Card 
            title={<Space><CloseOutlined style={{ color: '#1890ff' }} /><span>Danh Mục Điểm Danh</span></Space>}
            bodyStyle={{ padding: 0 }}
          >
            <table className="attendance-config-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ width: '16%', padding: '12px', border: '1px solid #d9d9d9' }}></th>
                  {daysOfWeek.map(day => (
                    <th key={day.label} style={{ padding: '12px', border: '1px solid #d9d9d9', color: day.color, fontWeight: 'bold' }}>
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Thánh Lễ Row */}
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>Thánh Lễ</td>
                  {daysOfWeek.map((_, i) => (
                    <td key={i} style={{ padding: '12px', border: '1px solid #d9d9d9' }}>
                      <Checkbox 
                        checked={attendanceData.mass[i].is_enabled}
                        onChange={(e) => {
                          const newData = { ...attendanceData };
                          newData.mass[i].is_enabled = e.target.checked;
                          setAttendanceData(newData);
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>Giờ Bắt Đầu</td>
                  {daysOfWeek.map((_, i) => (
                    <td key={i} style={{ padding: '8px', border: '1px solid #d9d9d9' }}>
                      <TimePicker 
                        format="HH:mm" 
                        size="small" 
                        placeholder="--:--" 
                        style={{ width: '100%' }} 
                        value={attendanceData.mass[i].start_time}
                        onChange={(time) => {
                          const newData = { ...attendanceData };
                          newData.mass[i].start_time = time;
                          setAttendanceData(newData);
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>Giờ Kết Thúc</td>
                  {daysOfWeek.map((_, i) => (
                    <td key={i} style={{ padding: '8px', border: '1px solid #d9d9d9' }}>
                      <TimePicker 
                        format="HH:mm" 
                        size="small" 
                        placeholder="--:--" 
                        style={{ width: '100%' }} 
                        value={attendanceData.mass[i].end_time}
                        onChange={(time) => {
                          const newData = { ...attendanceData };
                          newData.mass[i].end_time = time;
                          setAttendanceData(newData);
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>Số Thánh Lễ Bắt Buộc</td>
                  <td colSpan={7} style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>
                    <InputNumber 
                      min={0} 
                      value={attendanceData.mass_required} 
                      size="small" 
                      style={{ width: 80, color: '#cf1322', fontWeight: 'bold' }} 
                      onChange={(val) => setAttendanceData({ ...attendanceData, mass_required: val })}
                    />
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>Số Thánh Lễ Được Phép Nghỉ</td>
                  <td colSpan={7} style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>
                    <InputNumber 
                      min={0} 
                      value={attendanceData.mass_allowed_absence} 
                      size="small" 
                      style={{ width: 80 }} 
                      onChange={(val) => setAttendanceData({ ...attendanceData, mass_allowed_absence: val })}
                    />
                  </td>
                </tr>

                {/* Giáo Lý Row */}
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>Giáo Lý</td>
                  {daysOfWeek.map((_, i) => (
                    <td key={i} style={{ padding: '12px', border: '1px solid #d9d9d9' }}>
                      <Checkbox 
                        checked={attendanceData.catechism[i].is_enabled}
                        onChange={(e) => {
                          const newData = { ...attendanceData };
                          newData.catechism[i].is_enabled = e.target.checked;
                          setAttendanceData(newData);
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>Giờ Bắt Đầu</td>
                  {daysOfWeek.map((_, i) => (
                    <td key={i} style={{ padding: '8px', border: '1px solid #d9d9d9' }}>
                      <TimePicker 
                        format="HH:mm" 
                        size="small" 
                        placeholder="--:--" 
                        style={{ width: '100%' }} 
                        value={attendanceData.catechism[i].start_time}
                        onChange={(time) => {
                          const newData = { ...attendanceData };
                          newData.catechism[i].start_time = time;
                          setAttendanceData(newData);
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>Giờ Kết Thúc</td>
                  {daysOfWeek.map((_, i) => (
                    <td key={i} style={{ padding: '8px', border: '1px solid #d9d9d9' }}>
                      <TimePicker 
                        format="HH:mm" 
                        size="small" 
                        placeholder="--:--" 
                        style={{ width: '100%' }} 
                        value={attendanceData.catechism[i].end_time}
                        onChange={(time) => {
                          const newData = { ...attendanceData };
                          newData.catechism[i].end_time = time;
                          setAttendanceData(newData);
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>Số Buổi Giáo Lý Bắt Buộc</td>
                  <td colSpan={7} style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>
                    <InputNumber 
                      min={0} 
                      value={attendanceData.catechism_required} 
                      size="small" 
                      style={{ width: 80, color: '#cf1322', fontWeight: 'bold' }} 
                      onChange={(val) => setAttendanceData({ ...attendanceData, catechism_required: val })}
                    />
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>Số Buổi Giáo Lý Được Phép Nghỉ</td>
                  <td colSpan={7} style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>
                    <InputNumber 
                      min={0} 
                      value={attendanceData.catechism_allowed_absence} 
                      size="small" 
                      style={{ width: 80 }} 
                      onChange={(val) => setAttendanceData({ ...attendanceData, catechism_allowed_absence: val })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Bottom Checkboxes */}
            <div style={{ padding: '16px', borderTop: '1px solid #d9d9d9' }}>
              <Space direction="vertical">
                <Checkbox 
                  style={{ color: '#cf1322', fontWeight: 'bold' }}
                  checked={attendanceData.count_all_mass_days}
                  onChange={(e) => setAttendanceData({ ...attendanceData, count_all_mass_days: e.target.checked })}
                >
                  Tính hết các ngày hiện diện Thánh Lễ
                </Checkbox>
                <Checkbox 
                  style={{ color: '#cf1322', fontWeight: 'bold' }}
                  checked={attendanceData.disable_ethics_score}
                  onChange={(e) => setAttendanceData({ ...attendanceData, disable_ethics_score: e.target.checked })}
                >
                  Không áp dụng cột điểm đạo đức
                </Checkbox>
              </Space>
              <div style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  block 
                  icon={<SaveOutlined />} 
                  onClick={handleSaveAttendanceConfigs}
                  loading={loading}
                >
                  Lưu cấu hình chuyên cần
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Học lực */}
      {activeTab === '5' && (
        <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden', flexDirection: 'column' }}>
          <Card bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><CalendarOutlined /> Niên học</Text>
                <Select 
                  value={filtersTab5.academic_year_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => {
                    const year = nienHocs.find(y => y.id === val);
                    setFiltersTab5(prev => ({ 
                      ...prev, 
                      academic_year_id: val,
                      semester_id: year?.semesters?.[0]?.id || null,
                      block_id: 'all',
                      class_id: null
                    }));
                  }}
                >
                  {nienHocs.map(y => <Option key={y.id} value={y.id}>{y.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><CalendarOutlined /> Học Kỳ</Text>
                <Select 
                  value={filtersTab5.semester_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFiltersTab5(prev => ({ ...prev, semester_id: val }))}
                >
                  {nienHocs.find(y => y.id === filtersTab5.academic_year_id)?.semesters?.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><CloseOutlined /> Khối/Ngành</Text>
                <Select 
                  value={filtersTab5.block_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  onChange={(val) => setFiltersTab5(prev => ({ ...prev, block_id: val, class_id: null }))}
                >
                  <Option value="all">Tất cả khối</Option>
                  {blocks.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <Text strong style={{ fontSize: '12px' }}><BookOutlined /> Lớp học</Text>
                <Select 
                  value={filtersTab5.class_id} 
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={filtersTab5.block_id === 'all'}
                  placeholder={filtersTab5.block_id === 'all' ? 'Chọn khối trước' : '-- Chọn lớp --'}
                  onChange={(val) => setFiltersTab5(prev => ({ ...prev, class_id: val }))}
                >
                  {classes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Col>
            </Row>
          </Card>
          <Row gutter={16} style={{ flex: 1 }}>
            <Col span={14}>
              <Card bodyStyle={{ padding: '12px 16px' }}>
                {!isClassScoreConfigured && scoreConfigs.length > 0 && (
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                    Lớp chưa lưu cấu hình — đang hiển thị cột điểm mặc định từ hệ thống. Bỏ cột không dùng (X) rồi Lưu.
                  </Text>
                )}
                <Table
                  columns={scoreColumns}
                  dataSource={scoreConfigs}
                  pagination={false}
                  bordered
                  size="small"
                  rowKey="score_type_id"
                  loading={loading}
                />
                <div style={{ marginTop: 12 }}>
                  {availableScoreTypes.length > 0 ? (
                    <Dropdown
                      menu={{
                        items: availableScoreTypes.map((t) => ({
                          key: t.id,
                          label: `${t.name} (${t.code})`,
                          onClick: () => handleAddScoreColumn(t),
                        })),
                      }}
                      trigger={['click']}
                    >
                      <Tag
                        icon={<PlusOutlined />}
                        color="processing"
                        style={{ cursor: 'pointer', padding: '4px 10px' }}
                      >
                        Thêm cột điểm
                      </Tag>
                    </Dropdown>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Đã chọn tất cả loại điểm học lực trong hệ thống
                    </Text>
                  )}
                </div>
              </Card>
            </Col>
            <Col span={10}>
              <Card bodyStyle={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', backgroundColor: '#fafafa', width: '70%', fontWeight: '500' }}>Quy định số % học lực</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Space>
                          <InputNumber 
                            value={globalScoreSettings.academic_percentage} 
                            size="small" 
                            style={{ width: 60 }} 
                            onChange={(val) => setGlobalScoreSettings(prev => ({ ...prev, academic_percentage: val }))}
                          /> 
                          <Text>%</Text>
                        </Space>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', backgroundColor: '#fafafa', fontWeight: '500' }}>Quy định số % chuyên cần</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Space>
                          <InputNumber 
                            value={globalScoreSettings.diligence_percentage} 
                            size="small" 
                            style={{ width: 60 }} 
                            onChange={(val) => setGlobalScoreSettings(prev => ({ ...prev, diligence_percentage: val }))}
                          /> 
                          <Text>%</Text>
                        </Space>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 16px', backgroundColor: '#fafafa', fontWeight: '500' }}>Quy định điểm chuyên cần khống chế</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <InputNumber 
                          value={globalScoreSettings.control_score} 
                          size="small" 
                          style={{ width: 60 }} 
                          step={0.1}
                          onChange={(val) => setGlobalScoreSettings(prev => ({ ...prev, control_score: val }))}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
              <div style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  block 
                  icon={<SaveOutlined />} 
                  onClick={handleSaveScoreConfigs}
                  loading={loading}
                >
                  Lưu cấu hình điểm
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      )}

      <Modal
        title={editingBlock?.id ? 'Sửa khối' : 'Thêm khối mới'}
        open={blockModalOpen}
        onOk={handleSaveBlock}
        onCancel={() => {
          setBlockModalOpen(false);
          setEditingBlock(null);
          formBlock.resetFields();
        }}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={formBlock} layout="vertical">
          <Form.Item
            label="Tên khối *"
            name="name"
            rules={[{ required: true, message: 'Nhập tên khối' }]}
          >
            <Input placeholder="VD: Ấu Nhi, Chiên Con" />
          </Form.Item>
          <Form.Item label="Mã khối (tùy chọn)" name="code" extra="Để trống sẽ tự sinh từ tên (VD: AN, CC)">
            <Input placeholder="VD: AN" maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .ant-table-row-selected td {
          background-color: #e6f7ff !important;
        }
        .lophoc-item-hover:hover {
          background-color: #f5f5f5 !important;
        }
        .setting-page .ant-card-head {
          min-height: 40px;
          padding: 0 16px;
        }
        .setting-page .ant-card-head-title {
          padding: 8px 0;
          font-size: 14px;
        }
        .setting-page .ant-tabs-nav {
          margin-bottom: 8px;
        }
        .setting-page .ant-table-thead > tr > th {
          background-color: #f0f0f0;
        }
        .attendance-config-table th, .attendance-config-table td {
          border: 1px solid #f0f0f0;
        }
        .bg-green-light {
          background-color: #f6ffed !important;
        }
        .xeplop-row:hover td {
          background-color: #f0f5ff !important;
        }
        .preview-row:hover td {
          background-color: #f6ffed !important;
        }
      `}} />
    </div>
  );
};

export default Setting;
