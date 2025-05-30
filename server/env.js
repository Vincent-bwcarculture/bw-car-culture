// server/env.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Fallback credentials as a last resort
// Replace these with your actual values
const FALLBACK_AWS_CREDENTIALS = {
  accessKeyId: 'AKIAWAA66ITWWOKFYUNL', // Replace with the key that worked
  secretAccessKey: 'wE0paUYBuoJaMqGRTtj5VSNsP6aaXTnD3P0gBEjj', // Replace with the secret that worked
  region: 'us-east-1',
  bucket: 'i3wcarculture-images'
};

// Direct .env loading function
const loadEnvFile = () => {
  const envPath = path.join(__dirname, '../.env');
  console.log(`🔍 Looking for .env file at: ${envPath}`);
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Found .env file!');
    
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) return;
        
        // Parse key-value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
          
          // Only set if not already defined
          if (!process.env[key]) {
            process.env[key] = value;
            
            // Log without exposing secrets
            if (key.includes('SECRET') || key.includes('KEY')) {
              console.log(`📝 Set ${key}: [HIDDEN]`);
            } else {
              console.log(`📝 Set ${key}: ${value}`);
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error reading .env file:', error);
      return false;
    }
  } else {
    console.log('⚠️ No .env file found!');
    return false;
  }
};

// Load environment variables
const envLoaded = loadEnvFile();

// CRITICAL: Ensure AWS credentials are set one way or another
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.log('⚠️ AWS credentials not found in environment, using fallbacks');
  
  // Apply fallback credentials
  process.env.AWS_ACCESS_KEY_ID = FALLBACK_AWS_CREDENTIALS.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = FALLBACK_AWS_CREDENTIALS.secretAccessKey;
  process.env.AWS_REGION = process.env.AWS_REGION || FALLBACK_AWS_CREDENTIALS.region;
  process.env.AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || FALLBACK_AWS_CREDENTIALS.bucket;
  
  console.log('🔑 Set AWS_ACCESS_KEY_ID from fallback');
  console.log('🔑 Set AWS_SECRET_ACCESS_KEY from fallback');
  console.log(`🌎 Set AWS_REGION: ${process.env.AWS_REGION}`);
  console.log(`🪣 Set AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET}`);
}

// Verify required environment variables
console.log('\n=== Environment Variables Check ===');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('AWS_REGION:', process.env.AWS_REGION || '❌ Missing');
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET || '❌ Missing');
console.log('===================================\n');

export default {
  envLoaded
};
