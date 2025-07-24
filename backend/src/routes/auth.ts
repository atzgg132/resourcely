import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// Route: POST /api/auth/register/member
// Desc: Register a new member
router.post('/register/member', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'New Member',
        // role and creditBalance will use the default values from the schema
      },
    });

    // 5. Respond with success (don't send the password back!)
    res.status(201).json({
      message: 'Member registered successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        creditBalance: user.creditBalance,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Route: POST /api/auth/login
// Desc: Authenticate a user and return a JWT
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 2. Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Use a generic message for security
    }

    // 3. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 4. Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // 5. Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({
          message: 'Logged in successfully!',
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            creditBalance: user.creditBalance,
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Route: POST /api/auth/register/admin
// Desc: Register a request for an admin account
router.post('/register/admin', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with PENDING_ADMIN role and 0 credits by default
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Admin Candidate',
        role: 'PENDING_ADMIN',
        creditBalance: 0,
      },
    });

    res.status(201).json({
      message: 'Admin registration request submitted successfully. Please wait for approval.',
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;