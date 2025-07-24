import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/resources (no change)
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

// POST /api/resources - Create a new resource (UPDATED)
router.post('/', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, location, costPerHour, minBookingMinutes, maxBookingMinutes, operatingHoursStart, operatingHoursEnd } = req.body;

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
        operatingHoursStart: operatingHoursStart ? parseInt(operatingHoursStart, 10) : 480, // Default 8 AM
        operatingHoursEnd: operatingHoursEnd ? parseInt(operatingHoursEnd, 10) : 1320, // Default 10 PM
      },
    });
    res.status(201).json(newResource);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create resource.' });
  }
});

// PUT /api/resources/:id - Update an existing resource (UPDATED)
router.put('/:id', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, location, costPerHour, minBookingMinutes, maxBookingMinutes, operatingHoursStart, operatingHoursEnd } = req.body;

        const updatedResource = await prisma.resource.update({
            where: { id },
            data: {
                name,
                description,
                location,
                costPerHour: costPerHour ? parseInt(costPerHour, 10) : undefined,
                minBookingMinutes: minBookingMinutes ? parseInt(minBookingMinutes, 10) : undefined,
                maxBookingMinutes: maxBookingMinutes ? parseInt(maxBookingMinutes, 10) : undefined,
                operatingHoursStart: operatingHoursStart ? parseInt(operatingHoursStart, 10) : undefined,
                operatingHoursEnd: operatingHoursEnd ? parseInt(operatingHoursEnd, 10) : undefined,
            },
        });
        res.json(updatedResource);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update resource.' });
    }
});

// DELETE /api/resources/:id (no change)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.resource.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete resource.' });
    }
});

export default router;