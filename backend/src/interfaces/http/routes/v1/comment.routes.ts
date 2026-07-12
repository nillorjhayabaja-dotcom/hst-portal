import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../../../infrastructure/database/prisma.service';

const router = Router();

// Comment routes
router.get('/:entityType/:entityId', authenticate, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { entityType, entityId },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        replies: {
          include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
});

router.post('/:entityType/:entityId', authenticate, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { content } = req.body;
    const user = req.user as any;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        entityType,
        entityId,
        content: content.trim(),
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

export default router;
