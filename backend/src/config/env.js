// backend/src/config/env.js
//
// Centralizes and validates all environment variables the backend needs.
// Every other file should read config from here rather than touching
// process.env directly - one place to see what's required, one place
// that fails loudly (at boot) if something is missing.
//
// PROJECT_STRUCTURE.md: config/ = "Environment configuration, Database connection"

require('dotenv').config();

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
];

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `env.js: required environment variable "${name}" is not set. ` +
        `Check your .env file against .env.example.`
    );
  }
  return value;
}

// Fail fast at boot, not on the first request that needs the missing var.
REQUIRED_VARS.forEach(requireEnv);

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,

  DB_HOST: requireEnv('DB_HOST'),
  DB_PORT: Number(requireEnv('DB_PORT')),
  DB_USER: requireEnv('DB_USER'),
  DB_PASSWORD: requireEnv('DB_PASSWORD'),
  // DATABASE_SCHEMA.md: "Database Name: transitops" - not hardcoded here,
  // still sourced from env so local/staging/prod can point at different
  // schemas if needed, but defaults to the spec's name.
  DB_NAME: process.env.DB_NAME || 'transitops',

  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRY: process.env.JWT_EXPIRY || '8h',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = env;
