import { useRef, useState } from 'react';
import { Input, Button, Space, Upload, App } from 'antd';
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import type { UploadProps, InputRef } from 'antd';
import { apiClient } from '../../api/ApiClient';
import styles from './MessageInput.module.scss';

interface MessageInputProps {
  /** Надсилання текстового повідомлення (emit 'sendMessage'). */
  onSend: (text: string) => void;
  /** Чи активне з'єднання — блокує ввід, поки сокет не підключено. */
  disabled?: boolean;
}

/**
 * Поле вводу повідомлення + кнопка прикріплення файлу.
 * Текст надсилається через WebSocket (onSend),
 * файл - через apiClient.files.upload;
 */
export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const { message } = App.useApp();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  // Завантаження файлу
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    setUploading(true);
    try {
      await apiClient.files.upload(file);
      options.onSuccess?.({});
    } catch (err) {
      message.error('Не вдалося завантажити файл');
      options.onError?.(err as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.bar}>
      <Space.Compact className={styles.row}>
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          disabled={disabled || uploading}
        >
          <Button
            icon={<PaperClipOutlined />}
            loading={uploading}
            disabled={disabled}
            className={styles.attachBtn}
          />
        </Upload>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Введіть повідомлення..."
          disabled={disabled}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled}
        >
          Надіслати
        </Button>
      </Space.Compact>
    </div>
  );
}
