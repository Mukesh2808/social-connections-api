// server.js
const createApp = require('./config/app');
const { testConnection } = require('./config/database');
require('dotenv').config();

// Import routes (we'll create these next)
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = createApp();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    const healthCheck = {
        uptime: process.uptime(),
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    };

    try {
        res.status(dbConnected ? 200 : 503).json(healthCheck);
    } catch (error) {
        healthCheck.message = 'Health check failed';
        res.status(503).json(healthCheck);
    }
});

// API root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🌐 Social Connections API',
        version: '1.0.0',
        documentation: {
            postman: 'Import the Postman collection for API testing',
            endpoints: {
                health: 'GET /health',
                users: 'POST /api/users, GET /api/users/:id/friends',
                connections: 'POST /api/connections, DELETE /api/connections'
            }
        },
        status: 'Server is running'
    });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /api/users',
            'GET /api/users/:user_str_id/friends',
            'POST /api/connections',
            'DELETE /api/connections'
        ]
    });
});

// Global error handler (must be last)
//app.use(errorHandler);

// Start server function
const startServer = async () => {
    try {
        // Test database connection before starting
        console.log('🔍 Testing database connection...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            console.error('💡 Make sure PostgreSQL is running and credentials in .env are correct');
            process.exit(1);
        }

        // Start the server
        app.listen(PORT, () => {
            console.log('\n🚀 Social Connections API Server Started');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📍 Server running on: http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Database: ${process.env.DB_NAME || 'social_connections'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            if (process.env.NODE_ENV === 'development') {
                console.log('💡 Development tips:');
                console.log('   • Use "npm run dev" for auto-restart');
                console.log('   • Check logs for API requests');
                console.log('   • Test endpoints with Postman or curl\n');
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('🚨 Unhandled Promise Rejection:', err.message);
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🔄 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
