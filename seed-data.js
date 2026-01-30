// Seed Database with Sample Data
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const RecyclingRecord = require('./src/models/RecyclingRecord');
const Incident = require('./src/models/Incident');

const DATABASE = process.env.DATABASE;

async function seedDatabase() {
  try {
    await mongoose.connect(DATABASE);
    console.log('✅ Connected to MongoDB');

    // Drop problematic indexes first
    console.log('\n🔧 Cleaning up old indexes...');
    try {
      await mongoose.connection.collection('users').dropIndex('email_1');
      console.log('   ✅ Dropped legacy email index');
    } catch (e) {
      console.log('   ℹ️  No legacy email index found');
    }

    // 1. Create Test Users
    console.log('\n📝 Creating test users...');
    
    const testUser = await User.findOneAndUpdate(
      { phoneNumber: '9876543210' },
      {
        phoneNumber: '9876543210',
        role: 'USER',
        isVerified: true,
        profile: { 
          name: 'Test User',
          address: { street: '123 Green Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
        },
        points: 250
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Test User: Phone 9876543210');

    const testWorker = await User.findOneAndUpdate(
      { phoneNumber: '9876543211' },
      {
        phoneNumber: '9876543211',
        role: 'WORKER',
        isVerified: true,
        profile: { name: 'Ram Kumar' },
        workerInfo: {
          employeeId: 'WRK001',
          vehicleNumber: 'MH01AB1234',
          assignedArea: 'Andheri West',
          isOnDuty: true,
          rating: 4.5
        }
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Worker: Phone 9876543211');

    const testAdmin = await User.findOneAndUpdate(
      { phoneNumber: '9999999999' },
      {
        phoneNumber: '9999999999',
        role: 'SUPER_ADMIN',
        isVerified: true,
        profile: { name: 'Admin User' }
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Admin: Phone 9999999999');

    // 2. Create Sample Orders (bypass validation for seeding)
    console.log('\n📦 Creating sample orders...');
    
    const wasteTypes = ['plastic', 'paper', 'metal', 'glass', 'organic', 'ewaste'];
    const statuses = ['pending', 'confirmed', 'assigned', 'completed'];
    const areas = ['Andheri West', 'Bandra', 'Juhu', 'Powai', 'Malad'];
    
    // Clear existing test orders first
    await Order.deleteMany({ notes: 'SEED_DATA' });
    
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 25);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      // Use insertOne to bypass schema validation for seeding
      await Order.collection.insertOne({
        orderId: `SEED${Date.now()}${i}`,
        user: testUser._id,
        wasteTypes: [wasteTypes[Math.floor(Math.random() * wasteTypes.length)]],
        estimatedQuantity: Math.floor(Math.random() * 20) + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        location: {
          street: `${Math.floor(Math.random() * 500) + 1} Sample Street`,
          area: areas[Math.floor(Math.random() * areas.length)],
          city: 'Mumbai',
          coordinates: {
            lat: 19.0760 + (Math.random() * 0.1),
            lng: 72.8777 + (Math.random() * 0.1)
          }
        },
        scheduledDate: createdAt,
        scheduledTime: '09:00-12:00',
        notes: 'SEED_DATA',
        createdAt: createdAt,
        updatedAt: createdAt
      });
    }
    console.log('   ✅ Created 15 sample orders');

    // 3. Create Recycling Records
    console.log('\n♻️ Creating recycling records...');
    
    const categories = ['plastic', 'paper', 'metal', 'glass', 'electronics', 'organic'];
    const conditions = ['good', 'fair', 'poor'];
    const items = ['Bottles', 'Cardboard', 'Cans', 'Jars', 'Old Phone', 'Food Scraps', 'Newspapers', 'Wires'];
    
    // Clear existing test records
    await RecyclingRecord.deleteMany({ notes: 'SEED_DATA' });
    
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 28);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      const catIndex = Math.floor(Math.random() * categories.length);
      
      await RecyclingRecord.collection.insertOne({
        user: testUser._id,
        itemName: items[Math.floor(Math.random() * items.length)],
        category: categories[catIndex],
        weight: parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        pointsEarned: Math.floor(Math.random() * 50) + 10,
        notes: 'SEED_DATA',
        createdAt: createdAt,
        updatedAt: createdAt
      });
    }
    console.log('   ✅ Created 20 recycling records');

    // 4. Create Sample Incidents
    console.log('\n🚨 Creating sample incidents...');
    
    const incidentTypes = ['pothole', 'flooded_road', 'debris', 'traffic_jam', 'construction'];
    const severities = ['low', 'medium', 'high'];
    
    // Clear existing test incidents
    await Incident.deleteMany({ description: { $regex: /SEED_DATA/ } });
    
    for (let i = 0; i < 5; i++) {
      await Incident.collection.insertOne({
        reporter: testUser._id,
        reporterName: 'Test User',
        type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: 'Sample incident for testing - SEED_DATA',
        location: {
          lat: 19.0760 + (Math.random() * 0.1),
          lng: 72.8777 + (Math.random() * 0.1),
          address: `${areas[Math.floor(Math.random() * areas.length)]}, Mumbai`,
          city: 'Mumbai',
          area: areas[Math.floor(Math.random() * areas.length)]
        },
        status: Math.random() > 0.3 ? 'active' : 'resolved',
        aiAnalysis: {
          riskScore: Math.floor(Math.random() * 100),
          category: 'environmental',
          recommendations: ['Clean up required', 'Monitor area']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('   ✅ Created 5 sample incidents');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📋 Login Credentials:');
    console.log('   User:   test@ecosustain.com / test123');
    console.log('   Worker: worker@ecosustain.com / test123');
    console.log('   Admin:  admin@ecosustain.com / test123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
