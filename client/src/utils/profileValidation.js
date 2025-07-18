// client/src/utils/profileValidation.js - NEW FILE
export const validateProfileData = (data) => {
  const errors = {};

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }

  // Email validation
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Bio validation
  if (data.bio && data.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters';
  }

  // Date of birth validation
  if (data.dateOfBirth && !isValidDate(data.dateOfBirth)) {
    errors.dateOfBirth = 'Please enter a valid date';
  }

  // Website validation
  if (data.website && !isValidURL(data.website)) {
    errors.website = 'Please enter a valid URL';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePasswordData = (data) => {
  const errors = {};

  // Current password validation
  if (!data.currentPassword || data.currentPassword.trim().length === 0) {
    errors.currentPassword = 'Current password is required';
  }

  // New password validation
  if (!data.newPassword || data.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters long';
  }

  // Password strength validation
  if (data.newPassword && !isStrongPassword(data.newPassword)) {
    errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  // Confirm password validation
  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Helper validation functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Check if it's between 7-15 digits (international standard)
  return cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if it's a valid date
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Check if it's not in the future
  if (date > now) {
    return false;
  }
  
  // Check if it's not too old (assuming max age of 120 years)
  const maxAge = new Date();
  maxAge.setFullYear(maxAge.getFullYear() - 120);
  
  if (date < maxAge) {
    return false;
  }
  
  return true;
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const isStrongPassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return strongRegex.test(password);
};

// Form field sanitization
export const sanitizeProfileData = (data) => {
  const sanitized = {};
  
  // Sanitize string fields
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      sanitized[key] = data[key].trim();
    } else {
      sanitized[key] = data[key];
    }
  });
  
  // Ensure bio doesn't exceed limit
  if (sanitized.bio && sanitized.bio.length > 500) {
    sanitized.bio = sanitized.bio.substring(0, 500);
  }
  
  // Ensure phone number is properly formatted
  if (sanitized.phone) {
    // Remove all non-numeric characters except + at the beginning
    sanitized.phone = sanitized.phone.replace(/[^\d+]/g, '');
    // Ensure + is only at the beginning
    if (sanitized.phone.includes('+')) {
      const parts = sanitized.phone.split('+');
      sanitized.phone = '+' + parts.join('');
    }
  }
  
  return sanitized;
};

// Profile completeness calculation
export const calculateProfileCompleteness = (userData) => {
  let completeness = 0;
  const maxScore = 100;
  
  // Basic info (50 points)
  if (userData.name && userData.name.trim().length > 0) completeness += 15;
  if (userData.email && userData.email.trim().length > 0) completeness += 15;
  if (userData.avatar && userData.avatar.url) completeness += 10;
  if (userData.profile?.phone && userData.profile.phone.trim().length > 0) completeness += 10;
  
  // Extended profile (30 points)
  if (userData.profile?.bio && userData.profile.bio.trim().length > 0) completeness += 10;
  if (userData.profile?.location && userData.profile.location.trim().length > 0) completeness += 10;
  if (userData.profile?.dateOfBirth) completeness += 10;
  
  // Additional info (20 points)
  if (userData.profile?.firstName && userData.profile.firstName.trim().length > 0) completeness += 5;
  if (userData.profile?.lastName && userData.profile.lastName.trim().length > 0) completeness += 5;
  if (userData.profile?.gender && userData.profile.gender.trim().length > 0) completeness += 5;
  if (userData.profile?.website && userData.profile.website.trim().length > 0) completeness += 5;
  
  return Math.min(completeness, maxScore);
};

// Get profile suggestions based on missing fields
export const getProfileSuggestions = (userData) => {
  const suggestions = [];
  
  if (!userData.avatar?.url) {
    suggestions.push({
      field: 'avatar',
      title: 'Add Profile Picture',
      description: 'Upload a profile picture to help others recognize you',
      priority: 'high'
    });
  }
  
  if (!userData.profile?.bio) {
    suggestions.push({
      field: 'bio',
      title: 'Write Your Bio',
      description: 'Tell others about yourself and your interests',
      priority: 'medium'
    });
  }
  
  if (!userData.profile?.phone) {
    suggestions.push({
      field: 'phone',
      title: 'Add Phone Number',
      description: 'Make it easier for people to contact you',
      priority: 'medium'
    });
  }
  
  if (!userData.profile?.location) {
    suggestions.push({
      field: 'location',
      title: 'Add Location',
      description: 'Help others find local services and listings',
      priority: 'low'
    });
  }
  
  if (!userData.profile?.dateOfBirth) {
    suggestions.push({
      field: 'dateOfBirth',
      title: 'Add Date of Birth',
      description: 'Complete your profile information',
      priority: 'low'
    });
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};
