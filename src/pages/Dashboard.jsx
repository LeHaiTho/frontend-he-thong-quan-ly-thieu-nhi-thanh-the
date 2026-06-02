import { systemName } from '../utils/constants';
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Space, Tag, Avatar } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ManOutlined,
  WomanOutlined,
  BarChartOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    totalTeachers: 0,
    currentYearName: 'N/A'
  });
  const [classStats, setClassStats] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setSummary(response.data.data.summary);
        setClassStats(response.data.data.classStats);
      }
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const chartData = {
    labels: classStats.map(item => item.name),
    datasets: [
      {
        label: 'Tổng',
        data: classStats.map(item => item.total_students),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
      {
        label: 'Nam',
        data: classStats.map(item => item.male_students),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      },
      {
        label: 'Nữ',
        data: classStats.map(item => item.female_students),
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên Lớp',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: 'Nam',
      dataIndex: 'male_students',
      key: 'male_students',
      align: 'center',
    },
    {
      title: 'Nữ',
      dataIndex: 'female_students',
      key: 'female_students',
      align: 'center',
    },
    {
      title: 'Tổng',
      dataIndex: 'total_students',
      key: 'total_students',
      align: 'center',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Chủ Nhiệm',
      key: 'head_teacher',
      render: (_, record) => {
        if (!record.head_teacher_first) return 'N/A';
        return `${record.head_teacher_saint || ''} ${record.head_teacher_first} ${record.head_teacher_last}`;
      }
    },
    {
      title: 'GLV Phụ',
      key: 'assistants',
      render: (_, record) => {
        if (!record.assistants || record.assistants.length === 0) return '-';
        return record.assistants.map(a => `${a.saint_name || ''} ${a.first_name} ${a.last_name}`).join(', ');
      }
    },
  ];

  return (
    <div className={`dashboard-page`} style={{ padding: `0 0 24px 0` }}>

      <div className={`w-full mb-6 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden`}>
        <div className={`flex items-center justify-between px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500`}>
          <span className={`text-blue font-semibold text-sm flex items-center gap-1.5`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            Thông báo hệ thống
          </span>
          <span className="text-blue-100 text-xs">20/05/2026</span>
        </div>

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">

          <div className="flex flex-col divide-y divide-gray-100 md:w-1/2">

            <div className="notice-item px-4 py-3 hover:bg-blue-50 active:bg-blue-100 transition-colors border-l-4 border-transparent cursor-pointer select-none">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-800">Đồng bộ dữ liệu PMS ↔ {systemName}</p>
                    <span className="flex-shrink-0 text-xs text-blue-400 font-medium whitespace-nowrap">Lưu ý</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">Giáo xứ dùng cả 2 hệ thống: vào hồ sơ học viên → mục <strong className="text-gray-700">Gia đình</strong> → bấm <strong className="text-gray-700">Liên kết PMS</strong> để đồng bộ trước mùa lãnh Bí Tích.</p>
                </div>
              </div>
              <div className="notice-detail pl-11">
                <div className="pt-2 mt-2 border-t border-blue-100">
                  <p className="text-sm text-gray-600">Để việc cập nhật dữ liệu qua lại giữa 2 hệ thống <strong>PMS – Thông tin Giáo dân</strong> và <strong>{systemName} – Quản lý Thiếu nhi</strong> được thống nhất và tiện dụng, nhất là trong dịp lãnh Bí Tích mùa hè sắp tới. Vì vậy những Giáo xứ nào đã sử dụng 2 hệ thống trên, xin lưu tâm việc đồng bộ dữ liệu ngay trên màn hình thông tin học viên ở mục <strong>Gia đình</strong> và bấm chọn nút <strong>Liên kết PMS</strong>.</p>
                </div>
              </div>
            </div>

            <div className={`notice-item px-4 py-3 hover:bg-yellow-50 active:bg-yellow-100 transition-colors border-l-4 border-transparent cursor-pointer select-none`}>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-800">Cập nhật hồ sơ Giáo Lý Viên</p>
                    <span className="flex-shrink-0 text-xs text-yellow-500 font-medium whitespace-nowrap">Quan trọng</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">Hướng tới báo cáo thường niên Giáo phận: xin cập nhật <strong className="text-gray-700">đúng cấp bậc</strong> và <strong className="text-gray-700">loại Giáo lý viên</strong> trong hồ sơ GLV.</p>
                </div>
              </div>
              <div className="notice-detail pl-11">
                <div className="pt-2 mt-2 border-t border-yellow-100">
                  <p className="text-sm text-gray-600">Hướng tới báo cáo thường niên hằng năm của Giáo phận, xin quý Anh Chị Giáo lý viên vào màn hình <strong>hồ sơ Giáo lý viên</strong> và cập nhật <strong>ĐÚNG</strong> về:</p>
                  <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-sm text-gray-600">
                    <li>Cấp bậc Giáo lý viên</li>
                    <li>Loại Giáo lý viên</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="notice-item px-4 py-3 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border-l-4 border-orange-400 cursor-pointer select-none transition-colors">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center shadow">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.974 7.974 0 01-2.343 5.657z"></path></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-orange-800">Đăng ký Đuốc Hồng &amp; Khoá huấn luyện</p>
                    <span className="flex-shrink-0 text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full font-medium">Sắp tới</span>
                  </div>
                  <p className="text-orange-600 text-sm mt-0.5">{systemName} hỗ trợ GLV đăng ký tham gia Đuốc Hồng và khoá huấn luyện ngay trên hệ thống — giúp Ban tổ chức chuẩn bị chu đáo hơn.</p>
                </div>
              </div>
              <div className="notice-detail pl-11">
                    <div className="pt-2 mt-2 border-t border-orange-200">
                      <p className="text-sm text-orange-700">Hệ thống {systemName} sẽ hỗ trợ quý Anh Chị Giáo lý viên <strong>đăng ký tham gia các đợt Đuốc Hồng</strong> hoặc các khoá huấn luyện ngay trên hệ thống của mỗi Giáo xứ. Việc này sẽ giúp Ban tổ chức chuẩn bị chu đáo hơn trong công tác chuẩn bị.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="notice-item px-4 py-3 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border-l-4 border-purple-500 md:w-1/2 cursor-pointer select-none transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H7a2 2 0 00-2 2v2M15 3h2a2 2 0 012 2v2M9 21H7a2 2 0 01-2-2v-2M15 21h2a2 2 0 002-2v-2M9 12a3 3 0 106 0 3 3 0 00-6 0"></path></svg>
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold text-purple-900">Máy quét điểm danh khuôn mặt — Face ID</p>
                              <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse"></span>Mới
                              </span>
                            </div>
                            <p className="text-purple-800 text-sm leading-relaxed">Giúp đơn giản việc điểm danh thiếu nhi, bạn trẻ và học viên — <strong>không cần mang thẻ học viên</strong>. Thuận tiện, hiện đại khi đến Nhà thờ tham gia các sinh hoạt Giáo xứ.</p>
                          </div>
                        </div>
                        {/* <div className="notice-detail pl-11">
              <div className="pt-2 mt-2 border-t border-purple-200">
                <p className="text-sm text-purple-800 leading-relaxed">Máy quét điểm danh khuôn mặt <strong>Face ID</strong> giúp đơn giản việc điểm danh các em thiếu nhi cũng như các bạn trẻ, hoặc các học viên lớp Giáo lý Hôn nhân, Dự tòng — <strong>không cần mang thẻ học viên</strong>. Thuận tiện, hiện đại và thân thiện khi đến Nhà thờ tham gia các sinh hoạt của Giáo xứ.</p>
                <div className="mt-2.5 p-2.5 bg-purple-100 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">📞 Liên hệ đặt máy:</p>
                  <p className="text-sm text-purple-700 mt-0.5">Công ty <strong>Hachihi</strong> — <strong>0933 842 126</strong> — gặp anh Hải Hoàng</p>
                </div>
              </div>
            </div> */}
          </div>

        </div>
      </div>


              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered={false} className="stat-card" style={{ borderLeft: `4px solid #1890ff` }} loading={loading}>
                    <Statistic
                      title="Tổng số Học viên"
                      value={summary.totalStudents}
                      prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered={false} className="stat-card" style={{ borderLeft: '4px solid #52c41a' }} loading={loading}>
                    <Statistic
                      title="Tổng số Nam"
                      value={summary.maleStudents}
                      prefix={<ManOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered={false} className="stat-card" style={{ borderLeft: '4px solid #f5222d' }} loading={loading}>
                    <Statistic
                      title="Tổng số Nữ"
                      value={summary.femaleStudents}
                      prefix={<WomanOutlined style={{ color: '#f5222d' }} />}
                      valueStyle={{ color: '#f5222d' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered={false} className="stat-card" style={{ borderLeft: '4px solid #722ed1' }} loading={loading}>
                    <Statistic
                      title="Tổng số Giáo lý viên"
                      value={summary.totalTeachers}
                      prefix={<SolutionOutlined style={{ color: '#722ed1' }} />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Card
                title={<Space><BarChartOutlined /><span>Biểu đồ thống kê {summary.currentYearName}</span></Space>}
                bordered={false}
                style={{ marginBottom: 24 }}
                loading={loading}
              >
                <div style={{ height: 400 }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </Card>

              <Card
                title={<Space><TeamOutlined /><span>Sỉ số học viên theo lớp</span></Space>}
                bordered={false}
                bodyStyle={{ padding: 0 }}
                loading={loading}
              >
                <Table
                  columns={columns}
                  dataSource={classStats}
                  rowKey="id"
                  pagination={false}
                  bordered
                  size="small"
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0} colSpan={2} align="center">
                          <Text type="success">TỔNG CỘNG</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center">
                          <Text type="success">{summary.maleStudents}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="center">
                          <Text type="danger">{summary.femaleStudents}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="center">
                          <Text type="primary">{summary.totalStudents}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} colSpan={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>

              <style dangerouslySetInnerHTML={{
                __html: `
        .stat-card {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          transition: all 0.3s;
        }
        .stat-card:hover {
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }
        .dashboard-page .ant-table-thead > tr > th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

.dashboard-page .w-full{width:100%}
.dashboard-page .mb-6{margin-bottom:1.5rem}
.dashboard-page .mb-1{margin-bottom:0.25rem}
.dashboard-page .mt-0\\.5{margin-top:0.125rem}
.dashboard-page .mt-1\\.5{margin-top:0.375rem}
.dashboard-page .mt-2{margin-top:0.5rem}
.dashboard-page .mt-2\\.5{margin-top:0.625rem}
.dashboard-page .inline-block{display:inline-block}
.dashboard-page .flex{display:flex}
.dashboard-page .inline-flex{display:inline-flex}
.dashboard-page .h-1\\.5{height:0.375rem}
.dashboard-page .h-4{height:1rem}
.dashboard-page .h-8{height:2rem}
.dashboard-page .w-1\\.5{width:0.375rem}
.dashboard-page .w-4{width:1rem}
.dashboard-page .w-8{width:2rem}
.dashboard-page .min-w-0{min-width:0px}
.dashboard-page .flex-1{flex:1 1 0%}
.dashboard-page .flex-shrink-0{flex-shrink:0}
.dashboard-page .animate-pulse{animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite}
.dashboard-page .cursor-pointer{cursor:pointer}
.dashboard-page .select-none{-webkit-user-select:none;user-select:none}
.dashboard-page .list-inside{list-style-position:inside}
.dashboard-page .list-disc{list-style-type:disc}
.dashboard-page .flex-col{flex-direction:column}
.dashboard-page .items-start{align-items:flex-start}
.dashboard-page .items-center{align-items:center}
.dashboard-page .justify-center{justify-content:center}
.dashboard-page .justify-between{justify-content:space-between}
.dashboard-page .gap-1{gap:0.25rem}
.dashboard-page .gap-1\\.5{gap:0.375rem}
.dashboard-page .gap-2{gap:0.5rem}
.dashboard-page .gap-3{gap:0.75rem}
.dashboard-page .space-y-0\\.5 > :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.125rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.125rem * var(--tw-space-y-reverse))}
.dashboard-page .divide-y > :not([hidden]) ~ :not([hidden]){--tw-divide-y-reverse:0;border-top-width:calc(1px * calc(1 - var(--tw-divide-y-reverse)));border-bottom-width:calc(1px * var(--tw-divide-y-reverse))}
.dashboard-page .divide-gray-100 > :not([hidden]) ~ :not([hidden]){--tw-divide-opacity:1;border-color:rgb(243 244 246 / var(--tw-divide-opacity, 1))}
.dashboard-page .overflow-hidden{overflow:hidden}
.dashboard-page .whitespace-nowrap{white-space:nowrap}
.dashboard-page .rounded-full{border-radius:9999px}
.dashboard-page .rounded-lg{border-radius:0.5rem}
.dashboard-page .border{border-width:1px; border-style: solid;}
.dashboard-page .border-l-4{border-left-width:4px; border-style: solid;}
.dashboard-page .border-t{border-top-width:1px; border-style: solid;}
.dashboard-page .border-blue-100{--tw-border-opacity:1;border-color:rgb(219 234 254 / var(--tw-border-opacity, 1))}
.dashboard-page .border-gray-200{--tw-border-opacity:1;border-color:rgb(229 231 235 / var(--tw-border-opacity, 1))}
.dashboard-page .border-orange-200{--tw-border-opacity:1;border-color:rgb(254 215 170 / var(--tw-border-opacity, 1))}
.dashboard-page .border-orange-400{--tw-border-opacity:1;border-color:rgb(251 146 60 / var(--tw-border-opacity, 1))}
.dashboard-page .border-purple-200{--tw-border-opacity:1;border-color:rgb(233 213 255 / var(--tw-border-opacity, 1))}
.dashboard-page .border-purple-500{--tw-border-opacity:1;border-color:rgb(168 85 247 / var(--tw-border-opacity, 1))}
.dashboard-page .border-transparent{border-color:transparent}
.dashboard-page .border-yellow-100{--tw-border-opacity:1;border-color:rgb(254 249 195 / var(--tw-border-opacity, 1))}
.dashboard-page .bg-blue-100{--tw-bg-opacity:1;background-color:rgb(219 234 254 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-green-300{--tw-bg-opacity:1;background-color:rgb(134 239 172 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-orange-400{--tw-bg-opacity:1;background-color:rgb(251 146 60 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-orange-50{--tw-bg-opacity:1;background-color:rgb(255 247 237 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-purple-100{--tw-bg-opacity:1;background-color:rgb(243 232 255 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-purple-50{--tw-bg-opacity:1;background-color:rgb(250 245 255 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-purple-500{--tw-bg-opacity:1;background-color:rgb(168 85 247 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-yellow-100{--tw-bg-opacity:1;background-color:rgb(254 249 195 / var(--tw-bg-opacity, 1))}
.dashboard-page .bg-gradient-to-r{background-image:linear-gradient(to right, var(--tw-gradient-stops))}
.dashboard-page .from-blue-600{--tw-gradient-from:#2563eb var(--tw-gradient-from-position);--tw-gradient-to:rgb(37 99 235 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to)}
.dashboard-page .to-blue-500{--tw-gradient-to:#3b82f6 var(--tw-gradient-to-position)}
.dashboard-page .p-2\\.5{padding:0.625rem}
.dashboard-page .px-2{padding-left:0.5rem;padding-right:0.5rem}
.dashboard-page .px-4{padding-left:1rem;padding-right:1rem}
.dashboard-page .py-0\\.5{padding-top:0.125rem;padding-bottom:0.125rem}
.dashboard-page .py-2{padding-top:0.5rem;padding-bottom:0.5rem}
.dashboard-page .py-3{padding-top:0.75rem;padding-bottom:0.75rem}
.dashboard-page .pl-11{padding-left:2.75rem}
.dashboard-page .pt-2{padding-top:0.5rem}
.dashboard-page .text-sm{font-size:0.875rem;line-height:1.25rem}
.dashboard-page .text-xs{font-size:0.75rem;line-height:1rem}
.dashboard-page .font-medium{font-weight:500}
.dashboard-page .font-semibold{font-weight:600}
.dashboard-page .leading-relaxed{line-height:1.625}
.dashboard-page .text-blue-100{--tw-text-opacity:1;color:rgb(219 234 254 / var(--tw-text-opacity, 1))}
.dashboard-page .text-blue-400{--tw-text-opacity:1;color:rgb(96 165 250 / var(--tw-text-opacity, 1))}
.dashboard-page .text-blue-500{--tw-text-opacity:1;color:rgb(59 130 246 / var(--tw-text-opacity, 1))}
.dashboard-page .text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128 / var(--tw-text-opacity, 1))}
.dashboard-page .text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99 / var(--tw-text-opacity, 1))}
.dashboard-page .text-gray-700{--tw-text-opacity:1;color:rgb(55 65 81 / var(--tw-text-opacity, 1))}
.dashboard-page .text-gray-800{--tw-text-opacity:1;color:rgb(31 41 55 / var(--tw-text-opacity, 1))}
.dashboard-page .text-orange-600{--tw-text-opacity:1;color:rgb(234 88 12 / var(--tw-text-opacity, 1))}
.dashboard-page .text-orange-700{--tw-text-opacity:1;color:rgb(194 65 12 / var(--tw-text-opacity, 1))}
.dashboard-page .text-orange-800{--tw-text-opacity:1;color:rgb(154 52 18 / var(--tw-text-opacity, 1))}
.dashboard-page .text-purple-700{--tw-text-opacity:1;color:rgb(126 34 206 / var(--tw-text-opacity, 1))}
.dashboard-page .text-purple-800{--tw-text-opacity:1;color:rgb(107 33 168 / var(--tw-text-opacity, 1))}
.dashboard-page .text-purple-900{--tw-text-opacity:1;color:rgb(88 28 135 / var(--tw-text-opacity, 1))}
.dashboard-page .text-white{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}
.dashboard-page .text-yellow-500{--tw-text-opacity:1;color:rgb(234 179 8 / var(--tw-text-opacity, 1))}
.dashboard-page .shadow{--tw-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}
.dashboard-page .shadow-sm{--tw-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}
.dashboard-page .transition-colors{transition-property:color, background-color, border-color, fill, stroke, -webkit-text-decoration-color;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, -webkit-text-decoration-color;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}
.dashboard-page .hover\\:bg-blue-50:hover{--tw-bg-opacity:1;background-color:rgb(239 246 255 / var(--tw-bg-opacity, 1))}
.dashboard-page .hover\\:bg-orange-100:hover{--tw-bg-opacity:1;background-color:rgb(255 237 213 / var(--tw-bg-opacity, 1))}
.dashboard-page .hover\\:bg-purple-100:hover{--tw-bg-opacity:1;background-color:rgb(243 232 255 / var(--tw-bg-opacity, 1))}
.dashboard-page .hover\\:bg-yellow-50:hover{--tw-bg-opacity:1;background-color:rgb(254 252 232 / var(--tw-bg-opacity, 1))}
.dashboard-page .active\\:bg-blue-100:active{--tw-bg-opacity:1;background-color:rgb(219 234 254 / var(--tw-bg-opacity, 1))}
.dashboard-page .active\\:bg-orange-200:active{--tw-bg-opacity:1;background-color:rgb(254 215 170 / var(--tw-bg-opacity, 1))}
.dashboard-page .active\\:bg-purple-200:active{--tw-bg-opacity:1;background-color:rgb(233 213 255 / var(--tw-bg-opacity, 1))}
.dashboard-page .active\\:bg-yellow-100:active{--tw-bg-opacity:1;background-color:rgb(254 249 195 / var(--tw-bg-opacity, 1))}
@media (min-width: 768px){
    .dashboard-page .md\\:w-1\\/2{width:50%}
    .dashboard-page .md\\:flex-row{flex-direction:row}
    .dashboard-page .md\\:divide-x > :not([hidden]) ~ :not([hidden]){--tw-divide-x-reverse:0;border-right-width:calc(1px * var(--tw-divide-x-reverse));border-left-width:calc(1px * calc(1 - var(--tw-divide-x-reverse)))}
    .dashboard-page .md\\:divide-y-0 > :not([hidden]) ~ :not([hidden]){--tw-divide-y-reverse:0;border-top-width:calc(0px * calc(1 - var(--tw-divide-y-reverse)));border-bottom-width:calc(0px * var(--tw-divide-y-reverse))}
}
.dashboard-page .notice-item .notice-detail{max-height:0;overflow:hidden;transition:max-height 0.35s ease}
.dashboard-page .notice-item:hover .notice-detail{max-height:400px}
@keyframes pulse{50%{opacity:.5}}

      `}} />
    </div>
  );
};

export default Dashboard;
