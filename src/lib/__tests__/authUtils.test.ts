import { describe, it, expect } from "vitest";
import { hashAccessCode, generateSalt } from "../../../functions/api/github/authUtils";

describe("authUtils hashing", () => {
  it("generates a random salt of correct length", () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);
    expect(salt1.length).toBe(16);
    expect(salt2.length).toBe(16);
    expect(salt1).not.toBe(salt2); // Extremely unlikely to be equal
  });

  it("hashes password with salt using SHA-256", async () => {
    const password = "myPassword123";
    const salt = "randomSalt";
    const hash = await hashAccessCode(password, salt);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex is 64 characters

    // Matches verify
    const hash2 = await hashAccessCode(password, salt);
    expect(hash2).toBe(hash);

    // Different salt or password yields different hash
    const hashDifferentPassword = await hashAccessCode("different", salt);
    expect(hashDifferentPassword).not.toBe(hash);

    const hashDifferentSalt = await hashAccessCode(password, "different");
    expect(hashDifferentSalt).not.toBe(hash);
  });
});
