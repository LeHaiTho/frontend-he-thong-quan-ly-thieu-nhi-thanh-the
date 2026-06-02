import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  ToolOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  console.log(user);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/students',
      icon: <IdcardOutlined />,
      label: 'Hồ sơ học viên',
    },
    ...(user?.role !== 'LECTURER' ? [
      {
        key: '/teachers',
        icon: <TeamOutlined />,
        label: 'Hồ sơ giáo lý viên',
      },
    ] : []),
    {
      key: '/attendance',
      icon: <CheckCircleOutlined />,
      label: 'Điểm danh học viên',
    },
    {
      key: '/scores',
      icon: <LineChartOutlined />,
      label: 'Điểm số học viên',
    },
    // Chỉ hiển thị Quản lý người dùng và Hệ thống cho ADMIN
    ...(user?.role_id === 'r1' ? [
      // {
      //   key: '/users',
      //   icon: <UserOutlined />,
      //   label: 'Quản lý người dùng',
      // },
      {
        key: '/system',
        icon: <ToolOutlined />,
        label: 'Hệ thống',
      },
    ] : []),
    ...(user?.role !== 'LECTURER' ? [
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      },
    ] : []),
  ];

  return (
    <Sider
      trigger={null}

      collapsed={collapsed}
      breakpoint="md"
      collapsedWidth="80"
      width={250}
      theme="light"
      className="sidebar-container"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
        zIndex: 100,
      }}
    >
      <div className="logo" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
        {/* <h2 style={{ margin: 0, color: '#1890ff', whiteSpace: 'nowrap' }}>
          {collapsed ? 'TNTT' : 'Quản Lý TNTT'}
        </h2> */}
        <img src="/icon-App-Computer.ico" alt="Logo" style={{ width: 50, height: 50 }} />

      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, marginTop: 16 }}
      />
    </Sider>
  );
};

export default Sidebar;
