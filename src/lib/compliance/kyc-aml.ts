import { prisma } from '@/lib/database/prisma'
import { fieldEncryption } from '@/lib/security/encryption'
import { z } from 'zod'

/**
 * KYC/AML Verification Workflows
 * Comprehensive compliance system for financial regulations
 */

export interface KYCSubmission {
  userId: string
  fullName: string
  dateOfBirth: Date
  nationality: string
  ssn?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  identityDocument: {
    type: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID'
    number: string
    expiryDate: Date
    images: string[]
  }
  sourceOfFunds: string
  politicallyExposed: boolean
  sanctionsCheck: boolean
}

export interface AMLRiskAssessment {
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskFactors: string[]
  requiresManualReview: boolean
  watchlistMatches: WatchlistMatch[]
}

export interface WatchlistMatch {
  listType: 'OFAC' | 'EU_SANCTIONS' | 'PEP' | 'ADVERSE_MEDIA'
  matchScore: number
  matchedName: string
  details: any
}

const kycSubmissionSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.date(),
  nationality: z.string().length(2), // ISO country code
  ssn: z.string().optional(),
  address: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    zipCode: z.string().min(5),
    country: z.string().length(2)
  }),
  identityDocument: z.object({
    type: z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID']),
    number: z.string().min(5),
    expiryDate: z.date(),
    images: z.array(z.string()).min(1)
  }),
  sourceOfFunds: z.string().min(10),
  politicallyExposed: z.boolean(),
  sanctionsCheck: z.boolean()
})

export class KYCAMLService {
  private static instance: KYCAMLService

  static getInstance(): KYCAMLService {
    if (!KYCAMLService.instance) {
      KYCAMLService.instance = new KYCAMLService()
    }
    return KYCAMLService.instance
  }

  /**
   * Submit KYC application
   */
  async submitKYC(userId: string, submission: KYCSubmission): Promise<string> {
    try {
      // Validate submission
      const validatedData = kycSubmissionSchema.parse(submission)

      // Encrypt sensitive data
      const encryptedSSN = submission.ssn
        ? fieldEncryption.encryptSSN(submission.ssn, userId)
        : null

      const encryptedDocNumber = fieldEncryption.encrypt(
        submission.identityDocument.number,
        `doc:${userId}`
      )

      // Create KYC record
      const kycRecord = await prisma.kycRecord.create({
        data: {
          userId,
          fullName: submission.fullName,
          dateOfBirth: submission.dateOfBirth,
          nationality: submission.nationality,
          ssn: encryptedSSN,
          streetAddress: submission.address.street,
          city: submission.address.city,
          state: submission.address.state,
          zipCode: submission.address.zipCode,
          country: submission.address.country,
          documentType: submission.identityDocument.type,
          documentNumber: encryptedDocNumber,
          documentExpiry: submission.identityDocument.expiryDate,
          documentImages: submission.identityDocument.images, // These should be encrypted file paths
          status: 'PENDING',
          riskScore: 0
        }
      })

      // Perform initial AML screening
      const amlAssessment = await this.performAMLScreening(userId, submission)

      // Update user with initial risk assessment
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'PENDING',
          amlStatus: amlAssessment.requiresManualReview ? 'PENDING' : 'CLEARED',
          riskLevel: amlAssessment.riskLevel
        }
      })

      // Create AML alerts if necessary
      if (amlAssessment.watchlistMatches.length > 0) {
        await this.createAMLAlerts(userId, amlAssessment.watchlistMatches)
      }

      // Log compliance activity
      await this.logComplianceActivity(userId, 'KYC_SUBMITTED', {
        kycRecordId: kycRecord.id,
        riskScore: amlAssessment.riskScore,
        watchlistMatches: amlAssessment.watchlistMatches.length
      })

      return kycRecord.id

    } catch (error) {
      console.error('KYC submission error:', error)
      throw new Error('Failed to submit KYC application')
    }
  }

  /**
   * Perform AML screening
   */
  async performAMLScreening(userId: string, submission: KYCSubmission): Promise<AMLRiskAssessment> {
    let riskScore = 0
    const riskFactors: string[] = []
    const watchlistMatches: WatchlistMatch[] = []

    // Age-based risk assessment
    const age = new Date().getFullYear() - submission.dateOfBirth.getFullYear()
    if (age < 21) {
      riskScore += 10
      riskFactors.push('YOUNG_AGE')
    }

    // High-risk country check
    const highRiskCountries = ['AF', 'IR', 'KP', 'SY'] // Simplified list
    if (highRiskCountries.includes(submission.nationality)) {
      riskScore += 50
      riskFactors.push('HIGH_RISK_COUNTRY')
    }

    // Politically Exposed Person (PEP) check
    if (submission.politicallyExposed) {
      riskScore += 30
      riskFactors.push('POLITICALLY_EXPOSED')
    }

    // Watchlist screening (simplified - in production, use real APIs)
    const nameMatches = await this.performWatchlistScreening(submission.fullName)
    watchlistMatches.push(...nameMatches)

    if (watchlistMatches.length > 0) {
      riskScore += watchlistMatches.reduce((sum, match) => sum + match.matchScore, 0)
      riskFactors.push('WATCHLIST_MATCH')
    }

    // Source of funds analysis
    const suspiciousSources = ['cryptocurrency', 'cash', 'gambling']
    if (suspiciousSources.some(source =>
      submission.sourceOfFunds.toLowerCase().includes(source)
    )) {
      riskScore += 20
      riskFactors.push('SUSPICIOUS_SOURCE_OF_FUNDS')
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    if (riskScore < 20) riskLevel = 'LOW'
    else if (riskScore < 50) riskLevel = 'MEDIUM'
    else if (riskScore < 80) riskLevel = 'HIGH'
    else riskLevel = 'CRITICAL'

    return {
      riskScore,
      riskLevel,
      riskFactors,
      requiresManualReview: riskScore >= 30 || watchlistMatches.length > 0,
      watchlistMatches
    }
  }

  /**
   * Perform watchlist screening
   */
  private async performWatchlistScreening(fullName: string): Promise<WatchlistMatch[]> {
    const matches: WatchlistMatch[] = []

    // Simplified OFAC screening (in production, use real OFAC API)
    const ofacMatches = await this.screenAgainstOFAC(fullName)
    matches.push(...ofacMatches)

    // PEP screening
    const pepMatches = await this.screenAgainstPEP(fullName)
    matches.push(...pepMatches)

    // Adverse media screening
    const mediaMatches = await this.screenAgainstAdverseMedia(fullName)
    matches.push(...mediaMatches)

    return matches
  }

  private async screenAgainstOFAC(name: string): Promise<WatchlistMatch[]> {
    // Simplified OFAC check - in production, use official OFAC API
    const sanctionedNames = [
      'OSAMA BIN LADEN',
      'SADDAM HUSSEIN',
      'KIM JONG UN'
    ]

    const matches: WatchlistMatch[] = []
    const normalizedName = name.toUpperCase()

    for (const sanctionedName of sanctionedNames) {
      const similarity = this.calculateNameSimilarity(normalizedName, sanctionedName)
      if (similarity > 0.8) {
        matches.push({
          listType: 'OFAC',
          matchScore: Math.round(similarity * 100),
          matchedName: sanctionedName,
          details: { originalName: name, similarity }
        })
      }
    }

    return matches
  }

  private async screenAgainstPEP(name: string): Promise<WatchlistMatch[]> {
    // Simplified PEP screening
    const pepNames = [
      'VLADIMIR PUTIN',
      'XI JINPING',
      'JOE BIDEN'
    ]

    const matches: WatchlistMatch[] = []
    const normalizedName = name.toUpperCase()

    for (const pepName of pepNames) {
      const similarity = this.calculateNameSimilarity(normalizedName, pepName)
      if (similarity > 0.9) {
        matches.push({
          listType: 'PEP',
          matchScore: Math.round(similarity * 100),
          matchedName: pepName,
          details: { originalName: name, similarity }
        })
      }
    }

    return matches
  }

  private async screenAgainstAdverseMedia(name: string): Promise<WatchlistMatch[]> {
    // Simplified adverse media screening
    // In production, integrate with news APIs and ML-based screening
    return []
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(name1, name2)
    const maxLength = Math.max(name1.length, name2.length)
    return 1 - (distance / maxLength)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Create AML alerts
   */
  private async createAMLAlerts(userId: string, matches: WatchlistMatch[]): Promise<void> {
    for (const match of matches) {
      await prisma.amlAlert.create({
        data: {
          userId,
          alertType: 'WATCHLIST_MATCH',
          severity: match.matchScore > 90 ? 'CRITICAL' : 'HIGH',
          description: `Potential match found on ${match.listType} list`,
          riskScore: match.matchScore,
          riskFactors: [`${match.listType}_MATCH`],
          watchlistType: match.listType,
          matchDetails: match.details,
          status: 'OPEN'
        }
      })
    }
  }

  /**
   * Approve KYC application
   */
  async approveKYC(kycRecordId: string, approvedBy: string, notes?: string): Promise<void> {
    const kycRecord = await prisma.kycRecord.findUnique({
      where: { id: kycRecordId },
      include: { user: true }
    })

    if (!kycRecord) {
      throw new Error('KYC record not found')
    }

    await prisma.$transaction([
      // Update KYC record
      prisma.kycRecord.update({
        where: { id: kycRecordId },
        data: {
          status: 'VERIFIED',
          verifiedBy: approvedBy,
          verifiedAt: new Date()
        }
      }),

      // Update user status
      prisma.user.update({
        where: { id: kycRecord.userId },
        data: {
          kycStatus: 'VERIFIED',
          permissions: ['READ_PORTFOLIO', 'CREATE_STRATEGY', 'EXECUTE_TRADES']
        }
      })
    ])

    await this.logComplianceActivity(kycRecord.userId, 'KYC_APPROVED', {
      kycRecordId,
      approvedBy,
      notes
    })
  }

  /**
   * Reject KYC application
   */
  async rejectKYC(kycRecordId: string, rejectedBy: string, reason: string): Promise<void> {
    const kycRecord = await prisma.kycRecord.findUnique({
      where: { id: kycRecordId }
    })

    if (!kycRecord) {
      throw new Error('KYC record not found')
    }

    await prisma.$transaction([
      // Update KYC record
      prisma.kycRecord.update({
        where: { id: kycRecordId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason
        }
      }),

      // Update user status
      prisma.user.update({
        where: { id: kycRecord.userId },
        data: {
          kycStatus: 'REJECTED',
          amlStatus: 'FLAGGED'
        }
      })
    ])

    await this.logComplianceActivity(kycRecord.userId, 'KYC_REJECTED', {
      kycRecordId,
      rejectedBy,
      reason
    })
  }

  /**
   * Monitor ongoing transactions for AML
   */
  async monitorTransaction(
    userId: string,
    amount: number,
    currency: string,
    counterparty?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return

    let riskScore = 0
    const riskFactors: string[] = []

    // Large transaction threshold
    if (amount > 10000) {
      riskScore += 30
      riskFactors.push('LARGE_TRANSACTION')
    }

    // High-risk currency
    const highRiskCurrencies = ['BTC', 'XMR', 'ZEC']
    if (highRiskCurrencies.includes(currency)) {
      riskScore += 40
      riskFactors.push('HIGH_RISK_CURRENCY')
    }

    // User risk level factor
    if (user.riskLevel === 'HIGH') {
      riskScore += 20
      riskFactors.push('HIGH_RISK_USER')
    }

    // Create alert if threshold exceeded
    if (riskScore >= 50) {
      await prisma.amlAlert.create({
        data: {
          userId,
          alertType: 'SUSPICIOUS_TRANSACTION',
          severity: riskScore >= 80 ? 'CRITICAL' : 'HIGH',
          description: `Suspicious transaction detected: ${amount} ${currency}`,
          amount,
          currency,
          riskScore,
          riskFactors,
          status: 'OPEN'
        }
      })
    }
  }

  /**
   * Generate SAR report
   */
  async generateSAR(
    userId: string,
    reportType: 'SUSPICIOUS_TRANSACTION' | 'MONEY_LAUNDERING' | 'TERRORIST_FINANCING',
    details: {
      amount: number
      transactionDate: Date
      description: string
      subjectDetails: any
    }
  ): Promise<string> {
    const sarNumber = `SAR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const sar = await prisma.suspiciousActivityReport.create({
      data: {
        userId,
        sarNumber,
        reportType,
        suspiciousAmount: details.amount,
        transactionDate: details.transactionDate,
        description: details.description,
        subjectName: details.subjectDetails.name,
        subjectType: details.subjectDetails.type || 'INDIVIDUAL',
        subjectDetails: details.subjectDetails,
        filedBy: 'SYSTEM',
        filedAt: new Date(),
        filingStatus: 'DRAFT'
      }
    })

    await this.logComplianceActivity(userId, 'SAR_GENERATED', {
      sarNumber,
      reportType,
      amount: details.amount
    })

    return sar.id
  }

  /**
   * Log compliance activity
   */
  private async logComplianceActivity(
    userId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    await prisma.userActivity.create({
      data: {
        userId,
        action,
        resource: 'COMPLIANCE',
        metadata: {
          ...metadata,
          timestamp: new Date(),
          automated: true
        }
      }
    })
  }
}

// Export singleton instance
export const kycAMLService = KYCAMLService.getInstance()