import { Layout, Avatar, Button, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Header.module.scss';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

/**
 * Шапка застосунку.
 * Показує ім'я поточного користувача та кнопку виходу.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AntHeader className={styles.header}>
      <Typography.Title level={4} className={styles.title}>
        Чат
      </Typography.Title>

      <Space size="middle">
        <Avatar icon={<UserOutlined />} />
        <Text strong>{user?.username ?? 'Гість'}</Text>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Вийти
        </Button>
      </Space>
    </AntHeader>
  );
}
