// directAdminCreate.js - Using your actual connection string from .env
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Your MongoDB connection string from your .env file
const MONGODB_URI = "mongodb+srv://i3wcarculture:u7vK3xvT9L7q5k93@cluster0.xesfs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_NAME = "i3wcarculture"; // Important - this is your database name

console.log('Connecting to MongoDB:', MONGODB_URI);
console.log('Database name:', MONGODB_NAME);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: MONGODB_NAME // Specify the database name explicitly
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create User Schema to match your existing model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String
});

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    // Create salt & hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);
    
    // First check if this admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@i3wcarculture.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists - updating password');
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin password updated');
    } else {
      // Create admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@i3wcarculture.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });

      await adminUser.save();
      console.log('New admin user created successfully');
    }
    
    // List users to verify
    const users = await User.find({}).select('email role');
    console.log('Users in database:', users);
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

createAdminUser();