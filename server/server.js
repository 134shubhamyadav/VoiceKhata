require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const appConfig = require('./config/appConfig');
const { errorMiddleware } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));


// Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/entries',   require('./routes/entryRoutes'));
app.use('/api/voice',     require('./routes/voiceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/insights',  require('./routes/insightsRoutes'));
app.use('/api/payments',  require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Welcome to the VoiceKhata API',
      status: 'online',
      version: '1.0.0',
      docs: '/api/health'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'VoiceKhata API is running' } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`VoiceKhata server running on port ${PORT}`);
});

