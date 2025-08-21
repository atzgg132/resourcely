import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

// POST /api/requests/credit - Submit a request for credits
router.post('/credit', async (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication error.' });
  }
  if (!amount || !reason || amount <= 0) {
    return res.status(400).json({ message: 'A positive amount and reason are required.' });
  }

  try {
    const newRequest = await prisma.creditRequest.create({
      data: {
        amount: parseInt(amount, 10),
        reason,
        userId,
      },
    });
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit credit request.' });
  }
});

// POST /api/requests/waitlist - Join a waiting list for a resource slot
router.post('/waitlist', async (req: AuthRequest, res: Response) => {
  const { resourceId, slotStartTime } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication error.' });
  }
  if (!resourceId || !slotStartTime) {
    return res.status(400).json({ message: 'Resource ID and slot start time are required.' });
  }

  try {
    const newEntry = await prisma.waitingListEntry.create({
      data: {
        resourceId,
        slotStartTime: new Date(slotStartTime),
        userId,
      },
    });
    res.status(201).json({ message: 'You have been added to the waiting list.' });
  } catch (error: any) {
    // Handle cases where the user is already on the list (due to the @@unique constraint)
    if (error.code === 'P2002') {
        return res.status(409).json({ message: 'You are already on the waiting list for this slot.' });
    }
    res.status(500).json({ message: 'Failed to join the waiting list.' });
  }
});

export default router;