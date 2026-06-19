/** Відповідь /auth/login та /auth/register. */
export interface AuthResponse {
  access_token: string;
}

/** Відповідь /files/upload. */
export interface UploadResponse {
  message: string;
  filename: string;
  originalName: string;
  mimetype: string;
  chatMessage: string;
}
