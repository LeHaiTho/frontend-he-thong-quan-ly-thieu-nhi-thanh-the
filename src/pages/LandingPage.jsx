import { systemName } from '../utils/constants';
import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Space, Tag, Tabs, Table, Avatar, QRCode, Descriptions, Spin, Alert, Typography, Divider } from 'antd';
import { SearchOutlined, LoginOutlined, CalendarOutlined, SolutionOutlined, IdcardOutlined, BookOutlined, UserOutlined, PrinterOutlined, CheckCircleOutlined, InfoCircleOutlined, PlaySquareOutlined, AppleOutlined, AndroidOutlined, CommentOutlined, SendOutlined, CloseOutlined, RobotOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('portal'); // 'portal', 'parish', 'priest'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'ai', text: `Xin chào! Tôi là Trợ lý AI của hệ thống ${systemName}. Tôi có thể hỗ trợ giải đáp các thắc mắc của bạn về lịch học Giáo lý, cách tra cứu điểm số và đăng ký thẻ học viên. Hãy đặt câu hỏi cho tôi nhé! 😊` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatTyping, setChatTyping] = useState(false);

  const suggestedQuestions = [
    `${systemName} là gì?`,
    'Làm sao tra cứu điểm?',
    'Lịch học giáo lý?',
    'Làm sao đăng ký thẻ?'
  ];

  const handleSendChat = async (textToSend) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    const userMsg = msg.trim();
    const userMsgId = Date.now();

    // Thêm câu hỏi của người dùng vào state
    setChatMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: userMsg }]);
    if (!textToSend) setChatInput('');

    setChatTyping(true);

    try {
      // Chuẩn bị bối cảnh lịch sử chat gửi lên server
      const history = chatMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      history.push({ role: 'user', content: userMsg });

      // Gọi API chatbot từ NodeJS backend
      const response = await api.post('/chatbot/chat', { messages: history });

      if (response.data && response.data.success) {
        setChatMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: response.data.reply }
        ]);
      } else {
        throw new Error(`Không thể kết nối đến Trợ Lý ${systemName} AI.`);
      }
    } catch (err) {
      console.error('Lỗi khi kết nối Chatbot:', err);
      setChatMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: `Dạ xin lỗi anh chị phụ huynh, hệ thống Trợ Lý ${systemName} AI hiện đang bận hoặc gặp sự cố kết nối. Xin vui lòng thử lại sau!` }
      ]);
    } finally {
      setChatTyping(false);
    }
  };

  useEffect(() => {
    if (chatOpen) {
      const body = document.getElementById('chat-body-scroll');
      if (body) {
        body.scrollTop = body.scrollHeight;
      }
    }
  }, [chatMessages, chatOpen]);

  const handleSearch = async () => {
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mã hoặc tên học viên để tra cứu!');
      setStudentData(null);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // Gọi endpoint public mới của backend (hỗ trợ cả mã và tên)
      // Nếu có dạng mã (chứa dấu gạch ngang hoặc chủ yếu là số/chữ hoa), truyền qua `code`, nếu không truyền qua `name`
      const searchValue = code.trim();
      const isMaybeCode = /^[A-Za-z0-9\-]{5,}$/.test(searchValue);
      const queryParam = isMaybeCode ? `code=${encodeURIComponent(searchValue)}` : `name=${encodeURIComponent(searchValue)}`;
      const response = await api.get(`/students/public/lookup?${queryParam}`);
      if (response.data.success) {
        setStudentData(response.data.data);
      } else {
        setErrorMsg('Không tìm thấy học viên!');
        setStudentData(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Không tìm thấy học viên hoặc có lỗi xảy ra!');
      setStudentData(null);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'Xuất sắc': return '#eb2f96';
      case 'Giỏi': return '#52c41a';
      case 'Khá': return '#1890ff';
      case 'Trung bình': return '#fa8c16';
      default: return '#f5222d';
    }
  };

  return (
    <div className="landing-container">
      {/* Translucent Navbar */}
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <img src="/icon-App-Computer.ico" alt={`${systemName} Logo`} className="nav-logo-img" />
          <span className="logo-text">{systemName}</span>
        </div>
        <div className="navbar-links">
          <button className={`nav-tab ${activeTab === 'portal' ? 'active' : ''}`} onClick={() => setActiveTab('portal')}>Cổng thông tin</button>
          <button className={`nav-tab ${activeTab === 'parish' ? 'active' : ''}`} onClick={() => setActiveTab('parish')}>Thông tin giáo xứ</button>
          <button className={`nav-tab ${activeTab === 'priest' ? 'active' : ''}`} onClick={() => setActiveTab('priest')}>Thông tin linh mục</button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-content-scroll print-hide">
        {activeTab === 'portal' && (
          <div className="portal-content">
            {/* Header ${systemName} section */}
            <div className="hero-branding">
              <div className="">
                <img src="/icon-App-Computer.ico" alt={"${systemName} Logo"} className="hero-logo" />
              </div>
              <h1 className="hero-title">{systemName}</h1>
              <p className="hero-subtitle">PHẦN MỀM QUẢN LÝ THIẾU NHI</p>
            </div>

            {/* Tra cứu điểm danh card */}
            <Card className="search-card" bordered={false}>
              <div className="search-card-body">
                <div className="search-icon-wrapper">
               
                </div>
                <div className="search-input-section">
               
                  <Space.Compact style={{ width: '100%' }} size="large">
                    <Input
                      placeholder="Nhập mã học viên (VD: MHV-0001) hoặc họ tên..."
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onPressEnter={handleSearch}
                      className="search-input"
                      size="large"
                      prefix={<IdcardOutlined />}
                    />
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      loading={loading}
                      size="large"
                      className="search-btn"
                    >
                      Tra cứu
                    </Button>
                  </Space.Compact>
                  {errorMsg && (
                    <Alert
                      message={errorMsg}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setErrorMsg('')}
                      style={{ marginTop: 12 }}
                    />
                  )}
                </div>
              </div>
            </Card>
        
            {/* Loading Indicator */}
            {loading && (
              <div className="loading-spinner">
                <Spin size="large" tip="Đang tải dữ liệu tra cứu..." />
              </div>
            )}

            {/* Tra cứu results panel */}
            {studentData && !loading && (
              <div className="results-container">
                {/* Visual Glassmorphism Profile Card */}
                <Card className="profile-card" bordered={false}>
                  <div className="profile-body">
                    <div className="profile-left">
                      <Avatar
                        size={120}
                        src={studentData.student.avatar_url || null}
                        icon={!studentData.student.avatar_url ? <UserOutlined /> : null}
                        className="profile-avatar"
                      />
                      <div className="student-code-tag">{studentData.student.code}</div>
                    
                    </div>

                    <div className="profile-right">
                      <h2 className="student-name">
                        {studentData.student.saint_name && <span className="saint-name">{studentData.student.saint_name} </span>}
                        {studentData.student.first_name} {studentData.student.last_name}
                      </h2>

                      <div className="student-meta-grid">
                        <div className="meta-item">
                          <span className="meta-label">Ngày sinh:</span>
                          <span className="meta-value">{studentData.student.dob ? dayjs(studentData.student.dob).format('DD/MM/YYYY') : 'Chưa cập nhật'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Giới tính:</span>
                          <span className="meta-value">{studentData.student.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Địa chỉ:</span>
                          <span className="meta-value">{studentData.student.address || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Số điện thoại:</span>
                          <span className="meta-value">{studentData.student.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Tình trạng:</span>
                          <span className="meta-value">
                            <Tag color={studentData.student.status === 'active' ? 'success' : 'warning'}>
                              {studentData.student.status === 'active' ? 'Đang hoạt động' : 'Tạm nghỉ'}
                            </Tag>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Print Report Card */}
                <div className="print-action-bar">
                  <Button type="default" icon={<PrinterOutlined />} onClick={() => window.print()} className="print-btn">
                    In bảng điểm chi tiết
                  </Button>
                </div>

                {/* Semesters / Academic Year Score Panel */}
                <div className="scores-results-section">
                  {studentData.semester_grades && studentData.semester_grades.length > 0 ? (
                    <Tabs
                      type="card"
                      className="semester-tabs"
                      items={studentData.semester_grades.map((term, index) => {
                        const diligencePct = term.configs?.diligence_percentage ?? 40;
                        const academicPct = term.configs?.academic_percentage ?? 60;
                        const controlScore = term.configs?.control_score ?? 2.5;

                        // Định nghĩa bảng điểm chi tiết
                        const detailedColumns = [
                          { title: 'Tên đầu điểm / Bài kiểm tra', dataIndex: 'score_type_name', key: 'type' },
                          { title: 'Lần kiểm tra', dataIndex: 'score_order', key: 'order', align: 'center' },
                          {
                            title: 'Điểm số',
                            dataIndex: 'score_value',
                            key: 'value',
                            align: 'center',
                            render: (val) => <Text strong style={{ fontSize: 16, color: '#1e3a8a' }}>{val ?? '-'}</Text>
                          }
                        ];

                        return {
                          key: `term_${index}`,
                          label: `${term.academic_year_name} - ${term.semester_name}`,
                          children: (
                            <div className="term-grade-detail">
                              {/* Class and Block */}
                              <div className="class-badge-row">
                                <span className="class-badge">Lớp: <strong>{term.class_name}</strong></span>
                                <span className="block-badge">Phân đoàn/Ngành: <strong>{term.block_name}</strong></span>
                              </div>

                              {/* Summary Cards */}
                              <div className="term-summary-grid">
                                <div className="summary-card academic">
                                  <div className="summary-card-title">Kết quả Học lực</div>
                                  <div className="summary-card-value">{term.summary.dhl ?? '-'}</div>
                                  <div className="summary-card-desc">Trung bình học lực (tỷ trọng {academicPct}%)</div>
                                </div>

                                <div className="summary-card diligence">
                                  <div className="summary-card-title">Kết quả Chuyên cần</div>
                                  <div className="summary-card-value">{term.summary.dcc ?? '-'}</div>
                                  <div className="summary-card-desc">Trung bình chuyên cần (tỷ trọng {diligencePct}%)</div>
                                  {term.summary.is_controlled && (
                                    <Tag color="error" className="control-tag">Không đạt điểm khống chế</Tag>
                                  )}
                                </div>

                                <div className="summary-card total">
                                  <div className="summary-card-title">Trung bình Học kỳ</div>
                                  <div className="summary-card-value highlight">{term.summary.tbhk ?? '-'}</div>
                                  <div className="summary-card-desc">Tổng điểm TBHK (Học lực + Chuyên cần)</div>
                                </div>
                              </div>

                              {/* Attendance details progress bar */}
                              <Card title={<Space><CheckCircleOutlined /> Chi tiết điểm chuyên cần & tham gia sinh hoạt</Space>} className="detail-section-card" size="small">
                                <div className="attendance-bars">
                                  <div className="attendance-bar-item">
                                    <div className="attendance-bar-label">
                                      <span>Tham gia Thánh lễ:</span>
                                      <strong>{term.summary.mass_present}{term.attendance_config.mass_required ? `/${term.attendance_config.mass_required}` : ''} buổi</strong>
                                    </div>
                                    <div className="bar-bg">
                                      <div
                                        className="bar-fill"
                                        style={{
                                          width: `${Math.min(100, (term.summary.mass_present / (term.attendance_config.mass_required || 1)) * 100)}%`,
                                          backgroundColor: '#52c41a'
                                        }}
                                      />
                                    </div>
                                    <div className="bar-sub-label">Vắng mặt: {term.summary.mass_absent} buổi (Giới hạn cho phép: {term.attendance_config.mass_allowed_absence} buổi)</div>
                                  </div>

                                  <div className="attendance-bar-item">
                                    <div className="attendance-bar-label">
                                      <span>Tham gia học Giáo lý:</span>
                                      <strong>{term.summary.catechism_present}{term.attendance_config.catechism_required ? `/${term.attendance_config.catechism_required}` : ''} buổi</strong>
                                    </div>
                                    <div className="bar-bg">
                                      <div
                                        className="bar-fill"
                                        style={{
                                          width: `${Math.min(100, (term.summary.catechism_present / (term.attendance_config.catechism_required || 1)) * 100)}%`,
                                          backgroundColor: '#1890ff'
                                        }}
                                      />
                                    </div>
                                    <div className="bar-sub-label">Vắng mặt: {term.summary.catechism_absent} buổi (Giới hạn cho phép: {term.attendance_config.catechism_allowed_absence} buổi)</div>
                                  </div>
                                </div>

                                <div className="diligence-sub-points">
                                  <div className="sub-point">Điểm chuyên cần Thánh lễ: <strong>{term.summary.tl ?? '-'}</strong></div>
                                  <div className="sub-point">Điểm chuyên cần Giáo lý: <strong>{term.summary.gl ?? '-'}</strong></div>
                                  {term.summary.ethics_score !== null && (
                                    <div className="sub-point">Điểm Đạo đức: <strong>{term.summary.ethics_score}</strong></div>
                                  )}
                                </div>

                                {term.summary.warnings && term.summary.warnings.length > 0 && (
                                  <Alert
                                    message="Cảnh báo chuyên cần"
                                    description={term.summary.warnings.join(', ')}
                                    type="warning"
                                    showIcon
                                    style={{ marginTop: 12 }}
                                  />
                                )}
                              </Card>

                              {/* Detailed scores table */}
                              <Card title={<Space><BookOutlined /> Chi tiết điểm kiểm tra định kỳ</Space>} className="detail-section-card" size="small" style={{ marginTop: 16 }}>
                                <Table
                                  dataSource={term.detailed_scores}
                                  columns={detailedColumns}
                                  rowKey={(r, i) => `${r.score_type_id}_${i}`}
                                  pagination={false}
                                  size="small"
                                  bordered
                                />
                              </Card>
                            </div>
                          )
                        };
                      })}
                    />
                  ) : (
                    <Alert message="Chưa có thông tin điểm số" description="Học viên này chưa có điểm số học tập hoặc điểm danh được ghi nhận cho niên học hiện tại." type="info" showIcon />
                  )}
                </div>
              </div>
            )}

            {/* Instruction block */}
            <div className="instructions-section">
              <ul className="instruction-list">
                <li>Phụ huynh nhập mã học viên của con em để tra cứu trực tuyến kết quả học tập và tình hình điểm danh chuyên cần.</li>
                <li>Giáo lý viên/Trưởng phân đoàn vui lòng đăng nhập để thực hiện quản lý, điểm danh và cập nhật hồ sơ các em thiếu nhi.</li>
                <li>Hỗ trợ đăng ký sử dụng phần mềm hoặc cấp thẻ học viên, FaceID vui lòng liên hệ Ban Thường Vụ Giáo xứ.</li>
              </ul>

              {/* Styled download app buttons */}
              <div className="download-apps">
                <a href="#playstore" className="app-download-btn">
                  <AndroidOutlined className="btn-app-icon" />
                  <div className="btn-text">
                    <span className="small-text">Tải về trên</span>
                    <span className="big-text">Google Play</span>
                  </div>
                </a>
                <a href="#appstore" className="app-download-btn">
                  <AppleOutlined className="btn-app-icon" />
                  <div className="btn-text">
                    <span className="small-text">Tải về trên</span>
                    <span className="big-text">App Store</span>
                  </div>
                </a>
              </div>
            </div>

            {/* ${systemName} CORE redirect button */}
            <div className="admin-redirect-card">
              <div className="admin-redirect-body">
                <div className="admin-redirect-left">
                  <h3>HỆ THỐNG {systemName} - CORE</h3>
                  <p>Phần mềm quản lý Thiếu nhi Giáo xứ - Tiết kiệm thời gian, tăng hiệu quả mục vụ</p>
                </div>
                <div className="admin-redirect-right">
                  <Button
                    type="primary"
                    size="large"
                    icon={<LoginOutlined />}
                    className="admin-login-btn"
                    onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                  >
                    {isLoggedIn ? 'ĐẾN TRANG QUẢN TRỊ' : 'ĐĂNG NHẬP HỆ THỐNG'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parish' && (
          <div className="parish-info-content">
            <Card className="info-card" bordered={false}>
              <Title level={3}>THÔNG TIN GIÁO XỨ NHÃ LỘNG</Title>
              <Paragraph>
                Giáo xứ Nhã Lộng nằm trên địa bàn xã Nhã Lộng, huyện Phú Bình, tỉnh Thái Nguyên. Giáo xứ thuộc Giáo hạt Thái Nguyên, Giáo phận Bắc Ninh.
              </Paragraph>
              <Paragraph>
                Với chặng đường phát triển lâu dài, Giáo xứ luôn chú trọng việc giáo dục đức tin và nhân bản cho các em Thiếu nhi thông qua các lớp Giáo lý và sinh hoạt phong trào Thiếu Nhi Thánh Thể. Phần mềm {systemName} được đưa vào ứng dụng nhằm hỗ trợ ban Giáo lý và quý Trưởng phụ trách quản lý chuyên cần và kết quả học tập của các em một cách khoa học, hiện đại hơn.
              </Paragraph>
              <Divider />
              <Descriptions title="Lịch Sinh Hoạt Giáo Lý & Thiếu Nhi" bordered column={1}>
                <Descriptions.Item label="Lớp Giáo lý các ngày thường">Thứ Ba & Thứ Năm (18h30 - 19h30)</Descriptions.Item>
                <Descriptions.Item label="Thánh lễ & Học Giáo lý Chủ Nhật">Chủ Nhật (07h30 - 10h00)</Descriptions.Item>
                <Descriptions.Item label="Sinh hoạt tập thể TNTT">Chiều Chủ Nhật cuối tháng (15h00 - 17h00)</Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}

        {activeTab === 'priest' && (
          <div className="priest-info-content">
            <Card className="info-card" bordered={false}>
              <Title level={3}>BAN ĐIỀU HÀNH & LINH MỤC PHỤ TRÁCH</Title>
              <div className="priest-profile-grid">
                <div className="priest-profile-card">
                  <Avatar size={100} icon={<UserOutlined />} className="priest-avatar" />
                  <h4>Cha Chánh Xứ</h4>
                  <p className="priest-name">Linh mục Đaminh Nguyễn Văn B</p>
                  <p className="priest-desc">Trực tiếp hướng dẫn đời sống đức tin, mục vụ Giáo lý xứ đoàn.</p>
                </div>
                <div className="priest-profile-card">
                  <Avatar size={100} icon={<UserOutlined />} className="priest-avatar" />
                  <h4>Cha Trợ Úy Xứ Đoàn</h4>
                  <p className="priest-name">Linh mục Giuse Đỗ Văn C</p>
                  <p className="priest-desc">Đồng hành cùng Phong trào Thiếu Nhi Thánh Thể Nhã Lộng.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Footer info */}
        <footer className="footer">
          <div className="footer-line">Giáo phận Bắc Ninh - Giáo xứ Nhã Lộng</div>
          <div className="footer-line font-medium">{systemName} - Phần mềm quản lý Thiếu Nhi thông minh</div>
         
        </footer>
      </div>

      {/* Styled Printable Section for Student Report Card */}
      {studentData && (
        <div className="print-section print-only">
          {studentData.semester_grades.map((term, index) => {
            const tbhk = term.summary.tbhk ?? '-';
            const dhl = term.summary.dhl ?? '-';
            const dcc = term.summary.dcc ?? '-';

            // Xếp loại học lực
            let classification = 'Yếu';
            const tb = parseFloat(tbhk);
            if (!isNaN(tb)) {
              if (tb >= 9.5) classification = 'Xuất sắc';
              else if (tb >= 8.0) classification = 'Giỏi';
              else if (tb >= 6.5) classification = 'Khá';
              else if (tb >= 5.0) classification = 'Trung bình';
            }

            return (
              <div key={index} className="print-page">
                <table className="print-header-layout">
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', textAlign: 'left' }}>
                        <div style={{ fontSize: 13, textTransform: 'uppercase' }}>Giáo Phận Xuân Lộc</div>
                        <div style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' }}>Giáo Xứ Nhã Lộng</div>
                      </td>
                      <td style={{ width: '50%', textAlign: 'right' }}>
                        <div style={{ fontSize: 12 }}>Mã HV: <strong>{studentData.student.code}</strong></div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="print-title-wrapper">
                  <h2 className="print-main-title">BẢNG ĐIỂM KẾT QUẢ HỌC TẬP</h2>
                  <div className="print-sub-title">{term.academic_year_name} - {term.semester_name}</div>
                  <div className="print-cross">☧</div>
                </div>

                <div className="print-student-info">
                  <table className="print-info-table">
                    <tbody>
                      <tr>
                        <td>Họ tên học viên: <strong>{studentData.student.saint_name} {studentData.student.first_name} {studentData.student.last_name}</strong></td>
                        <td>Ngày sinh: <strong>{studentData.student.dob ? dayjs(studentData.student.dob).format('DD/MM/YYYY') : ''}</strong></td>
                      </tr>
                      <tr>
                        <td>Lớp: <strong>{term.class_name}</strong></td>
                        <td>Phân đoàn: <strong>{term.block_name}</strong></td>
                      </tr>
                      <tr>
                        <td>Nơi sinh: <strong>{studentData.student.pob || ''}</strong></td>
                        <td>Địa chỉ: <strong>{studentData.student.address || ''}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="print-section-title">I. ĐIỂM SỐ CHI TIẾT (HỌC LỰC)</div>
                <table className="print-data-table">
                  <thead>
                    <tr>
                      <th>Đầu điểm / Bài kiểm tra</th>
                      <th style={{ width: 100 }}>Lần thứ</th>
                      <th style={{ width: 120 }}>Điểm số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.detailed_scores.map((score, i) => (
                      <tr key={i}>
                        <td>{score.score_type_name}</td>
                        <td style={{ textAlign: 'center' }}>{score.score_order}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{score.score_value ?? '-'}</td>
                      </tr>
                    ))}
                    {term.detailed_scores.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>Chưa ghi nhận điểm thi</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="print-section-title" style={{ marginTop: 20 }}>II. CHUYÊN CẦN & ĐẠO ĐỨC</div>
                <table className="print-data-table">
                  <thead>
                    <tr>
                      <th>Nội dung chuyên cần</th>
                      <th>Tham gia / Yêu cầu</th>
                      <th>Vắng mặt</th>
                      <th>Điểm chuyên cần</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Tham dự Thánh lễ</td>
                      <td style={{ textAlign: 'center' }}>{term.summary.mass_present}/{term.attendance_config.mass_required || 0}</td>
                      <td style={{ textAlign: 'center' }}>{term.summary.mass_absent} (Cho phép: {term.attendance_config.mass_allowed_absence})</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{term.summary.tl}</td>
                    </tr>
                    <tr>
                      <td>Tham gia học Giáo lý</td>
                      <td style={{ textAlign: 'center' }}>{term.summary.catechism_present}/{term.attendance_config.catechism_required || 0}</td>
                      <td style={{ textAlign: 'center' }}>{term.summary.catechism_absent} (Cho phép: {term.attendance_config.catechism_allowed_absence})</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{term.summary.gl}</td>
                    </tr>
                    {term.summary.ethics_score !== null && (
                      <tr>
                        <td>Điểm Đạo đức / Tư cách</td>
                        <td colSpan={2} style={{ textAlign: 'center', color: '#666' }}>Đánh giá tư cách sinh hoạt</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{term.summary.ethics_score}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="print-section-title" style={{ marginTop: 20 }}>III. KẾT QUẢ TỔNG HỢP</div>
                <table className="print-summary-table">
                  <tbody>
                    <tr>
                      <td>Điểm trung bình Học lực (ĐHL): <strong>{dhl}</strong></td>
                      <td>Điểm trung bình Chuyên cần (ĐCC): <strong>{dcc}</strong></td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ fontSize: 16 }}>
                        Điểm tổng kết học kỳ (TBHK): <strong style={{ color: '#000080', fontSize: 18 }}>{tbhk}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Xếp loại: <strong>{classification}</strong></td>
                      <td>Kết quả: <strong>{term.summary.is_controlled ? 'Ở lại lớp (Khống chế)' : 'Đạt yêu cầu'}</strong></td>
                    </tr>
                  </tbody>
                </table>

                <div className="print-signatures">
                  <table style={{ width: '100%', border: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '50%', textAlign: 'center', border: 'none' }}>
                          <div style={{ fontStyle: 'italic', marginBottom: 60 }}>Giáo lý viên chủ nhiệm</div>
                          <div style={{ fontWeight: 'bold' }}>(Ký và ghi rõ họ tên)</div>
                        </td>
                        <td style={{ width: '50%', textAlign: 'center', border: 'none' }}>
                          <div style={{ fontStyle: 'italic', marginBottom: 60 }}>Cha Tuyên Úy / Trưởng ban Giáo lý</div>
                          <div style={{ fontWeight: 'bold' }}>(Ký tên và đóng dấu)</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CHATBOT AI WIDGET --- */}
      <div className="print-hide">
        {/* Floating Chat Button */}
        <button className={`chatbot-fab ${chatOpen ? 'active' : ''}`} onClick={() => setChatOpen(!chatOpen)}>
          {chatOpen ? <CloseOutlined className="fab-icon" /> : <RobotOutlined className="fab-icon" />}
          {!chatOpen && <span className="fab-tooltip">Hỏi Trợ Lý AI</span>}
        </button>

        {/* Chat window Overlay */}
        <div className={`chat-window-overlay ${chatOpen ? 'open' : ''}`}>
          <div className="chat-header">
            <Avatar size={40} icon={<RobotOutlined />} className="chat-avatar-title" />
            <div className="chat-header-text">
              <span className="chat-title">Trợ Lý {systemName} AI</span>
              <span className="chat-status"><span className="status-dot"></span> Đang hoạt động</span>
            </div>
            <button className="chat-close-btn" onClick={() => setChatOpen(false)}>
              <CloseOutlined />
            </button>
          </div>

          <div className="chat-body" id="chat-body-scroll">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}>
                {msg.sender === 'ai' && <Avatar size={30} icon={<RobotOutlined />} className="bubble-avatar" />}
                <div className="chat-bubble">
                  {msg.text.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
            {chatTyping && (
              <div className="chat-bubble-row ai-row">
                <Avatar size={30} icon={<RobotOutlined />} className="bubble-avatar" />
                <div className="chat-bubble typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-suggestions">
            {suggestedQuestions.map((q, idx) => (
              <button key={idx} className="suggestion-chip" onClick={() => handleSendChat(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="chat-footer">
            <Input
              placeholder="Nhập câu hỏi của bạn..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onPressEnter={() => handleSendChat()}
              className="chat-input"
              suffix={
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={() => handleSendChat()}
                  className="chat-send-btn"
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Styled JSX for the rich, premium design */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .landing-container {
          min-height: 100vh;
          background: #f9f9fc;
          color: #212529;
          font-family: Poppins, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Top Header / Navbar */
        .navbar {
          height: 70px;
          padding: 0 40px;
          background: #2e5779;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .nav-logo-img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          padding: 2px;
        }
        .logo-text {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 1px;
          color: white !important;
        }
        .navbar-links {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* Quick Link Chip style for navbar tabs */
        .nav-tab {
          font-size: 13px;
          font-weight: 700;
          color: #2e5779 !important;
          border: 1px solid rgba(46, 87, 121, 0.35) !important;
          border-radius: 999px;
          padding: 7px 14px;
          background: linear-gradient(180deg, #f3f9ff 0%, #dfeefb 100%);
          box-shadow: 0 4px 12px rgba(46, 87, 121, 0.18);
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .nav-tab:hover {
          color: #1f4563 !important;
          background: linear-gradient(180deg, #ffffff 0%, #d4e9fb 100%);
          box-shadow: 0 8px 18px rgba(46, 87, 121, 0.24);
          transform: translateY(-1px);
        }
        .nav-tab.active {
          background: linear-gradient(135deg, #2e5779 0%, #406789 100%) !important;
          color: white !important;
          border: 1px solid #2e5779 !important;
          box-shadow: 0 4px 15px rgba(46, 87, 121, 0.3);
        }

        /* Content Area */
        .main-content-scroll {
          margin-top: 70px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          overflow-y: auto;
          background: #f9f9fc;
        }
        .portal-content {
          width: 100%;
          max-width: 900px;
        }

        /* Hero branding */
        .hero-branding {
          text-align: center;
          margin-bottom: 35px;
        }
        .hero-logo-wrapper {
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 50%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(46, 87, 121, 0.15);
        }
        .hero-logo {
          width: 80px;
          height: 80px;
        }
        .hero-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          color: #2e5779;
          letter-spacing: 1px;
        }
        .hero-subtitle {
          font-size: 15px;
          font-weight: 700;
          color: #2e5779;
          letter-spacing: 2px;
          margin: 4px 0 0;
          text-transform: uppercase;
        }

        /* Tra cứu Card - style color matching header */
        .search-card {
          background: #2e5779 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(46, 87, 121, 0.15) !important;
          padding: 24px !important;
          margin-bottom: 24px;
        }
        .search-header {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
          text-align: center;
        }
        .search-form-row {
          display: flex;
          gap: 12px;
        }
        .search-input {
          height: 44px !important;
          border-radius: 6px !important;
          background: white !important;
          border: 1px solid #e2e5ec !important;
          color: #495057 !important;
          font-size: 14px !important;
        }
        .search-input::placeholder {
          color: #74788d !important;
        }
        .search-input:focus {
          border-color: #3498db !important;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2) !important;
        }
        .search-icon-prefix {
          color: #74788d;
          font-size: 18px;
          margin-right: 8px;
        }
        .search-btn {
          height: 44px !important;
          padding: 0 24px !important;
          border-radius: 6px !important;
          background: rgb(64, 103, 137) !important;
          border: none !important;
          color: white !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease !important;
        }
        .search-btn:hover {
          background: rgb(52, 152, 219) !important;
          transform: translateY(-1px);
        }
        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          padding: 10px 14px;
          margin-top: 14px;
          color: #ef4444;
          font-size: 14px;
        }
        .error-alert-icon {
          font-size: 16px;
        }

        /* Results panel */
        .results-container {
          animation: fadeInUp 0.5s ease-out;
          margin-bottom: 24px;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Profile White Card with subtle shadow */
        .profile-card {
          background: white !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          margin-bottom: 16px;
        }
        .profile-body {
          display: flex;
          gap: 32px;
          align-items: flex-start;
          padding: 16px;
        }
        @media (max-width: 768px) {
          .profile-body {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
        .profile-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-width: 140px;
        }
        .profile-avatar {
          border: 3px solid #dee2e6;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          background: #f8f9fa;
        }
        .student-code-tag {
          font-size: 13px;
          font-weight: 700;
          background: #2e5779 !important;
          color: white !important;
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 1px;
        }
        .qr-wrapper {
          background: white;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border: 1px solid #dee2e6;
        }
        .profile-right {
          flex: 1;
        }
        .student-name {
          font-size: 26px;
          font-weight: 800;
          color: #2e5779 !important;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .student-name .saint-name {
          color: #406789 !important;
          font-weight: 500;
          font-size: 22px;
        }
        .student-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 576px) {
          .student-meta-grid {
            grid-template-columns: 1fr;
          }
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .meta-label {
          font-size: 12px;
          color: #64748b !important;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .meta-value {
          font-size: 15px;
          font-weight: 600;
          color: #212529 !important;
        }

        /* Print btn bar */
        .print-action-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }
        .print-btn {
          border-radius: 8px !important;
          background: white !important;
          border: 1px solid #2e5779 !important;
          color: #2e5779 !important;
          height: 40px !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
        }
        .print-btn:hover {
          background: #2e5779 !important;
          color: white !important;
          border-color: #2e5779 !important;
        }

        /* Semesters tab panel */
        .scores-results-section {
          background: white !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 12px !important;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .semester-tabs .ant-tabs-nav-list {
          background: #f8f9fa !important;
          padding: 4px;
          border-radius: 12px;
          border: 1px solid #dee2e6;
        }
        .semester-tabs .ant-tabs-tab {
          border-radius: 8px !important;
          background: transparent !important;
          border: none !important;
          color: #6c757d !important;
          transition: all 0.3s;
        }
        .semester-tabs .ant-tabs-tab-active {
          background: linear-gradient(135deg, #2e5779 0%, #406789 100%) !important;
        }
        .semester-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: white !important;
          font-weight: 700 !important;
        }
        .class-badge-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .class-badge, .block-badge {
          background: rgba(46, 87, 121, 0.1);
          color: #2e5779;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid rgba(46, 87, 121, 0.2);
          font-weight: 600;
        }

        /* Summary grade cards */
        .term-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .term-summary-grid {
            grid-template-columns: 1fr;
          }
        }
        .summary-card {
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #dee2e6 !important;
        }
        .summary-card.academic {
          background: linear-gradient(135deg, rgba(46, 87, 121, 0.05) 0%, rgba(46, 87, 121, 0.1) 100%);
          border-color: rgba(46, 87, 121, 0.2) !important;
        }
        .summary-card.diligence {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.1) 100%);
          border-color: rgba(168, 85, 247, 0.2) !important;
        }
        .summary-card.total {
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.15) 100%);
          border-color: rgba(234, 179, 8, 0.2) !important;
        }
        .summary-card-title {
          font-size: 13px;
          text-transform: uppercase;
          font-weight: 700;
          color: #4b5563;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .summary-card-value {
          font-size: 38px;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .summary-card-value.highlight {
          color: #d97706;
        }
        .summary-card-desc {
          font-size: 11px;
          color: #6b7280;
        }
        .control-tag {
          margin-top: 8px !important;
        }

        /* Detail Cards sections */
        .detail-section-card {
          background: white !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02) !important;
        }
        .detail-section-card .ant-card-head {
          border-bottom: 1px solid #dee2e6 !important;
          background: #f8f9fa !important;
        }
        .detail-section-card .ant-card-head-title {
          color: #2e5779 !important;
          font-size: 15px !important;
          font-weight: 700 !important;
        }
        .detail-section-card .ant-card-body {
          padding: 16px !important;
        }

        /* Attendance Bars */
        .attendance-bars {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }
        .attendance-bar-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .attendance-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #4b5563;
        }
        .attendance-bar-label strong {
          color: #111827;
        }
        .bar-bg {
          height: 10px;
          background: #e5e7eb;
          border-radius: 5px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.8s ease-out;
        }
        .bar-sub-label {
          font-size: 11px;
          color: #6b7280;
        }
        .diligence-sub-points {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #4b5563;
          border-top: 1px dashed #dee2e6;
          padding-top: 12px;
        }
        .diligence-sub-points strong {
          color: #111827;
        }

        /* Tables override in light theme */
        .ant-table {
          background: transparent !important;
          color: #212529 !important;
        }
        .ant-table-thead > tr > th {
          background: #f8f9fa !important;
          color: #4b5563 !important;
          border-bottom: 1px solid #dee2e6 !important;
          font-weight: 700 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f3f4f6 !important;
          color: #1f2937 !important;
        }
        .ant-table-row:hover > td {
          background: #f9fafb !important;
        }

        /* Instructions list - White backdrop, styled list */
        .instructions-section {
          margin: 32px 0;
          background: white !important;
          border-radius: 8px !important;
          padding: 30px !important;
          border: 1px solid #dee2e6 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .instruction-list {
          padding-left: 20px;
          margin-bottom: 24px;
          color: #212529 !important;
        }
        .instruction-list li {
          margin-bottom: 12px;
          font-size: 15px;
          line-height: 1.6;
          color: #212529;
        }
        .instruction-list li strong {
          font-weight: 700;
          color: #2e5779;
        }
        .instruction-list a {
          color: #2e5779 !important;
          font-weight: 700;
          text-decoration: none;
        }
        .instruction-list a:hover {
          color: #2739c1 !important;
          text-decoration: underline !important;
        }
        .download-apps {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .app-download-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1px solid #dee2e6;
          color: #212529;
          padding: 8px 18px;
          border-radius: 8px;
          text-decoration: none;
          min-width: 170px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .app-download-btn:hover {
          border-color: #2e5779;
          background: #f8f9fa;
          transform: translateY(-2px);
        }
        .btn-app-icon {
          font-size: 28px;
          color: #2e5779;
        }
        .btn-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .btn-text .small-text {
          font-size: 10px;
          color: #6c757d;
          text-transform: uppercase;
        }
        .btn-text .big-text {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          color: #2e5779;
        }

        /* ${systemName} CORE login redirect card */
        .admin-redirect-card {
          background: linear-gradient(135deg, #2f6f97 0%, #406789 100%) !important;
          border-radius: 15px !important;
          padding: 24px !important;
          box-shadow: 0 10px 25px rgba(64, 103, 137, 0.35) !important;
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
        }
        .admin-redirect-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .admin-redirect-body {
            flex-direction: column;
            text-align: center;
          }
        }
        .admin-redirect-left h3 {
          color: white !important;
          font-size: 22px;
          font-weight: bold;
          margin: 0 0 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 1px;
        }
        .admin-redirect-left p {
          color: #dfeefb;
          margin: 0;
          font-size: 14px;
        }
        .admin-login-btn {
          height: 48px !important;
          border-radius: 50px !important;
          background: white !important;
          border: none !important;
          color: rgb(47, 111, 151) !important;
          font-weight: bold !important;
          font-size: 14px !important;
          letter-spacing: 0.5px !important;
          padding: 0 30px !important;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
          transition: all 0.3s ease !important;
        }
        .admin-login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
        }

        /* Info pages */
        .info-card {
          background: white !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 12px !important;
          width: 100%;
          max-width: 800px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .info-card .ant-typography {
          color: #212529 !important;
        }
        .info-card p {
          color: #4b5563;
          font-size: 15px;
          line-height: 1.6;
        }
        .ant-descriptions-title {
          color: #2e5779 !important;
          font-weight: 700 !important;
        }
        .ant-descriptions-item-label {
          background: #f8f9fa !important;
          color: #4b5563 !important;
          font-weight: 600 !important;
        }
        .ant-descriptions-item-content {
          color: #212529 !important;
          background: white !important;
        }
        
        .priest-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 24px;
        }
        @media (max-width: 576px) {
          .priest-profile-grid {
            grid-template-columns: 1fr;
          }
        }
        .priest-profile-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .priest-avatar {
          background: white;
          border: 2px solid #dee2e6;
          margin-bottom: 12px;
        }
        .priest-profile-card h4 {
          color: #2e5779;
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 700;
        }
        .priest-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
        }
        .priest-desc {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        /* Footer */
        .footer {
          margin-top: 50px;
          padding: 30px 20px;
          text-align: center;
          background: #2e5779 !important;
          border-top: none !important;
          width: 100%;
        }
        .footer-line {
          font-size: 13px;
          color: white !important;
          margin-bottom: 8px;
        }
        .footer-line.font-medium {
          color: white !important;
          font-weight: 500;
        }
        .footer-line a {
          color: white !important;
          font-weight: 600;
        }
        .footer-line a:hover {
          text-decoration: underline !important;
        }

        /* SPIN / LOADING override */
        .ant-spin-text {
          color: #2e5779 !important;
          font-weight: 600;
          margin-top: 8px;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          padding: 40px;
        }

        /* Print Styling */
        .print-only {
          display: none;
        }

        @media print {
          .print-hide {
            display: none !important;
          }
          .landing-container {
            background: white !important;
            color: black !important;
            min-height: auto !important;
          }
          .print-only {
            display: block !important;
            background: white !important;
            color: black !important;
          }
          .print-page {
            page-break-after: always;
            padding: 30px 40px;
            font-family: 'Times New Roman, Times, serif';
            color: black;
            background: white;
          }
          .print-header-layout {
            width: 100%;
            border-bottom: 2px solid black;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .print-title-wrapper {
            text-align: center;
            margin-bottom: 24px;
          }
          .print-main-title {
            font-size: 22px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            color: black;
          }
          .print-sub-title {
            font-size: 15px;
            margin-top: 4px;
            font-style: italic;
          }
          .print-cross {
            font-size: 20px;
            margin-top: 6px;
          }
          .print-student-info {
            margin-bottom: 20px;
          }
          .print-info-table {
            width: 100%;
            border: none;
          }
          .print-info-table td {
            border: none !important;
            padding: 4px 0 !important;
            font-size: 14px;
          }
          .print-section-title {
            font-weight: bold;
            font-size: 14px;
            margin-top: 15px;
            margin-bottom: 8px;
            border-bottom: 1px solid black;
            padding-bottom: 2px;
          }
          .print-data-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-data-table th, .print-data-table td {
            border: 1px solid black !important;
            padding: 6px 8px !important;
            font-size: 13px;
          }
          .print-data-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold;
            color: black !important;
          }
          .print-summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-summary-table td {
            border: 1px solid black !important;
            padding: 8px 12px !important;
            font-size: 14px;
          }
          .print-signatures {
            margin-top: 40px;
          }
          .print-signatures td {
            border: none !important;
            font-size: 14px;
          }
        }

        /* Floating Chat Button */
        .chatbot-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2e5779 0%, #406789 100%);
          border: none;
          color: white;
          box-shadow: 0 8px 24px rgba(46, 87, 121, 0.4), 0 0 0 0px rgba(46, 87, 121, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: fabPulse 2s infinite;
        }
        @keyframes fabPulse {
          0% {
            box-shadow: 0 8px 24px rgba(46, 87, 121, 0.4), 0 0 0 0px rgba(46, 87, 121, 0.4);
          }
          70% {
            box-shadow: 0 8px 24px rgba(46, 87, 121, 0.4), 0 0 0 15px rgba(46, 87, 121, 0);
          }
          100% {
            box-shadow: 0 8px 24px rgba(46, 87, 121, 0.4), 0 0 0 0px rgba(46, 87, 121, 0);
          }
        }
        .chatbot-fab:hover {
          transform: scale(1.08) rotate(5deg);
          background: linear-gradient(135deg, #406789 0%, #2e5779 100%);
        }
        .chatbot-fab.active {
          transform: rotate(90deg);
          background: #ef4444;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
          animation: none;
        }
        .fab-icon {
          font-size: 26px;
        }
        .fab-tooltip {
          position: absolute;
          right: 75px;
          background: rgba(46, 87, 121, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .chatbot-fab:hover .fab-tooltip {
          opacity: 1;
          transform: translateX(0);
        }

        /* Chat window overlay */
        .chat-window-overlay {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 380px;
          height: 520px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #dee2e6;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2);
        }
        .chat-window-overlay.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }
        @media (max-width: 480px) {
          .chat-window-overlay {
            width: calc(100% - 32px);
            right: 16px;
            bottom: 95px;
            height: calc(80vh - 100px);
          }
        }

        /* Chat Header */
        .chat-header {
          padding: 16px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chat-avatar-title {
          background: #2e5779;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .chat-header-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .chat-title {
          font-weight: 700;
          font-size: 15px;
          color: #2e5779;
        }
        .chat-status {
          font-size: 11px;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 8px #10b981;
        }
        .chat-close-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .chat-close-btn:hover {
          color: #ef4444;
          background: rgba(0, 0, 0, 0.05);
        }

        /* Chat Body */
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #fdfdfd;
        }
        .chat-bubble-row {
          display: flex;
          gap: 10px;
          max-width: 85%;
          animation: bubbleIn 0.3s ease-out forwards;
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-row {
          align-self: flex-start;
        }
        .user-row {
          align-self: flex-end;
          flex-direction: row-reverse;
          max-width: 80%;
        }
        .bubble-avatar {
          background: #dee2e6;
          border: 1px solid #dee2e6;
          flex-shrink: 0;
        }
        .chat-bubble {
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .ai-row .chat-bubble {
          background: #f1f3f5;
          border: 1px solid #dee2e6;
          color: #212529;
          border-top-left-radius: 4px;
        }
        .user-row .chat-bubble {
          background: #2e5779;
          color: white;
          border-top-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(46, 87, 121, 0.2);
        }

        /* Typing dots animation */
        .typing-bubble {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 20px !important;
        }
        .typing-bubble .dot {
          width: 6px;
          height: 6px;
          background: #64748b;
          border-radius: 50%;
          animation: bounceDot 1.4s infinite ease-in-out both;
        }
        .typing-bubble .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-bubble .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Suggestions chips */
        .chat-suggestions {
          padding: 0 20px 10px;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          background: #fdfdfd;
        }
        .chat-suggestions::-webkit-scrollbar {
          display: none;
        }
        .suggestion-chip {
          background: rgba(46, 87, 121, 0.05);
          border: 1px solid rgba(46, 87, 121, 0.15);
          color: #2e5779;
          padding: 6px 12px;
          border-radius: 14px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .suggestion-chip:hover {
          background: #2e5779;
          border-color: #2e5779;
          color: white;
        }

        /* Chat footer */
        .chat-footer {
          padding: 16px 20px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }
        .chat-input {
          border-radius: 20px !important;
          background: white !important;
          border: 1px solid #dee2e6 !important;
          color: #212529 !important;
          padding: 8px 16px !important;
          height: 40px !important;
        }
        .chat-input::placeholder {
          color: #64748b;
        }
        .chat-send-btn {
          color: #2e5779 !important;
          font-size: 16px;
          padding: 0 !important;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .chat-send-btn:hover {
          color: #3498db !important;
          transform: scale(1.1);
        }
      `}} />
    </div>
  );
};

export default LandingPage;
