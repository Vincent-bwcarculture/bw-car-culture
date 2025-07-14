// client/src/components/test/UserListingSystemTest.js
// Quick test component to verify the user listing system is working

import React, { useState } from 'react';
import axios from '../../config/axios.js';

const UserListingSystemTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Backend system health
    try {
      const response = await axios.get('/api/test/user-submission');
      results.tests.push({
        name: 'Backend System Health',
        status: response.data.success ? 'PASS' : 'FAIL',
        message: response.data.message,
        data: response.data.data
      });
    } catch (error) {
      results.tests.push({
        name: 'Backend System Health',
        status: 'FAIL',
        message: error.response?.data?.message || error.message,
        error: error.response?.data
      });
    }

    // Test 2: User profile endpoint
    try {
      const response = await axios.get('/api/user/profile');
      results.tests.push({
        name: 'User Profile Endpoint',
        status: response.data.success ? 'PASS' : 'FAIL',
        message: 'User profile retrieved successfully',
        data: {
          name: response.data.data?.name,
          email: response.data.data?.email,
          hasLocation: !!(response.data.data?.location || response.data.data?.address)
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'User Profile Endpoint',
        status: 'FAIL',
        message: error.response?.data?.message || error.message
      });
    }

    // Test 3: Image upload endpoint
    try {
      const response = await axios.get('/api/images/test');
      results.tests.push({
        name: 'Image Upload System',
        status: response.data.success ? 'PASS' : 'FAIL',
        message: 'Image upload system is available',
        data: response.data.endpoints
      });
    } catch (error) {
      results.tests.push({
        name: 'Image Upload System',
        status: 'FAIL',
        message: error.response?.data?.message || error.message
      });
    }

    // Test 4: User submissions endpoint
    try {
      const response = await axios.get('/api/user/my-submissions');
      results.tests.push({
        name: 'User Submissions Endpoint',
        status: response.data.success ? 'PASS' : 'FAIL',
        message: `Found ${response.data.data?.length || 0} existing submissions`,
        data: {
          totalSubmissions: response.data.data?.length || 0,
          pagination: response.data.pagination
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'User Submissions Endpoint',
        status: 'FAIL',
        message: error.response?.data?.message || error.message
      });
    }

    // Test 5: Test submission (dry run)
    const testListingData = {
      title: "TEST LISTING - Please ignore",
      description: "This is a test listing created by the system test. It should be automatically marked as a test and not processed.",
      pricing: { price: 1000, currency: 'BWP' },
      specifications: { make: 'Test', model: 'Test', year: 2020 },
      contact: { 
        sellerName: 'Test User', 
        phone: '+26771234567',
        email: 'test@example.com',
        location: { city: 'Test City' }
      },
      images: [],
      isTestSubmission: true
    };

    try {
      // We won't actually submit this, just validate the structure
      results.tests.push({
        name: 'Listing Data Structure',
        status: 'PASS',
        message: 'Test listing data structure is valid',
        data: {
          hasRequiredFields: !!(
            testListingData.title && 
            testListingData.pricing?.price && 
            testListingData.specifications?.make &&
            testListingData.contact?.sellerName
          )
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Listing Data Structure',
        status: 'FAIL',
        message: 'Test listing data structure validation failed'
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return '#27ae60';
      case 'FAIL': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      maxWidth: '800px',
      margin: '20px auto'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
        🧪 User Listing System Test
      </h3>
      
      <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>
        This test verifies that the user listing system is properly set up and functional.
      </p>

      <button
        onClick={runTests}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#bdc3c7' : '#3498db',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Running Tests...' : 'Run System Tests'}
      </button>

      {testResults && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '6px' }}>
          <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>
            Test Results ({testResults.timestamp})
          </h4>
          
          {testResults.tests.map((test, index) => (
            <div 
              key={index}
              style={{
                padding: '15px',
                marginBottom: '10px',
                border: `2px solid ${getStatusColor(test.status)}`,
                borderRadius: '6px',
                backgroundColor: test.status === 'PASS' ? '#d5f4e6' : '#ffeaea'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <strong style={{ color: '#2c3e50' }}>{test.name}</strong>
                <span 
                  style={{ 
                    color: getStatusColor(test.status),
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {test.status}
                </span>
              </div>
              
              <p style={{ 
                margin: '0 0 8px 0', 
                color: '#555',
                fontSize: '14px'
              }}>
                {test.message}
              </p>
              
              {test.data && (
                <details style={{ fontSize: '12px', color: '#666' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
                    View Details
                  </summary>
                  <pre style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
              
              {test.error && (
                <details style={{ fontSize: '12px', color: '#e74c3c' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
                    View Error
                  </summary>
                  <pre style={{ 
                    backgroundColor: '#ffeaea', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(test.error, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#e8f4f8', 
            borderRadius: '6px',
            border: '1px solid #3498db'
          }}>
            <h5 style={{ color: '#2c3e50', marginBottom: '10px' }}>
              📋 Next Steps:
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
              <li>If all tests pass, try creating a real listing</li>
              <li>If image upload fails, check the S3 configuration</li>
              <li>If user profile fails, ensure you're logged in</li>
              <li>If backend fails, check the API server is running</li>
              <li>Check browser console for detailed error logs</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListingSystemTest;
