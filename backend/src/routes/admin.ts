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

export default router;
