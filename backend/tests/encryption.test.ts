import { encrypt, decrypt } from "../lib/encryption";

describe("encryption", () => {
  const key = "test-encryption-key-for-unit-tests";

  it("should encrypt and decrypt a string", () => {
    const plaintext = "my-secret-token-123";
    const ciphertext = encrypt(plaintext, key);

    expect(ciphertext).not.toBe(plaintext);
    expect(typeof ciphertext).toBe("string");

    const decrypted = decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for same plaintext (random IV)", () => {
    const plaintext = "same-plaintext";
    const c1 = encrypt(plaintext, key);
    const c2 = encrypt(plaintext, key);

    expect(c1).not.toBe(c2);
    expect(decrypt(c1, key)).toBe(plaintext);
    expect(decrypt(c2, key)).toBe(plaintext);
  });

  it("should fail to decrypt with wrong key", () => {
    const ciphertext = encrypt("secret", key);
    expect(() => decrypt(ciphertext, "wrong-key")).toThrow();
  });

  it("should fail to decrypt corrupted ciphertext", () => {
    expect(() => decrypt("not-valid-base64!!!", key)).toThrow();
  });

  it("should handle empty string", () => {
    const ciphertext = encrypt("", key);
    const decrypted = decrypt(ciphertext, key);
    expect(decrypted).toBe("");
  });

  it("should handle unicode text", () => {
    const plaintext = "bismillah - \u0628\u0633\u0645 \u0627\u0644\u0644\u0647";
    const ciphertext = encrypt(plaintext, key);
    const decrypted = decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });
});
