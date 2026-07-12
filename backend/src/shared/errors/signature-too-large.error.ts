import { AppError } from './app-error';

export class SignatureTooLargeError extends AppError {
  constructor(message = 'Signature file size exceeds the maximum limit of 2MB.') {
    super(message, 400, 'SIGNATURE_TOO_LARGE');
  }
}