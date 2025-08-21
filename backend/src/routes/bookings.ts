import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// GET /api/bookings/resource/:resourceId - Get bookings for a specific resource
router.get('/resource/:resourceId', async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { start, end } = req.query; // Expecting ISO date strings

    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
        return res.status(400).json({ message: 'Start and end query parameters are required.' });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        resourceId,
        // Find bookings that overlap with the requested time window
        OR: [
          { startTime: { lte: new Date(end), gte: new Date(start) } },
          { endTime: { lte: new Date(end), gte: new Date(start) } },
          { startTime: { lte: new Date(start) }, endTime: { gte: new Date(end) } }
        ],
      },
      select: { startTime: true, endTime: true }, // Only send necessary data
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
});


// POST /api/bookings - Create a new booking
router.post('/', async (req: AuthRequest, res: Response) => {
    const { resourceId, startTime, endTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Authentication error.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // --- Start Transaction ---
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch resource and user data within the transaction for consistency
            const resource = await tx.resource.findUnique({ where: { id: resourceId } });
            const user = await tx.user.findUnique({ where: { id: userId } });

            if (!resource || !user) {
                throw new Error('Resource or user not found.');
            }

            // 2. Check for booking conflicts
            const conflictingBookings = await tx.booking.count({
                where: {
                    resourceId,
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } },
                    ],
                },
            });

            if (conflictingBookings > 0) {
                throw new Error('This time slot is no longer available.');
            }

            const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
            let totalCost = 0;
            
            // 3. Calculate cost and check credits ONLY if not an admin
            if (!isAdmin) {
                const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                totalCost = Math.ceil(durationHours * resource.costPerHour);

                if (user.creditBalance < totalCost) {
                    throw new Error('Insufficient credits.');
                }

                await tx.user.update({
                    where: { id: userId },
                    data: { creditBalance: { decrement: totalCost } },
                });
            }

            // 4. Create the booking
            const newBooking = await tx.booking.create({
                data: {
                    startTime: start,
                    endTime: end,
                    creditsDeducted: totalCost, // Will be 0 for admins
                    userId,
                    resourceId,
                },
            });

            return newBooking;
        });

        res.status(201).json(result);

    } catch (error: any) {
        // The transaction is automatically rolled back on error
        console.error('Booking transaction failed:', error.message);
        res.status(400).json({ message: error.message || 'Booking failed.' });
    }
    // --- End Transaction ---
});

// GET /api/bookings/my-bookings - Get upcoming bookings for the logged-in user
router.get('/my-bookings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error.' });
    }

    const userBookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: new Date(), // Only fetch upcoming bookings
        },
      },
      include: {
        resource: { // Include resource details in the response
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    res.json(userBookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch your bookings.' });
  }
});

// DELETE /api/bookings/:bookingId - Cancel a booking (UPDATED)
router.delete('/:bookingId', async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication error.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });

      if (!booking) { throw new Error('Booking not found.'); }
      if (booking.userId !== userId && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPERADMIN') {
        throw new Error('Permission denied.');
      }
      if (new Date(booking.startTime) < new Date()) {
        throw new Error('Cannot cancel a booking that has already started.');
      }

      // Refund credits to the original user
      await tx.user.update({
        where: { id: booking.userId },
        data: { creditBalance: { increment: booking.creditsDeducted } },
      });

      // Delete the booking
      await tx.booking.delete({ where: { id: bookingId } });

      // --- WAITING LIST LOGIC ---
      // Find the first person on the waiting list for any slot that this booking occupied.
      const waitingListEntry = await tx.waitingListEntry.findFirst({
        where: {
          resourceId: booking.resourceId,
          slotStartTime: {
            gte: booking.startTime,
            lt: booking.endTime,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: true, // Include user info for notification
        },
      });

      if (waitingListEntry) {
        console.log(`Booking cancelled. Notifying user ${waitingListEntry.user.email} that a slot is available.`);
        // In a real application, you would trigger an email notification here.
        // e.g., await sendSlotAvailableEmail(waitingListEntry.user.email, ...);
        
        // For now, we will just log it. We can also remove the entry so they aren't notified again.
        await tx.waitingListEntry.delete({ where: { id: waitingListEntry.id } });
      }
      // --- END OF LOGIC ---

      return { message: 'Booking cancelled successfully.' };
    });

    res.json(result);

  } catch (error: any) {
    console.error('Cancellation error:', error.message);
    res.status(400).json({ message: error.message || 'Failed to cancel booking.' });
  }
});



export default router;