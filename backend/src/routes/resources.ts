import { Router, Response } from 'express'; // Ensure Response is imported
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware'; // Import AuthRequest

const router = Router();

// === PUBLIC ROUTE ===
// GET /api/resources - Fetch all resources (for any logged-in user to see)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resources.' });
  }
});


// === ADMIN-ONLY ROUTES ===

// POST /api/resources - Create a new resource
router.post('/', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, location, costPerHour, minBookingMinutes, maxBookingMinutes } = req.body;

    // Basic validation
    if (!name || !description || costPerHour == null) {
      return res.status(400).json({ message: 'Name, description, and cost per hour are required.' });
    }

    const newResource = await prisma.resource.create({
      data: {
        name,
        description,
        location,
        costPerHour: parseInt(costPerHour, 10),
        minBookingMinutes: minBookingMinutes ? parseInt(minBookingMinutes, 10) : 30,
        maxBookingMinutes: maxBookingMinutes ? parseInt(maxBookingMinutes, 10) : 240,
      },
    });
    res.status(201).json(newResource);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create resource.' });
  }
});

// PUT /api/resources/:id - Update an existing resource
router.put('/:id', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, location, costPerHour, minBookingMinutes, maxBookingMinutes } = req.body;

        const updatedResource = await prisma.resource.update({
            where: { id },
            data: {
                name,
                description,
                location,
                costPerHour: costPerHour ? parseInt(costPerHour, 10) : undefined,
                minBookingMinutes: minBookingMinutes ? parseInt(minBookingMinutes, 10) : undefined,
                maxBookingMinutes: maxBookingMinutes ? parseInt(maxBookingMinutes, 10) : undefined,
            },
        });
        res.json(updatedResource);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update resource.' });
    }
});

// DELETE /api/resources/:id - Delete a resource
router.delete('/:id', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.resource.delete({
            where: { id },
        });
        res.status(204).send(); // No Content
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete resource.' });
    }
});


export default router;
