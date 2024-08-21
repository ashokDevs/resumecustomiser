 import  crypto from "crypto"; 
//const crypto = require("crypto")

// Encryption key should be stored as an environment variable
const encryptionKey = (
  process.env.ENCRYPTION_KEY || "your-encryption-key"
).padEnd(32, " ");

export default  function encryptApiKey(apiKey) {
  if (!apiKey) throw new Error("API key is required");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    iv
  );
  let encrypted = cipher.update(apiKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

 export  function decryptApiKey(encryptedApiKey) {
  if (!encryptedApiKey) throw new Error("Encrypted API key is required");
  const textParts = encryptedApiKey.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Test encryption and decryption
/* try {
  const encryptedApiKey = encryptApiKey(
    ""
  );

  const decryptedApiKey = decryptApiKey(
    encryptedApiKey
  );

} catch (error) {
  console.error("Error:", error.message);
}
 */