import { AppError } from './app-error';

export class ApprovalSignatureRequiredError extends AppError {
  constructor(message = 'Electronic Signature is required before approving this request.') {
    super(message, 400, 'APPROVAL_SIGNATURE_REQUIRED');
  }
}