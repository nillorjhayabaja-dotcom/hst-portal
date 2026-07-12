import { AppError } from './app-error';

export class InvalidSignatureFormatError extends AppError {
  constructor(message = 'Invalid signature format. Only PNG, JPG, JPEG, and WEBP are allowed.') {
    super(message, 400, 'INVALID_SIGNATURE_FORMAT');
  }
}