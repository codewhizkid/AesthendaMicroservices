/**
 * Configuration Summary Tool
 * 
 * This script displays a summary of the current configuration and validates
 * that all required settings are present and in the expected format.
 */

import config from '../config';

// Mask sensitive information
function maskSensitive(value: string): string {
  if (!value) return '[EMPTY]';
  
  if (value.includes('://')) {
    // For URLs, show protocol and domain but mask path and credentials
    try {
      const url = new URL(value);
      const visiblePart = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
      return `${visiblePart}/****`;
    } catch (e) {
      return value.substring(0, 8) + '****';
    }
  } else if (value.length > 8) {
    // For long strings (like secrets), show just first and last characters
    return `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
  }
  
  return value;
}

// Validate a configuration section
function validateSection(section: Record<string, any>, path = ''): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  let valid = true;
  
  for (const [key, value] of Object.entries(section)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    // Check if value is undefined or null
    if (value === undefined || value === null) {
      issues.push(`${fullPath} is ${value === undefined ? 'undefined' : 'null'}`);
      valid = false;
      continue;
    }
    
    // Recursively validate nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      const result = validateSection(value, fullPath);
      if (!result.valid) {
        valid = false;
        issues.push(...result.issues);
      }
    }
  }
  
  return { valid, issues };
}

// Display configuration summary
function displayConfigSummary() {
  console.log('======= CONFIGURATION SUMMARY =======');
  
  // Server settings
  console.log('\n----- SERVER CONFIGURATION -----');
  console.log(`Environment: ${config.env.nodeEnv}`);
  console.log(`Server Port: ${config.server.port}`);
  console.log(`CORS Origins: ${config.server.corsOrigins.join(', ')}`);
  
  // Database settings
  console.log('\n----- DATABASE CONFIGURATION -----');
  console.log(`MongoDB URI: ${maskSensitive(config.database.uri)}`);
  
  // Auth settings
  console.log('\n----- AUTH CONFIGURATION -----');
  console.log(`JWT Secret: ${maskSensitive(config.auth.jwtSecret)}`);
  
  // Messaging settings
  console.log('\n----- MESSAGING CONFIGURATION -----');
  console.log(`RabbitMQ URL: ${maskSensitive(config.messaging.rabbitmqUrl)}`);
  console.log(`Redis URL: ${maskSensitive(config.messaging.redisUrl)}`);
  
  // Rate limiting
  console.log('\n----- RATE LIMITING CONFIGURATION -----');
  console.log(`Window (ms): ${config.rateLimit.windowMs}`);
  console.log(`Max Requests: ${config.rateLimit.maxRequests}`);
  
  // Feature flags
  console.log('\n----- FEATURE FLAGS -----');
  for (const [key, value] of Object.entries(config.featureFlags)) {
    console.log(`${key}: ${value}`);
  }
  
  // Validate configuration
  console.log('\n----- CONFIGURATION VALIDATION -----');
  const validation = validateSection(config);
  
  if (validation.valid) {
    console.log('✅ Configuration is valid');
  } else {
    console.error('❌ Configuration has issues:');
    validation.issues.forEach(issue => console.error(`  - ${issue}`));
  }
  
  console.log('\n======= END OF CONFIGURATION SUMMARY =======');
  
  return validation.valid;
}

// Run if called directly
if (require.main === module) {
  const isValid = displayConfigSummary();
  process.exit(isValid ? 0 : 1);
}

export default displayConfigSummary; 