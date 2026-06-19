import { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/ApiClient';
import { extractError } from '../utils/extractError';
import styles from './auth.module.scss';

const { Title, Text } = Typography;

interface RegisterForm {
  username: string;
  password: string;
}

/** Сторінка реєстрації (без лейауту). */
export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const { access_token } = await apiClient.auth.register(
        values.username,
        values.password,
      );
      // Після реєстрації одразу логінимо отриманим токеном (ім'я — з payload).
      login(access_token);
      navigate('/chat', { replace: true });
    } catch (err) {
      message.error(extractError(err, 'Не вдалося зареєструватися'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <Title level={3} className={styles.title}>
          Реєстрація
        </Title>
        <Form<RegisterForm> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label="Ім'я користувача"
            rules={[
              { required: true, message: "Введіть ім'я користувача" },
              { min: 3, message: "Мінімум 3 символи" },
              { max: 20, message: 'Максимум 20 символів' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="username" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[
              { required: true, message: 'Введіть пароль' },
              { min: 6, message: 'Мінімум 6 символів' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Зареєструватися
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary">
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </Text>
      </Card>
    </div>
  );
}
