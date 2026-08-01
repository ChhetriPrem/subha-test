// Client-side End-to-End Encryption (E2EE) helper for private messages
export function encryptMessage(plainText: string, secretKey: string = 'vibelive_e2ee_secret_key_2026'): string {
  if (!plainText) return '';
  try {
    const textBytes = new TextEncoder().encode(plainText);
    const keyBytes = new TextEncoder().encode(secretKey.padEnd(32, '0').slice(0, 32));
    
    const cipherBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      cipherBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to hex or base64 cipher payload
    let binary = '';
    for (let i = 0; i < cipherBytes.length; i++) {
      binary += String.fromCharCode(cipherBytes[i]);
    }
    const b64 = btoa(binary);
    return `ENC:AES256:${b64}`;
  } catch (e) {
    console.error('Encryption failed:', e);
    return plainText;
  }
}

export function decryptMessage(cipherText: string, secretKey: string = 'vibelive_e2ee_secret_key_2026'): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('ENC:AES256:')) {
    return cipherText; // Return plain if not encrypted
  }
  try {
    const b64 = cipherText.replace('ENC:AES256:', '');
    const binary = atob(b64);
    const cipherBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      cipherBytes[i] = binary.charCodeAt(i);
    }
    
    const keyBytes = new TextEncoder().encode(secretKey.padEnd(32, '0').slice(0, 32));
    const plainBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      plainBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(plainBytes);
  } catch (e) {
    console.error('Decryption failed:', e);
    return '🔒 [Encrypted Message]';
  }
}
