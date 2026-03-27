import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();
const uploadDir = process.env.UPLOADS_DIR || 'uploads';

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

function getParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value || '';
}

function parseJsonField(value: string | null) {
    if (!value) return [];
    try {
        return JSON.parse(value);
    } catch {
        return [];
    }
}

function parseJsonObject(value: string | null) {
    if (!value) return {};
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

// Helper to format issue response
function formatIssue(issue: any) {
    return {
        ...issue,
        assignee: issue.assignee ? {
            id: issue.assignee.id,
            name: issue.assignee.name,
            avatarUrl: issue.assignee.avatarUrl || ''
        } : null,
        tags: parseJsonField(issue.tags),
        attachments: parseJsonField(issue.attachments),
        comments: issue.comments?.map((c: any) => ({
            id: c.id,
            text: c.text,
            author: {
                name: c.author.name,
                avatarUrl: c.author.avatarUrl || ''
            },
            timestamp: c.createdAt.toISOString()
        })) || []
    };
}

function formatProject(project: any) {
    return {
        ...project,
        config: parseJsonObject(project.config),
        issues: project.issues ? project.issues.map(formatIssue) : undefined
    };
}

// Get all projects (that user is a member of)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                members: {
                    some: {
                        userId: req.userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        });
        res.json(projects.map(formatProject));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Create project
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { name, description, status, requiresAuth, config } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                description,
                status: status || 'Active',
                requiresAuth: requiresAuth || false,
                config: config !== undefined ? JSON.stringify(config) : undefined,
                members: {
                    create: {
                        userId: req.userId!,
                        role: 'Admin'
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        });
        res.json(formatProject(project));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get project details
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const projectId = getParam(req.params.id);
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: {
                        user: true
                    }
                },
                issues: {
                    include: {
                        assignee: true,
                        comments: {
                            include: {
                                author: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check access
        const isMember = project.members.some(m => m.userId === req.userId);
        if (!isMember && project.requiresAuth) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(formatProject(project));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Update project
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const projectId = getParam(req.params.id);
        const { name, description, status, requiresAuth, config } = req.body;
        
        // Check if user is admin of this project
        const member = await prisma.teamMember.findFirst({
            where: {
                projectId,
                userId: req.userId,
                role: 'Admin'
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Only admins can update projects' });
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                name,
                description,
                status,
                requiresAuth,
                config: config !== undefined ? JSON.stringify(config) : undefined
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        });
        res.json(formatProject(project));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const projectId = getParam(req.params.id);
        
        // Check if user is admin of this project
        const member = await prisma.teamMember.findFirst({
            where: {
                projectId,
                userId: req.userId,
                role: 'Admin'
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Only admins can delete projects' });
        }

        // Delete all associated issues, comments, team members first (though Prisma handles cascading if configured)
        // Let's rely on Prisma cascade if it exists, otherwise manual delete
        await prisma.project.delete({
            where: { id: projectId }
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Add member
router.post('/:id/members', authenticateToken, upload.single('avatar'), async (req: AuthRequest, res) => {
    try {
        const { email, role, name, password, bio } = req.body;
        const projectId = getParam(req.params.id);

        // Find user by email
        let userToAdd = await prisma.user.findUnique({ where: { email } });
        if (!userToAdd) {
            if (name && password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                
                let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`;
                if (req.file) {
                    avatarUrl = `/uploads/${req.file.filename}`;
                }

                userToAdd = await prisma.user.create({
                    data: {
                        email: email.toLowerCase(),
                        password: hashedPassword,
                        name: name.trim(),
                        bio: bio ? bio.trim() : null,
                        avatarUrl,
                    }
                });
            } else {
                return res.status(404).json({ error: 'User not found. Please provide name and password to register a new user.' });
            }
        }

        // Check if member already exists
        const existingMember = await prisma.teamMember.findUnique({
            where: {
                userId_projectId: {
                    userId: userToAdd.id,
                    projectId
                }
            }
        });

        if (existingMember) {
            return res.status(400).json({ error: 'User is already a member of this project' });
        }

        const member = await prisma.teamMember.create({
            data: {
                projectId,
                userId: userToAdd.id,
                role: role || 'Member'
            },
            include: {
                user: true
            }
        });

        res.json(member);
    } catch (error) {
        console.error('Failed to add member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove member
router.delete('/:id/members/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const projectId = getParam(req.params.id);
        const userId = getParam(req.params.userId);
        await prisma.teamMember.deleteMany({
            where: {
                projectId,
                userId: userId
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Update member role
router.put('/:id/members/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const projectId = getParam(req.params.id);
        const userId = getParam(req.params.userId);
        const { role } = req.body;
        const member = await prisma.teamMember.updateMany({
            where: {
                projectId,
                userId: userId
            },
            data: { role }
        });
        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Create Issue
router.post('/:id/issues', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { title, type, description, priority, status, assigneeId, tags, attachments, startDate, endDate } = req.body;
        const projectId = getParam(req.params.id);

        const issue = await prisma.issue.create({
            data: {
                title,
                type,
                description,
                priority,
                status,
                projectId,
                assigneeId: assigneeId || null,
                tags: tags !== undefined ? JSON.stringify(tags) : undefined,
                attachments: attachments !== undefined ? JSON.stringify(attachments) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            },
            include: {
                assignee: true,
                comments: {
                    include: {
                        author: true
                    }
                }
            }
        });

        res.json(formatIssue(issue));
    } catch (error) {
        console.error('Failed to create issue:', error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

// Update Issue
router.put('/:id/issues/:issueId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { title, type, description, priority, status, assigneeId, tags, attachments, startDate, endDate } = req.body;
        const issueId = getParam(req.params.issueId);
        const issue = await prisma.issue.update({
            where: { id: issueId },
            data: {
                title,
                type,
                description,
                priority,
                status,
                assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
                tags: tags !== undefined ? JSON.stringify(tags) : undefined,
                attachments: attachments !== undefined ? JSON.stringify(attachments) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            },
            include: {
                assignee: true,
                comments: {
                    include: {
                        author: true
                    }
                }
            }
        });
        res.json(formatIssue(issue));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update issue' });
    }
});

// Add Comment
router.post('/:id/issues/:issueId/comments', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { text } = req.body;
        const issueId = getParam(req.params.issueId);
        const comment = await prisma.comment.create({
            data: {
                text,
                issueId,
                authorId: req.userId!
            },
            include: {
                author: true
            }
        });

        const formattedComment = {
            id: comment.id,
            text: comment.text,
            author: {
                name: comment.author.name,
                avatarUrl: comment.author.avatarUrl || ''
            },
            timestamp: comment.createdAt.toISOString()
        };

        res.json(formattedComment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Update Comment
router.put('/:id/issues/:issueId/comments/:commentId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { text } = req.body;
        const commentId = getParam(req.params.commentId);
        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: { text },
            include: {
                author: true
            }
        });

        const formattedComment = {
            id: comment.id,
            text: comment.text,
            author: {
                name: comment.author.name,
                avatarUrl: comment.author.avatarUrl || ''
            },
            timestamp: comment.createdAt.toISOString()
        };

        res.json(formattedComment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete Comment
router.delete('/:id/issues/:issueId/comments/:commentId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const commentId = getParam(req.params.commentId);
        await prisma.comment.delete({
            where: { id: commentId }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

export default router;
