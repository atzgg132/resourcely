import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// Route: GET /api/admin/pending-approvals
// Desc: Get all users with PENDING_ADMIN role
router.get('/pending-approvals', async (req, res) => {
  try {
    const pendingAdmins = await prisma.user.findMany({
      where: { role: 'PENDING_ADMIN' },
      select: { id: true, email: true, name: true, createdAt: true }, // Don't send sensitive data
    });
    res.json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending approvals.' });
  }
});

// Route: POST /api/admin/approve-request/:userId
// Desc: Approve a pending admin request
router.post('/approve-request/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure the user being approved actually exists and is pending
    const userToApprove = await prisma.user.findFirst({
        where: { id: userId, role: 'PENDING_ADMIN' }
    });

    if (!userToApprove) {
        return res.status(404).json({ message: 'Pending user not found.' });
    }

    // Update the user's role to ADMIN
    const approvedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });

    // TODO: Send an email notification to the approved user

    res.json({ message: `User ${approvedUser.email} has been approved as an admin.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve request.' });
  }
});

// We can add a deny route later if needed. For now, an admin can just ignore the request.

// GET /api/admin/credit-requests - Get all pending credit requests
router.get('/credit-requests', async (req, res) => {
  try {
    const requests = await prisma.creditRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch credit requests.' });
  }
});

// POST /api/admin/credit-requests/:requestId/approve - Approve a request
router.post('/credit-requests/:requestId/approve', async (req, res) => {
  const { requestId } = req.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.creditRequest.findUnique({ where: { id: requestId } });
      if (!request || request.status !== 'PENDING') {
        throw new Error('Request not found or already actioned.');
      }

      // Add credits to the user
      await tx.user.update({
        where: { id: request.userId },
        data: { creditBalance: { increment: request.amount } },
      });

      // Update the request status
      const updatedRequest = await tx.creditRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });
      
      return updatedRequest;
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to approve request.' });
  }
});

// POST /api/admin/credit-requests/:requestId/deny - Deny a request
router.post('/credit-requests/:requestId/deny', async (req, res) => {
    const { requestId } = req.params;
    try {
        const request = await prisma.creditRequest.findFirst({
            where: { id: requestId, status: 'PENDING' }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found or already actioned.' });
        }
        const deniedRequest = await prisma.creditRequest.update({
            where: { id: requestId },
            data: { status: 'DENIED' },
        });
        res.json(deniedRequest);
    } catch (error) {
        res.status(500).json({ message: 'Failed to deny request.' });
    }
});

export default router;
