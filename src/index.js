const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const syncRoutes = require('./routes/syncRoutes');
const authRoutes = require('./routes/authRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const umatRoutes = require('./routes/umatRoutes');
const keluargaRoutes = require('./routes/keluargaRoutes');
const sacramentRoutes = require('./routes/sacramentRoutes');
const mutationRoutes = require('./routes/mutationRoutes');
const churchActivityRoutes = require('./routes/churchactivityRoutes');
const userRoutes = require('./routes/userRoutes');
const draftRoutes = require('./routes/draftRoutes');
const kbgRoutes = require('./routes/kbgRoutes');

app.use('/api/sync', syncRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/umat', umatRoutes);
app.use('/api/keluarga', keluargaRoutes);
app.use('/api/sakramen', sacramentRoutes);
app.use('/api/mutasi', mutationRoutes);
app.use('/api/aktivitas', churchActivityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/kbgs', kbgRoutes);
app.use('/api/kbg-pengurus', require('./routes/kbgPengurusRoutes'));
app.use('/api/stasi', require('./routes/stasiRoutes'));

// Global Error Handler
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
