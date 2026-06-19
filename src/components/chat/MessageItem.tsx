import { useEffect, useState } from 'react';
import { List, Avatar, Typography, Image, Button, Space, Spin, App } from 'antd';
import { UserOutlined, DownloadOutlined, FileOutlined } from '@ant-design/icons';
import type { ChatMessage } from '../../types/message';
import { apiClient } from '../../api/ApiClient';
import styles from './MessageItem.module.scss';

const { Text } = Typography;

interface MessageItemProps {
  message: ChatMessage;
  /** Чи належить повідомлення поточному користувачу */
  isOwn: boolean;
}

/**
 * Один елемент списку повідомлень.
 */
export default function MessageItem({ message, isOwn }: MessageItemProps) {
  const { message: messageApi } = App.useApp();
  const { file } = message;
  const isImage = !!file && file.mimetype.startsWith('image/');

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Превʼю зображення: завантажуємо blob з токеном і робимо objectURL.
  useEffect(() => {
    if (!isImage || !file) {
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    // Скидаємо стан при зміні файлу, щоб не показувати старе превʼю чи помилку.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageError(false);

    apiClient.files
      .fetchObjectUrl(file.filename)
      .then((url) => {
        objectUrl = url;
        if (!cancelled) {
          setImageUrl(url);
        }
      })
      .catch(() => {
        // Файл не знайдено/не вдалося завантажити — показуємо текст помилки.
        if (!cancelled) {
          setImageError(true);
        }
      });

    // Звільняємо objectURL при розмонтуванні, щоб не текла памʼять.
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isImage, file]);

  // Завантаження не-зображення: тягнемо blob і ініціюємо збереження.
  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);
    try {
      const url = await apiClient.files.fetchObjectUrl(file.filename);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      messageApi.error('Не вдалося завантажити файл');
    } finally {
      setDownloading(false);
    }
  };

  /** Вміст повідомлення залежно від типу. */
  const renderContent = () => {
    if (file && isImage) {
      if (imageError) {
        return <Text type="danger">Неможливо завантажити файл</Text>;
      }
      return imageUrl ? (
        <Image
          src={imageUrl}
          alt={file.originalName}
          className={styles.preview}
        />
      ) : (
        <Spin size="small" />
      );
    }

    if (file) {
      return (
        <Space>
          <FileOutlined />
          <Text>{file.originalName}</Text>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
          >
            Завантажити файл
          </Button>
        </Space>
      );
    }

    return <Text>{message.content}</Text>;
  };

  return (
    <List.Item className={styles.item}>
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <Space>
            <Text strong>{message.author.username}</Text>
            {isOwn && <Text type="secondary">(ви)</Text>}
            <Text type="secondary" className={styles.time}>
              {new Date(message.createdAt).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Space>
        }
        description={renderContent()}
      />
    </List.Item>
  );
}
