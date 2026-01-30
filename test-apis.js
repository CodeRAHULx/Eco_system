// Quick API Test Script
const http = require('http');

const testEndpoints = [
  { name: 'Environmental Impact', path: '/api/ai/environmental-impact?period=30' },
  { name: 'Incident Prediction', path: '/api/ai/incident-prediction' },
  { name: 'Safety Tips', path: '/api/ai/safety-tips' },
  { name: 'Collection Prediction', path: '/api/ai/predict-collection?days=7' },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ ${endpoint.name}:`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Success: ${json.success}`);
          if (json.impact) console.log(`   Impact: ${JSON.stringify(json.impact, null, 2).substring(0, 200)}...`);
          if (json.riskScore !== undefined) console.log(`   Risk Score: ${json.riskScore}`);
          if (json.tips) console.log(`   Tips Count: ${json.tips.length}`);
          if (json.predictions) console.log(`   Predictions: ${json.predictions.length} days`);
          resolve(true);
        } catch (e) {
          console.log(`\n⚠️ ${endpoint.name}: Parse error - ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`\n❌ ${endpoint.name}: ${e.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`\n⏰ ${endpoint.name}: Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Check if server is up first
function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 5000, path: '/', method: 'GET', timeout: 2000 }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing EcoSustain AI APIs...\n');
  
  const serverUp = await checkServer();
  if (!serverUp) {
    console.log('❌ Server is not running on port 5000!');
    console.log('💡 Please start with: node server.js');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  console.log('=' .repeat(50));
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests complete!');
}

runTests();
