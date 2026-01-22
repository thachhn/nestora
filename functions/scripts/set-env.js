#!/usr/bin/env node

/**
 * Script to set environment variables for Firebase Functions v2 (Cloud Run)
 * Usage: node scripts/set-env.js KEY1=value1 KEY2=value2 ...
 * Or: npm run set-env KEY1=value1 KEY2=value2 ...
 */

const { execSync } = require('child_process');

const PROJECT_ID = 'nestora-register';
const REGION = 'asia-southeast1';

// Function names (update this list if you add/remove functions)
const FUNCTIONS = [
  'requestDownload',
  'confirmDownload',
  'addUser',
  'verifyPay',
  'checkPayCode',
  'getPayCodeByCollaborators',
  'createInternalUser',
];

function setEnvForService(serviceName, envVars) {
  try {
    console.log(`Setting environment variables for ${serviceName}...`);
    
    execSync(
      `gcloud run services update ${serviceName} ` +
      `--project=${PROJECT_ID} ` +
      `--region=${REGION} ` +
      `--update-env-vars="${envVars}" ` +
      `--quiet`,
      { stdio: 'inherit' }
    );
    return true;
  } catch (error) {
    console.warn(`Warning: Could not update ${serviceName} (may not exist yet)`);
    return false;
  }
}

function findServiceName(functionName) {
  try {
    const output = execSync(
      `gcloud run services list ` +
      `--project=${PROJECT_ID} ` +
      `--region=${REGION} ` +
      `--filter="metadata.name~${functionName}" ` +
      `--format="value(metadata.name)" ` +
      `--limit=1`,
      { encoding: 'utf-8' }
    );
    return output.trim();
  } catch (error) {
    return null;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const envVars = args.filter(arg => arg.includes('='));

if (envVars.length === 0) {
  console.error('Usage: node scripts/set-env.js KEY1=value1 KEY2=value2 ...');
  console.error('Example: node scripts/set-env.js SMTP_USER=test@gmail.com SMTP_PASS=password123 API_KEY=mykey');
  process.exit(1);
}

const envVarsString = envVars.join(',');

console.log('Setting environment variables:', envVarsString);
console.log(`Project: ${PROJECT_ID}`);
console.log(`Region: ${REGION}`);
console.log('');

let updatedCount = 0;

// Set for all functions
for (const func of FUNCTIONS) {
  const serviceName = findServiceName(func);
  
  if (serviceName) {
    if (setEnvForService(serviceName, envVarsString)) {
      updatedCount++;
    }
  } else {
    console.log(`Service for function ${func} not found (may need to deploy first)`);
  }
}

console.log('');
if (updatedCount > 0) {
  console.log(`✅ Updated ${updatedCount} service(s)!`);
} else {
  console.log('⚠️  No services were updated. Make sure functions are deployed first.');
}
console.log('');
console.log('Note: You may need to redeploy functions for changes to take effect:');
console.log('  firebase deploy --only functions');
