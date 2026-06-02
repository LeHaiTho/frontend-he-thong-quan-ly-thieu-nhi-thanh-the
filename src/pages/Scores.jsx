import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  message,
  Tag,
  Dropdown,
} from 'antd';
import ScoreInput from '../components/ScoreInput';
import {
  LineChartOutlined,
  SyncOutlined,
  PrinterOutlined,
  SaveOutlined,
  SearchOutlined,
  DownOutlined,
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Scores = () => {
  const [loading, setLoading] = useState(false);
  const [nienHocs, setNienHocs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [scoreConfigs, setScoreConfigs] = useState([]);
  const [gradeMap, setGradeMap] = useState({});
  const [gradeSettings, setGradeSettings] = useState({});
  const [attendanceConfig, setAttendanceConfig] = useState({});
  const [diligenceSettings, setDiligenceSettings] = useState({
    disable_ethics_score: false,
    ethics_score_type: null,
  });
  const [searchText, setSearchText] = useState('');

  const [filters, setFilters] = useState({
    academic_year_id: null,
    semester_id: null,
    block_id: 'all',
    class_id: null,
    score_type: 'academic',
  });

  const buildClassesParams = (academicYearId, blockId) => {
    const params = { academic_year_id: academicYearId };
    if (blockId && blockId !== 'all') params.block_id = blockId;
    return params;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const yearRes = await api.get('/academic-years');
        if (yearRes.data.success) {
          setNienHocs(yearRes.data.data);
          const currentYear = yearRes.data.data.find((y) => y.is_current) || yearRes.data.data[0];
          if (currentYear) {
            setFilters((prev) => ({
              ...prev,
              academic_year_id: currentYear.id,
              semester_id: currentYear.semesters?.[0]?.id ?? null,
              block_id: 'all',
              class_id: null,
            }));
          }
        }
      } catch {
        message.error('Lỗi khi tải dữ liệu ban đầu');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!filters.academic_year_id) return;
    const fetchBlocks = async () => {
      try {
        const response = await api.get('/blocks', {
          params: { academic_year_id: filters.academic_year_id },
        });
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
        const response = await api.get('/classes', {
          params: buildClassesParams(filters.academic_year_id, filters.block_id),
        });
        if (response.data.success) {
          const list = response.data.data;
          setClasses(list);
          setFilters((prev) => {
            if (list.some((c) => c.id === prev.class_id)) return prev;
            return { ...prev, class_id: list[0]?.id ?? null };
          });
        }
      } catch {
        message.error('Lỗi khi tải danh sách lớp');
      }
    };
    fetchClasses();
  }, [filters.academic_year_id, filters.block_id]);

  const fetchGrades = useCallback(async () => {
    if (!filters.class_id || !filters.semester_id) return;
    try {
      const res = await api.get('/grades/semester', {
        params: { class_id: filters.class_id, semester_id: filters.semester_id },
      });
      if (res.data.success) {
        const map = {};
        res.data.data.students.forEach((s) => {
          map[s.id] = s;
        });
        setGradeMap(map);
        setGradeSettings(res.data.data.settings || {});
        setAttendanceConfig(res.data.data.attendance_config || {});
      }
    } catch {
      message.error('Không tải được điểm tổng hợp');
    }
  }, [filters.class_id, filters.semester_id]);

  const fetchScores = useCallback(async () => {
    if (!filters.class_id || !filters.semester_id) {
      setStudents([]);
      setScoreConfigs([]);
      return;
    }
    setLoading(true);
    try {
      const params = { class_id: filters.class_id, semester_id: filters.semester_id };
      const [scoreRes, configRes] = await Promise.all([
        api.get('/scores', { params }),
        api.get('/score-configs', { params }),
      ]);
      await fetchGrades();
      if (configRes.data.success) {
        setDiligenceSettings(configRes.data.data.diligence_settings || {});
        const gs = configRes.data.data.global_settings;
        if (gs) {
          setGradeSettings((prev) => ({ ...prev, ...gs }));
        }
      }
      if (scoreRes.data.success) {
        const list = scoreRes.data.data.students.map((s) => ({
          ...s,
          ethics_score: s.ethics_score ?? null,
        }));
        setStudents(list);
        setScoreConfigs(scoreRes.data.data.configs);
      }
    } catch {
      message.error('Lỗi khi tải bảng điểm');
    } finally {
      setLoading(false);
    }
  }, [filters.class_id, filters.semester_id, fetchGrades]);

  useEffect(() => {
    fetchScores();
  }, [filters.class_id, filters.semester_id]);

  useEffect(() => {
    if (Object.keys(gradeMap).length === 0) return;
    setStudents((prev) =>
      prev.map((s) => {
        const fromGrade = gradeMap[s.id]?.ethics_score;
        return {
          ...s,
          ethics_score:
            s.ethics_score != null && s.ethics_score !== ''
              ? s.ethics_score
              : fromGrade ?? s.ethics_score ?? null,
        };
      })
    );
  }, [gradeMap]);

  const handleScoreChange = (studentId, scoreTypeId, orderIndex, value) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          const newScores = { ...student.scores };
          if (!newScores[scoreTypeId]) newScores[scoreTypeId] = [];
          newScores[scoreTypeId][orderIndex] = value;
          return { ...student, scores: newScores };
        }
        return student;
      })
    );
  };

  const handleEthicsChange = (studentId, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ethics_score: value } : s))
    );
  };

  const calcLocalDhl = (student) => {
    const pct = gradeSettings.academic_percentage ?? scoreConfigs[0]?.academic_percentage ?? 60;
    let totalWeighted = 0;
    let totalWeight = 0;
    scoreConfigs.forEach((config) => {
      if (config.score_type_code === 'DD') return;
      const vals = student.scores[config.score_type_id] || [];
      for (let i = 0; i < config.column_count; i++) {
        const score = vals[i];
        if (score !== null && score !== undefined && score !== '') {
          totalWeighted += parseFloat(score) * parseFloat(config.weight_factor);
          totalWeight += parseFloat(config.weight_factor);
        }
      }
    });
    if (totalWeight === 0) return '-';
    return ((totalWeighted / totalWeight) * (pct / 100)).toFixed(1);
  };

  const isEthicsDisabled = () =>
    diligenceSettings.disable_ethics_score === true ||
    diligenceSettings.disable_ethics_score === 1 ||
    attendanceConfig.disable_ethics_score === true ||
    attendanceConfig.disable_ethics_score === 1;

  const handleSave = async () => {
    if (!filters.class_id || !filters.semester_id) return;
    const disableEthics = isEthicsDisabled();
    setLoading(true);
    try {
      if (filters.score_type === 'academic') {
        await api.post('/scores/bulk', {
          class_id: filters.class_id,
          semester_id: filters.semester_id,
          student_scores: students.map((s) => ({ student_id: s.id, scores: s.scores })),
        });
      }
      if (!disableEthics && filters.score_type === 'diligence') {
        await api.post('/scores/bulk', {
          class_id: filters.class_id,
          semester_id: filters.semester_id,
          ethics_only: true,
          student_scores: students.map((s) => ({
            student_id: s.id,
            ethics_score: s.ethics_score,
          })),
        });
      }
      message.success('Lưu điểm thành công');
      await fetchScores();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 401) {
        message.error(msg || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        message.error(msg || 'Lỗi khi lưu điểm');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { title: 'STT', key: 'stt', width: 50, align: 'center', render: (_, __, i) => i + 1 },
      { title: 'Mã HV', dataIndex: 'code', width: 90 },
      { title: 'Tên Thánh', dataIndex: 'saint_name', width: 100 },
      { title: 'Họ', dataIndex: 'first_name' },
      { title: 'Tên', dataIndex: 'last_name', render: (t) => <Text strong>{t}</Text> },
      {
        title: 'Ngày Sinh',
        dataIndex: 'dob',
        width: 100,
        render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
      },
    ];

    const disableEthics = isEthicsDisabled();

    if (filters.score_type === 'academic') {
      const dynamicColumns = scoreConfigs
        .filter((c) => c.score_type_code !== 'DD')
        .map((config) => ({
          title: config.score_type_name,
          key: `config_${config.id}`,
          children: Array.from({ length: config.column_count }).map((_, index) => ({
            title: config.column_count > 1 ? `${index + 1}` : '',
            key: `${config.score_type_id}_${index}`,
            width: 82,
            align: 'center',
            render: (_, record) => (
              <ScoreInput
                width={76}
                value={record.scores[config.score_type_id]?.[index]}
                onChange={(val) => handleScoreChange(record.id, config.score_type_id, index, val)}
              />
            ),
          })),
        }));

      const tail = [
        {
          title: 'ĐHL',
          key: 'dhl',
          width: 70,
          align: 'center',
          fixed: 'right',
          render: (_, record) => (
            <Text strong style={{ color: '#cf1322' }}>
              {gradeMap[record.id]?.dhl ?? calcLocalDhl(record)}
            </Text>
          ),
        },
        {
          title: 'TBHK',
          key: 'tbhk',
          width: 75,
          align: 'center',
          fixed: 'right',
          render: (_, record) => (
            <Text strong style={{ color: '#1890ff' }}>
              {gradeMap[record.id]?.tbhk ?? '-'}
            </Text>
          ),
        },
      ];

      return [...baseColumns, ...dynamicColumns, ...tail];
    }

    const cols = [
      ...baseColumns,
      {
        title: 'SL Tl',
        key: 'mass_n',
        width: 58,
        align: 'center',
        render: (_, r) => (
          <Text style={{ fontSize: 12 }}>
            {gradeMap[r.id]?.mass_present ?? 0}
            {attendanceConfig.mass_required ? `/${attendanceConfig.mass_required}` : ''}
          </Text>
        ),
      },
      {
        title: 'SL Gl',
        key: 'cat_n',
        width: 58,
        align: 'center',
        render: (_, r) => (
          <Text style={{ fontSize: 12 }}>
            {gradeMap[r.id]?.catechism_present ?? 0}
            {attendanceConfig.catechism_required ? `/${attendanceConfig.catechism_required}` : ''}
          </Text>
        ),
      },
      {
        title: 'Tl',
        key: 'tl',
        width: 65,
        align: 'center',
        render: (_, r) => gradeMap[r.id]?.tl ?? '-',
      },
      {
        title: 'Gl',
        key: 'gl',
        width: 65,
        align: 'center',
        render: (_, r) => gradeMap[r.id]?.gl ?? '-',
      },
    ];

    if (!disableEthics) {
      cols.push({
        title: 'Điểm đạo đức',
        key: 'ethics',
        width: 110,
        align: 'center',
        render: (_, record) => (
          <ScoreInput
            width={80}
            value={record.ethics_score}
            onChange={(val) => handleEthicsChange(record.id, val)}
          />
        ),
      });
    }

    cols.push(
      {
        title: 'ĐCC',
        key: 'dcc',
        width: 70,
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#722ed1' }}>
              {gradeMap[record.id]?.dcc ?? '-'}
            </Text>
            {gradeMap[record.id]?.is_controlled && (
              <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
                KC
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: 'TBHK',
        key: 'tbhk',
        width: 75,
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Text strong style={{ color: '#1890ff' }}>
            {gradeMap[record.id]?.tbhk ?? '-'}
          </Text>
        ),
      }
    );

    return cols;
  }, [
    scoreConfigs,
    students,
    filters.score_type,
    gradeMap,
    gradeSettings,
    attendanceConfig,
    diligenceSettings,
  ]);

  const filteredStudents = students.filter(
    (s) =>
      `${s.saint_name} ${s.first_name} ${s.last_name}`.toLowerCase().includes(searchText.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchText.toLowerCase())
  );

  const pctAcademic = gradeSettings.academic_percentage ?? scoreConfigs[0]?.academic_percentage ?? 60;
  const pctDiligence = gradeSettings.diligence_percentage ?? scoreConfigs[0]?.diligence_percentage ?? 40;

  const currentYear = nienHocs.find((y) => y.id === filters.academic_year_id);
  const currentSemester = currentYear?.semesters?.find((s) => s.id === filters.semester_id);
  const currentClass = classes.find((c) => c.id === filters.class_id);
  const currentBlock = blocks.find((b) => b.id === filters.block_id);

  const getClassificationAndResult = (tbhk, dcc) => {
    const tb = parseFloat(tbhk);
    const dc = parseFloat(dcc);
    const control = parseFloat(gradeSettings.control_score ?? 2.5);
    
    if (isNaN(tb)) return { classification: '', result: '' };
    
    let classification = '';
    if (tb >= 9.5) classification = 'Xuất sắc';
    else if (tb >= 8.0) classification = 'Giỏi';
    else if (tb >= 6.5) classification = 'Khá';
    else if (tb >= 5.0) classification = 'Trung bình';
    else if (tb >= 3.5) classification = 'Yếu';
    else classification = 'Kém';

    let result = '';
    if (tb < 3.5 || (!isNaN(dc) && dc < control)) {
      result = 'Ở lại lớp';
    } else if (tb < 5.0) {
      result = 'Thi lại';
    } else {
      result = 'Lên lớp';
    }

    return { classification, result };
  };

  const handleExportWord = () => {
    const printContent = document.querySelector('.print-section');
    if (!printContent) {
      message.error('Không tìm thấy dữ liệu để xuất');
      return;
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Bang Diem</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; color: #000; font-size: 16px; }
          .print-page-break { page-break-after: always; }
          table.data-table { border-collapse: collapse; width: 100%; text-align: center; border: 1px solid #000; }
          table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px 4px; }
          table.layout-table { border: none; width: 100%; }
          table.layout-table td { border: none; padding: 4px 0; }
          h2 { color: #000080; margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BangDiem_${currentClass?.name || 'Lop'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="scores-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <LineChartOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          Điểm Số Học Viên
        </Title>
        <Space>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'class',
                  label: 'Tải Word bảng điểm theo lớp',
                  onClick: handleExportWord,
                },
                {
                  key: 'detail',
                  label: 'In bảng điểm chi tiết...',
                  onClick: () => message.info('Tính năng in bảng điểm chi tiết đang phát triển'),
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button icon={<PrinterOutlined />}>
              In <DownOutlined />
            </Button>
          </Dropdown>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            style={{ backgroundColor: '#52c41a' }}
            onClick={handleSave}
            loading={loading}
          >
            Lưu
          </Button>
          <Button icon={<SyncOutlined />} style={{ backgroundColor: '#1890ff', color: '#fff' }} onClick={fetchScores} />
        </Space>
      </div>

      <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
        <Row gutter={[12, 12]} align="bottom">
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
              {nienHocs.map((y) => (
                <Option key={y.id} value={y.id}>{y.name}</Option>
              ))}
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
              {blocks.map((b) => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
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
              {classes.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: 12 }}>Loại điểm</Text>
            <Select
              value={filters.score_type}
              style={{ width: '100%', marginTop: 4 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, score_type: val }))}
            >
              <Option value="academic">Học lực</Option>
              <Option value="diligence">Chuyên cần</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: 12 }}>Tìm kiếm</Text>
            <Input
              prefix={<SearchOutlined />}
              style={{ marginTop: 4 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {filters.score_type === 'academic' ? (
              <>ĐHL = (tổng điểm có hệ số / tổng hệ số) × {pctAcademic}%. TBHK = ĐHL + ĐCC.</>
            ) : (
              <>
                Tl/Gl tính từ điểm danh (Tab Chuyên cần). Nhập{' '}
                {isEthicsDisabled() ? 'không có cột Đạo đức' : 'Điểm đạo đức (Đđ)'} trước ĐCC.
                ĐCC = (Tl+Gl{isEthicsDisabled() ? '' : '+Đđ'})/{isEthicsDisabled() ? '2' : '3'} ×{' '}
                {pctDiligence}%. Điểm khống chế: {gradeSettings.control_score ?? 2.5}.
              </>
            )}
          </Text>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
        loading={loading}
        scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
      />

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-page-break {
            page-break-after: always;
          }
          /* Ẩn scrollbar khi in */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
      <div className="print-section" style={{ display: 'none', backgroundColor: '#fff' }}>
        {filteredStudents.map((student) => {
          const tbhk = gradeMap[student.id]?.tbhk ?? '-';
          const dhl = gradeMap[student.id]?.dhl ?? calcLocalDhl(student) ?? '-';
          const dcc = gradeMap[student.id]?.dcc ?? '-';
          const { classification, result } = getClassificationAndResult(tbhk, dcc);
          const massPresent = gradeMap[student.id]?.mass_present ?? 0;
          const massReq = attendanceConfig.mass_required ?? 0;
          const catPresent = gradeMap[student.id]?.catechism_present ?? 0;
          const catReq = attendanceConfig.catechism_required ?? 0;
          
          return (
            <div key={student.id} className="print-page-break" style={{ padding: '20px 40px', fontFamily: '"Times New Roman", Times, serif', color: '#000' }}>
              <table className="layout-table" style={{ marginBottom: 20 }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', textAlign: 'left', verticalAlign: 'top' }}>
                      <div style={{ fontSize: 16 }}>Giáo Hạt Thái Nguyên</div>
                      <div style={{ fontSize: 16 }}>Giáo Xứ Nhã Lộng</div>
                    </td>
                    <td style={{ width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h2>BẢNG ĐIỂM HỌC VIÊN</h2>
                <div style={{ fontSize: 24, lineHeight: 1 }}>☧</div>
              </div>
              
              <div style={{ marginBottom: 20, fontSize: 16 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>THÔNG TIN</div>
                <table className="layout-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '60%' }}>Tên thánh & họ tên: <strong>{student.saint_name} {student.first_name} {student.last_name}</strong></td>
                      <td style={{ width: '40%' }}>Mã số: <strong>{student.code}</strong></td>
                    </tr>
                    <tr>
                      <td>Ngày sinh: <strong>{student.dob ? dayjs(student.dob).format('DD/MM/YYYY') : ''}</strong></td>
                      <td>Ngày rửa tội: <strong></strong></td>
                    </tr>
                    <tr>
                      <td>Giáo họ: <strong>Nhã Lộng</strong></td>
                      <td>Số sổ gia đình: <strong></strong></td>
                    </tr>
                    <tr>
                      <td>Lớp/Chi đoàn: <strong>{currentClass?.name}</strong> Khối/Ngành: <strong>{currentBlock?.name}</strong></td>
                      <td>Niên học: <strong>{currentYear?.name}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, fontSize: 16 }}>BẢNG ĐIỂM</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th colSpan={5} style={{ padding: '4px' }}>Cả năm</th>
                    </tr>
                    <tr>
                      <th>TB C.Cần</th>
                      <th>TB H.Lực</th>
                      <th>Tổng TB</th>
                      <th>Xếp loại</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{dcc}</strong></td>
                      <td><strong>{dhl}</strong></td>
                      <td><strong>{tbhk}</strong></td>
                      <td>{classification}</td>
                      <td>{result}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontStyle: 'italic', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                  Những từ viết tắt : X.S: Xuất sắc; T.B: Trung bình; C. Cần: Chuyên cần<br/>
                  PTTNTT: Phong trào Thiếu nhi Thánh Thể
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, fontSize: 16 }}>THAM DỰ THÁNH LỄ, HỌC GIÁO LÝ & CHẦU THÁNH THỂ</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học kỳ</th>
                      <th>Số Thánh lễ đã tham dự</th>
                      <th>Số buổi Giáo lý đã học</th>
                      <th>Số buổi Chầu đã tham dự</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{currentSemester?.semester_number === 1 ? 'I' : 'II'}</td>
                      <td>
                        <strong>{massPresent} / {massReq}</strong> 
                        {massReq > massPresent && ` (thiếu: ${massReq - massPresent})`}
                      </td>
                      <td>
                        <strong>{catPresent} / {catReq}</strong>
                        {catReq > catPresent && ` (thiếu: ${catReq - catPresent})`}
                      </td>
                      <td>0</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontStyle: 'italic', fontSize: 14, marginTop: 8 }}>
                  <strong>* Chú ý:</strong> Cần tham dự thêm các Thánh lễ còn thiếu
                </div>
              </div>

              <table className="layout-table" style={{ marginTop: 30, fontSize: 16 }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '20px' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>NHẬN XÉT GIÁO LÝ VIÊN</div>
                      <div style={{ borderBottom: '1px dotted #000', marginBottom: 30, height: 24 }}></div>
                      <div style={{ borderBottom: '1px dotted #000', marginBottom: 30, height: 24 }}></div>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginTop: 40, marginBottom: 10 }}>Ý KIẾN PHỤ HUYNH</div>
                      <div style={{ borderBottom: '1px dotted #000', marginBottom: 30, height: 24 }}></div>
                    </td>
                    <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                      <div style={{ fontStyle: 'italic', marginBottom: 10 }}>Giáo xứ Nhã Lộng, ngày {dayjs().format('DD')} tháng {dayjs().format('MM')} năm {dayjs().format('YYYY')}</div>
                      <div style={{ height: 100 }}></div>
                      <div><strong>Lm. Phaolô Đào Văn Trường</strong></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Scores;
