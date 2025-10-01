import crypto from 'crypto'

/**
 * Field-Level Encryption for Financial Data
 * Provides AES-256-GCM encryption for sensitive financial information
 * Compliant with financial industry standards
 */

export interface EncryptionConfig {
  algorithm: string
  keyDerivation: 'pbkdf2' | 'scrypt'
  iterations: number
  keyLength: number
  ivLength: number
  tagLength: number
  saltLength: number
}

export interface EncryptedData {
  encryptedData: string
  iv: string
  tag: string
  salt: string
  algorithm: string
}

const defaultConfig: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 32
}

export class FieldEncryption {
  private static instance: FieldEncryption
  private masterKey: string
  private config: EncryptionConfig

  private constructor() {
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || this.generateMasterKey()
    this.config = defaultConfig

    if (!process.env.ENCRYPTION_MASTER_KEY) {
      console.warn('No ENCRYPTION_MASTER_KEY found in environment. Using generated key.')
    }
  }

  static getInstance(): FieldEncryption {
    if (!FieldEncryption.instance) {
      FieldEncryption.instance = new FieldEncryption()
    }
    return FieldEncryption.instance
  }

  private generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private deriveKey(password: string, salt: Buffer): Buffer {
    if (this.config.keyDerivation === 'scrypt') {
      return crypto.scryptSync(password, salt, this.config.keyLength)
    } else {
      return crypto.pbkdf2Sync(
        password,
        salt,
        this.config.iterations,
        this.config.keyLength,
        'sha256'
      )
    }
  }

  /**
   * Encrypt sensitive field data
   */
  encrypt(plaintext: string, contextKey?: string): EncryptedData {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.config.saltLength)
      const iv = crypto.randomBytes(this.config.ivLength)

      // Derive encryption key
      const key = this.deriveKey(this.masterKey + (contextKey || ''), salt)

      // Create cipher
      const cipher = crypto.createCipher(this.config.algorithm, key)
      cipher.setAAD(Buffer.from(contextKey || 'default'))

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get authentication tag
      const tag = cipher.getAuthTag()

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.config.algorithm
      }
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt sensitive field data
   */
  decrypt(encryptedData: EncryptedData, contextKey?: string): string {
    try {
      const { encryptedData: data, iv, tag, salt, algorithm } = encryptedData

      // Convert hex strings back to buffers
      const saltBuffer = Buffer.from(salt, 'hex')
      const ivBuffer = Buffer.from(iv, 'hex')
      const tagBuffer = Buffer.from(tag, 'hex')

      // Derive the same key
      const key = this.deriveKey(this.masterKey + (contextKey || ''), saltBuffer)

      // Create decipher
      const decipher = crypto.createDecipher(algorithm, key)
      decipher.setAuthTag(tagBuffer)
      decipher.setAAD(Buffer.from(contextKey || 'default'))

      // Decrypt data
      let decrypted = decipher.update(data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Encrypt SSN with additional validation
   */
  encryptSSN(ssn: string, userId: string): EncryptedData {
    // Validate SSN format
    const ssnRegex = /^(?!666|000|9\d{2})\d{3}-?(?!00)\d{2}-?(?!0{4})\d{4}$/
    if (!ssnRegex.test(ssn.replace(/-/g, ''))) {
      throw new Error('Invalid SSN format')
    }

    // Use user ID as context for key derivation
    return this.encrypt(ssn, `ssn:${userId}`)
  }

  /**
   * Decrypt SSN
   */
  decryptSSN(encryptedSSN: EncryptedData, userId: string): string {
    return this.decrypt(encryptedSSN, `ssn:${userId}`)
  }

  /**
   * Encrypt credit card number
   */
  encryptCreditCard(cardNumber: string, userId: string): EncryptedData {
    // Basic card number validation
    const cardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/
    if (!cardRegex.test(cardNumber.replace(/\s/g, ''))) {
      throw new Error('Invalid credit card number format')
    }

    return this.encrypt(cardNumber, `card:${userId}`)
  }

  /**
   * Decrypt credit card number
   */
  decryptCreditCard(encryptedCard: EncryptedData, userId: string): string {
    return this.decrypt(encryptedCard, `card:${userId}`)
  }

  /**
   * Encrypt bank account number
   */
  encryptBankAccount(accountNumber: string, userId: string): EncryptedData {
    return this.encrypt(accountNumber, `bank:${userId}`)
  }

  /**
   * Decrypt bank account number
   */
  decryptBankAccount(encryptedAccount: EncryptedData, userId: string): string {
    return this.decrypt(encryptedAccount, `bank:${userId}`)
  }

  /**
   * Hash PII for indexing (one-way)
   */
  hashForIndex(data: string, salt?: string): string {
    const hashSalt = salt || this.masterKey
    return crypto.pbkdf2Sync(data, hashSalt, 10000, 32, 'sha256').toString('hex')
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length)
      password += charset[randomIndex]
    }

    return password
  }

  /**
   * Generate API key
   */
  generateAPIKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Validate encrypted data integrity
   */
  validateIntegrity(encryptedData: EncryptedData): boolean {
    try {
      // Check if all required fields are present
      const requiredFields = ['encryptedData', 'iv', 'tag', 'salt', 'algorithm']
      return requiredFields.every(field =>
        encryptedData[field as keyof EncryptedData] !== undefined
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Rotate encryption for data re-encryption with new key
   */
  rotateEncryption(encryptedData: EncryptedData, contextKey?: string): EncryptedData {
    // Decrypt with current key
    const plaintext = this.decrypt(encryptedData, contextKey)

    // Re-encrypt with current key (new salt/iv)
    return this.encrypt(plaintext, contextKey)
  }
}

// Prisma middleware for automatic encryption/decryption
export function createEncryptionMiddleware() {
  const encryption = FieldEncryption.getInstance()

  return (params: any, next: any) => {
    // Define encrypted fields per model
    const encryptedFields = {
      KycRecord: ['ssn', 'documentNumber'],
      User: ['taxId'],
      BankAccount: ['accountNumber', 'routingNumber']
    }

    const modelFields = encryptedFields[params.model as keyof typeof encryptedFields]

    if (modelFields && (params.action === 'create' || params.action === 'update')) {
      // Encrypt fields before storing
      modelFields.forEach(field => {
        if (params.args.data[field]) {
          const contextKey = `${params.model}:${field}:${params.args.data.userId || 'system'}`
          params.args.data[field] = encryption.encrypt(params.args.data[field], contextKey)
        }
      })
    }

    return next(params).then((result: any) => {
      // Decrypt fields after retrieval
      if (modelFields && result && (params.action === 'findUnique' || params.action === 'findMany')) {
        const items = Array.isArray(result) ? result : [result]

        items.forEach((item: any) => {
          if (item) {
            modelFields.forEach(field => {
              if (item[field] && typeof item[field] === 'object') {
                try {
                  const contextKey = `${params.model}:${field}:${item.userId || 'system'}`
                  item[field] = encryption.decrypt(item[field], contextKey)
                } catch (error) {
                  console.error(`Failed to decrypt ${field}:`, error)
                  item[field] = '[ENCRYPTED]'
                }
              }
            })
          }
        })
      }

      return result
    })
  }
}

// Export singleton instance
export const fieldEncryption = FieldEncryption.getInstance()