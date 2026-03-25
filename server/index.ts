import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const uploadDir = process.env.UPLOADS_DIR || 'uploads';

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.get('/', (req, res) => {
    res.send('Bug Tracker API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
