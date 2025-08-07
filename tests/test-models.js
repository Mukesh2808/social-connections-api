// test-models.js
const User = require('./models/User');
const Connection = require('./models/Connection');

async function testModels() {
    try {
        console.log('🧪 Testing Models...\n');

        // Test User model
        console.log('1. Testing User.exists()...');
        const aliceExists = await User.exists('alice');
        console.log(`   Alice exists: ${aliceExists}\n`);

        // Test User.findByStringId()
        console.log('2. Testing User.findByStringId()...');
        const alice = await User.findByStringId('alice');
        console.log(`   Alice data:`, alice, '\n');

        // Test Connection.findConnection()
        console.log('3. Testing Connection.findConnection()...');
        const connection = await Connection.findConnection('alice', 'bob');
        console.log(`   Alice-Bob connection:`, connection, '\n');

        // Test degree calculation
        console.log('4. Testing Connection.calculateDegree()...');
        const degree = await Connection.calculateDegree('alice', 'charlie');
        console.log(`   Degree between Alice and Charlie:`, degree, '\n');

        console.log('✅ All model tests completed successfully!');

    } catch (error) {
        console.error('❌ Model test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

// Run tests only if this file is executed directly
if (require.main === module) {
    testModels();
}

module.exports = testModels;
