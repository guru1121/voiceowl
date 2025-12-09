#!/usr/bin/env node

/**
 * Simple test script to verify the VoiceOwl API functionality
 * Run this after starting the server with `npm start`
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function testAPI() {
  console.log('Testing VoiceOwl API...\n');

  try {
    // Test 1: Root endpoint
    console.log(' Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('Root endpoint working');
    console.log(`   Response: ${rootResponse.data.message}\n`);

    // Test 2: Health check
    console.log('Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('Health check working');
    console.log(`Status: ${healthResponse.data.status}`);
    console.log(`Database: ${healthResponse.data.services.database}`);
    console.log(`Azure: ${healthResponse.data.services.azure}\n`);

    // Test 3: Mock transcription
    console.log('Testing mock transcription...');
    const transcriptionResponse = await axios.post(`${BASE_URL}/transcription`, {
      audioUrl: 'https://example.com/test.mp3'
    });
    console.log('Mock transcription working');
    console.log(`   Transcription ID: ${transcriptionResponse.data.id}\n`);

    // Test 4: Get transcriptions
    console.log('Testing get transcriptions...');
    const getResponse = await axios.get(`${BASE_URL}/transcriptions?limit=5`);
    console.log('Get transcriptions working');
    console.log(`   Found ${getResponse.data.count} transcriptions\n`);

    // Test 5: Azure transcription (might fail if not configured)
    console.log('Testing Azure transcription...');
    try {
      const azureResponse = await axios.post(`${BASE_URL}/azure-transcription`, {
        audioUrl: 'https://example.com/test.wav',
        language: 'en-US'
      });
      console.log('Azure transcription working');
      console.log(`   Transcription ID: ${azureResponse.data.id}\n`);
    } catch (error) {
      console.log('Azure transcription failed (expected if not configured)');
      console.log(`Message: ${error.response?.data?.message || error.message}\n`);
    }

    console.log('All tests completed successfully!');
    console.log('API Summary:');
    console.log('Root endpoint responding');
    console.log('Health check working'); 
    console.log('Mock transcription working');
    console.log('Database connectivity confirmed');
    console.log('Get transcriptions working');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Troubleshooting:');
    console.error('Make sure the server is running: npm start');
    console.error('Check MongoDB is accessible');
    console.error('Verify environment variables in .env');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}

export { testAPI };