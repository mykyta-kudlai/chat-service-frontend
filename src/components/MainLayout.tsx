import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import styles from './MainLayout.module.scss';

const { Content } = Layout;

/**
 * Основний лейаут захищеної частини застосунку.
 * Складається з шапки (Header) та області вкладеного маршруту (Outlet).
 */
export default function MainLayout() {
  return (
    <Layout className={styles.layout}>
      <Header />
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
