export function validateEnv() {
    const requiredEnvVars = [
      'AUTH_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];
  
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }