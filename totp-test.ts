import { generateTotpSecretKey, verifyTotpCode, generateTotpUri } from "./src/lib/totp";
import { generateSync } from "otplib";

const secret = generateTotpSecretKey();
console.log("Secret:", secret);
const uri = generateTotpUri(secret, "test@test.com");
console.log("URI:", uri);
const token = generateSync({ secret });
console.log("Token:", token);
const isValid = verifyTotpCode(secret, token);
console.log("IsValid:", isValid);
