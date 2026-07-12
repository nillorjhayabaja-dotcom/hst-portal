import { AppError } from './app-error';

export class SignatureUploadFailedError extends AppError {
  constructor(message = 'Failed to upload signature. Please try again.') {
    super(message, 500, 'SIGNATURE_UPLOAD_FAILED');
  }
}