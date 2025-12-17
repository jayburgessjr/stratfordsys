
import { FieldEncryption } from './encryption';

describe('FieldEncryption Verification', () => {
    it('should encrypt and decrypt correctly with new implementation', () => {
        const encryption = FieldEncryption.getInstance();
        const secret = 'super-secret-data';
        const context = 'user:123';

        const encrypted = encryption.encrypt(secret, context);

        expect(encrypted.encryptedData).toBeDefined();
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.tag).toBeDefined();
        expect(encrypted.algorithm).toBe('aes-256-gcm');

        const decrypted = encryption.decrypt(encrypted, context);
        expect(decrypted).toBe(secret);
    });

    it('should fail validation if data is tampered', () => {
        const encryption = FieldEncryption.getInstance();
        const secret = 'data';
        const encrypted = encryption.encrypt(secret, 'ctx');

        // Tamper with data
        encrypted.encryptedData = '00' + encrypted.encryptedData.slice(2);

        expect(() => encryption.decrypt(encrypted, 'ctx')).toThrow();
    });
});
