// Load environment variables for API runtime
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiEnvPath = path.resolve(__dirname, '..', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');

// Load root .env first, then allow api/.env to override if present.
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: apiEnvPath, override: true });
