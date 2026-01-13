/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables from .env file (for local development)
dotenv.config({
  quiet: true,
});

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all v2 functions
// Region: asia-southeast1 (Singapore) - gần Việt Nam nhất, latency thấp
setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
  minInstances: 0,
  memory: "256MiB",
  cpu: 0.5,
  timeoutSeconds: 120,
});

// Export handlers
export { requestDownload } from "./routes/requestDownload";
export { confirmDownload } from "./routes/confirmDownload";
export { addUser } from "./routes/addUser";
export { verifyPay } from "./routes/verifyPay";
export { checkPayCode } from "./routes/checkPayCode";
export { getPayCodeByCollaborators } from "./routes/getPayCodeByCollaborators";
export { createInternalUserHandler as createInternalUser } from "./routes/createInternalUser";
