import { Router } from 'express';
import { QRScannerController } from '../../controllers/qr-scanner.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const qrScannerController = new QRScannerController();

/**
 * @route   POST /api/v1/qr-scanner/validate
 * @desc    Validate QR token and return gate pass details
 * @access  Private (Security Guards)
 */
router.post('/validate', authenticate, (req, res) => {
  qrScannerController.validateQRToken(req, res);
});

/**
 * @route   POST /api/v1/qr-scanner/verify
 * @desc    Mark gate pass as verified/used by security guard
 * @access  Private (Security Guards)
 */
router.post('/verify', authenticate, (req, res) => {
  qrScannerController.verifyExit(req, res);
});

/**
 * @route   GET /api/v1/qr-scanner/history/:requestId
 * @desc    Get scan history for a gate pass
 * @access  Private
 */
router.get('/history/:requestId', authenticate, (req, res) => {
  qrScannerController.getScanHistory(req, res);
});

export default router;