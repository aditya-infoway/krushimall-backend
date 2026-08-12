import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import path from "path";
import { readFileSync } from "fs";
const serviceAccount = JSON.parse(readFileSync(path.join(process.cwd(), "firebase", "service-account.json"), "utf8"));
const app = getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
    });
export { app, getMessaging };
//# sourceMappingURL=firebase.js.map