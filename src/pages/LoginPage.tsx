import { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/ApiClient';
import { extractError } from '../utils/extractError';
import styles from './auth.module.scss';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

/** Сторінка входу (без лейауту). */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const { access_token } = await apiClient.auth.login(
        values.username,
        values.password,
      );
      // Ім'я визначається з payload токена всередині AuthProvider.
      login(access_token);
      navigate('/chat', { replace: true });
    } catch (err) {
      message.error(extractError(err, 'Невірні облікові дані'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <Title level={3} className={styles.title}>
          Вхід
        </Title>
        <Form<LoginForm> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label="Ім'я користувача"
            rules={[{ required: true, message: "Введіть ім'я користувача" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="username" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введіть пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Увійти
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary">
          Немає акаунту? <Link to="/register">Зареєструватися</Link>
        </Text>
      </Card>
    </div>
  );
}
