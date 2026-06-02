import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Result, Button } from 'antd';

const RoleRoute = ({ children, forbiddenRoles = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  // Nếu vai trò của user nằm trong danh sách cấm
  if (forbiddenRoles.includes(user.role)) {
    return (
      <div style={{ padding: '50px' }}>
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Quay lại trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  return children;
};

export default RoleRoute;
