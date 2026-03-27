import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();
const uploadDir = process.env.UPLOADS_DIR || 'uploads';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const normalizedPassword = typeof password === 'string' ? password : '';

        if (!normalizedEmail || !normalizedPassword || !trimmedName) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                name: trimmedName,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=random`,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
    } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(400).json({ error: 'User already exists' });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
            return res.status(500).json({ error: 'Database is not initialized' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Me
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update Me
router.put('/me', upload.single('avatar'), async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const { name, avatarUrl, bio } = req.body;
        let finalAvatarUrl = avatarUrl;

        if (req.file) {
            // If a file is uploaded, construct the URL
            finalAvatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: { name, avatarUrl: finalAvatarUrl, bio },
        });

        res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
