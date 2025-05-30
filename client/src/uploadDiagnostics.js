// server/utils/uploadDiagnostics.js
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const diagnoseUpload = (req, res, next) => {
  console.log('\n=== UPLOAD DIAGNOSTICS ===');
  console.log('Request Method:', req.method);
  console.log('Request URL:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  // Check for files in different properties
  console.log('req.file present:', !!req.file);
  console.log('req.files present:', !!req.files);
  
  if (req.file) {
    console.log('Single file details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'Present' : 'Not present',
      path: req.file.path || 'No path'
    });
  }
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      console.log('Files array length:', req.files.length);
      req.files.forEach((file, i) => {
        console.log(`File[${i}] details:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer ? 'Present' : 'Not present', 
          path: file.path || 'No path'
        });
      });
    } else {
      // Handle case where req.files is an object with field names as keys
      console.log('Files object keys:', Object.keys(req.files));
      for (const field in req.files) {
        const fieldFiles = req.files[field];
        console.log(`Field ${field} has ${fieldFiles.length} files`);
        fieldFiles.forEach((file, i) => {
          console.log(`${field}[${i}] details:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        });
      }
    }
  }
  
  // Check req.body
  console.log('req.body keys:', Object.keys(req.body));
  
  // Check upload directories
  const uploadPaths = [
    path.join(__dirname, '../../public/uploads'),
    path.join(__dirname, '../../public/uploads/listings'),
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads/listings')
  ];
  
  console.log('Upload directory status:');
  uploadPaths.forEach(p => {
    console.log(`- ${p}: ${fs.existsSync(p) ? 'Exists' : 'Missing'}`);
    if (fs.existsSync(p)) {
      try {
        // Attempt to write a test file
        const testFile = path.join(p, '.test-write-permission');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(`  - Write permission: Yes`);
      } catch (err) {
        console.log(`  - Write permission: No (${err.code})`);
      }
    }
  });
  
  console.log('=========================\n');
  next();
};