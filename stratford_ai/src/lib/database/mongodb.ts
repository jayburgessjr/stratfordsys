import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * MongoDB Service for Unstructured Data Storage
 * Optimized for news articles, sentiment analysis, and flexible document storage
 */

// =============================================================================
// Document Interfaces
// =============================================================================

export interface NewsArticle extends Document {
  _id: string
  title: string
  content: string
  summary?: string
  author?: string
  source: string
  sourceUrl: string
  publishedAt: Date

  // Sentiment Analysis
  sentiment: {
    score: number // -1 to 1
    magnitude: number // 0 to 1
    label: 'positive' | 'negative' | 'neutral'
  }

  // Market Relevance
  relatedSymbols: string[]
  categories: string[]
  impactScore: number // 0-10

  // Processing Metadata
  processed: boolean
  language: string
  wordCount: number

  // Full-text search fields
  searchVector?: string

  createdAt: Date
  updatedAt: Date
}

export interface SentimentAnalysis extends Document {
  _id: string
  sourceType: 'news' | 'social' | 'earnings' | 'analyst'
  sourceId: string
  symbol?: string

  // Sentiment Data
  sentiment: {
    overall: number // -1 to 1
    confidence: number // 0 to 1
    emotions: {
      joy: number
      fear: number
      anger: number
      sadness: number
      disgust: number
      surprise: number
    }
  }

  // Text Analysis
  keywords: string[]
  entities: Array<{
    name: string
    type: string
    confidence: number
  }>

  // Market Impact
  priceImpact?: {
    predicted: number
    actual?: number
    timeframe: string
  }

  timestamp: Date
  createdAt: Date
}

export interface SocialMediaPost extends Document {
  _id: string
  platform: 'twitter' | 'reddit' | 'discord' | 'telegram'
  postId: string
  author: string
  content: string

  // Engagement Metrics
  likes: number
  shares: number
  comments: number
  views?: number

  // Market Context
  mentionedSymbols: string[]
  hashtags: string[]

  // Analysis
  sentiment: number
  influence: number // Author's influence score
  virality: number // Post's viral potential

  timestamp: Date
  createdAt: Date
}

export interface EconomicEvent extends Document {
  _id: string
  name: string
  description: string
  country: string
  category: string

  // Event Details
  actual?: number
  forecast?: number
  previous?: number
  unit: string

  // Market Impact
  importance: 'low' | 'medium' | 'high'
  impactedMarkets: string[]
  volatilityExpected: number

  // Timing
  releaseTime: Date
  timezone: string

  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// MongoDB Schemas
// =============================================================================

const newsArticleSchema = new Schema<NewsArticle>({
  title: { type: String, required: true, index: 'text' },
  content: { type: String, required: true, index: 'text' },
  summary: { type: String, index: 'text' },
  author: String,
  source: { type: String, required: true, index: true },
  sourceUrl: { type: String, required: true, unique: true },
  publishedAt: { type: Date, required: true, index: true },

  sentiment: {
    score: { type: Number, min: -1, max: 1 },
    magnitude: { type: Number, min: 0, max: 1 },
    label: { type: String, enum: ['positive', 'negative', 'neutral'] }
  },

  relatedSymbols: [{ type: String, index: true }],
  categories: [String],
  impactScore: { type: Number, min: 0, max: 10 },

  processed: { type: Boolean, default: false, index: true },
  language: { type: String, default: 'en' },
  wordCount: Number,

  searchVector: String,
}, {
  timestamps: true,
  collection: 'news_articles'
})

const sentimentAnalysisSchema = new Schema<SentimentAnalysis>({
  sourceType: { type: String, enum: ['news', 'social', 'earnings', 'analyst'], index: true },
  sourceId: { type: String, required: true },
  symbol: { type: String, index: true },

  sentiment: {
    overall: { type: Number, min: -1, max: 1 },
    confidence: { type: Number, min: 0, max: 1 },
    emotions: {
      joy: Number,
      fear: Number,
      anger: Number,
      sadness: Number,
      disgust: Number,
      surprise: Number
    }
  },

  keywords: [String],
  entities: [{
    name: String,
    type: String,
    confidence: Number
  }],

  priceImpact: {
    predicted: Number,
    actual: Number,
    timeframe: String
  },

  timestamp: { type: Date, required: true, index: true },
}, {
  timestamps: true,
  collection: 'sentiment_analysis'
})

const socialMediaPostSchema = new Schema<SocialMediaPost>({
  platform: { type: String, enum: ['twitter', 'reddit', 'discord', 'telegram'], index: true },
  postId: { type: String, required: true },
  author: { type: String, index: true },
  content: { type: String, required: true, index: 'text' },

  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: Number,

  mentionedSymbols: [{ type: String, index: true }],
  hashtags: [String],

  sentiment: { type: Number, min: -1, max: 1 },
  influence: { type: Number, min: 0, max: 100 },
  virality: { type: Number, min: 0, max: 100 },

  timestamp: { type: Date, required: true, index: true },
}, {
  timestamps: true,
  collection: 'social_media_posts'
})

const economicEventSchema = new Schema<EconomicEvent>({
  name: { type: String, required: true, index: true },
  description: String,
  country: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },

  actual: Number,
  forecast: Number,
  previous: Number,
  unit: String,

  importance: { type: String, enum: ['low', 'medium', 'high'], index: true },
  impactedMarkets: [String],
  volatilityExpected: { type: Number, min: 0, max: 100 },

  releaseTime: { type: Date, required: true, index: true },
  timezone: String,
}, {
  timestamps: true,
  collection: 'economic_events'
})

// =============================================================================
// MongoDB Connection and Models
// =============================================================================

class MongoDBService {
  private static instance: MongoDBService
  private isConnected: boolean = false

  // Models
  public NewsArticle: Model<NewsArticle>
  public SentimentAnalysis: Model<SentimentAnalysis>
  public SocialMediaPost: Model<SocialMediaPost>
  public EconomicEvent: Model<EconomicEvent>

  private constructor() {
    // Initialize models
    this.NewsArticle = mongoose.model<NewsArticle>('NewsArticle', newsArticleSchema)
    this.SentimentAnalysis = mongoose.model<SentimentAnalysis>('SentimentAnalysis', sentimentAnalysisSchema)
    this.SocialMediaPost = mongoose.model<SocialMediaPost>('SocialMediaPost', socialMediaPostSchema)
    this.EconomicEvent = mongoose.model<EconomicEvent>('EconomicEvent', economicEventSchema)
  }

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService()
    }
    return MongoDBService.instance
  }

  async connect(): Promise<void> {
    if (this.isConnected) return

    try {
      const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/stratford_ai'

      await mongoose.connect(mongoUrl, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })

      this.isConnected = true

      // Create indexes for better performance
      await this.createIndexes()

      console.log('MongoDB connected successfully')
    } catch (error) {
      console.error('MongoDB connection failed:', error)
      throw error
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Compound indexes for common queries
      await this.NewsArticle.collection.createIndex({
        relatedSymbols: 1,
        publishedAt: -1
      })

      await this.NewsArticle.collection.createIndex({
        sentiment: 1,
        impactScore: -1
      })

      await this.SentimentAnalysis.collection.createIndex({
        symbol: 1,
        timestamp: -1
      })

      await this.SocialMediaPost.collection.createIndex({
        mentionedSymbols: 1,
        timestamp: -1
      })

      await this.EconomicEvent.collection.createIndex({
        releaseTime: -1,
        importance: 1
      })

      console.log('MongoDB indexes created successfully')
    } catch (error) {
      console.error('Failed to create MongoDB indexes:', error)
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect()
      this.isConnected = false
      console.log('MongoDB disconnected')
    }
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1
  }

  // =============================================================================
  // News Article Operations
  // =============================================================================

  async saveNewsArticle(article: Partial<NewsArticle>): Promise<NewsArticle> {
    const newsArticle = new this.NewsArticle(article)
    return await newsArticle.save()
  }

  async findNewsArticles(
    query: any = {},
    options: {
      limit?: number
      skip?: number
      sort?: any
    } = {}
  ): Promise<NewsArticle[]> {
    return await this.NewsArticle
      .find(query)
      .limit(options.limit || 50)
      .skip(options.skip || 0)
      .sort(options.sort || { publishedAt: -1 })
      .exec()
  }

  async getNewsForSymbol(
    symbol: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<NewsArticle[]> {
    const query: any = { relatedSymbols: symbol }

    if (startDate || endDate) {
      query.publishedAt = {}
      if (startDate) query.publishedAt.$gte = startDate
      if (endDate) query.publishedAt.$lte = endDate
    }

    return await this.findNewsArticles(query)
  }

  async searchNewsArticles(
    searchText: string,
    filters: {
      symbols?: string[]
      sentiment?: string
      minImpactScore?: number
      startDate?: Date
      endDate?: Date
    } = {}
  ): Promise<NewsArticle[]> {
    const query: any = {
      $text: { $search: searchText }
    }

    if (filters.symbols?.length) {
      query.relatedSymbols = { $in: filters.symbols }
    }

    if (filters.sentiment) {
      query['sentiment.label'] = filters.sentiment
    }

    if (filters.minImpactScore) {
      query.impactScore = { $gte: filters.minImpactScore }
    }

    if (filters.startDate || filters.endDate) {
      query.publishedAt = {}
      if (filters.startDate) query.publishedAt.$gte = filters.startDate
      if (filters.endDate) query.publishedAt.$lte = filters.endDate
    }

    return await this.NewsArticle
      .find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
      .limit(20)
      .exec()
  }

  // =============================================================================
  // Sentiment Analysis Operations
  // =============================================================================

  async saveSentimentAnalysis(sentiment: Partial<SentimentAnalysis>): Promise<SentimentAnalysis> {
    const analysis = new this.SentimentAnalysis(sentiment)
    return await analysis.save()
  }

  async getSymbolSentiment(
    symbol: string,
    timeframe: number = 24 // hours
  ): Promise<{
    overall: number
    trend: string
    confidence: number
    dataPoints: number
  }> {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - timeframe)

    const sentiments = await this.SentimentAnalysis
      .find({
        symbol,
        timestamp: { $gte: startTime }
      })
      .sort({ timestamp: -1 })
      .exec()

    if (sentiments.length === 0) {
      return {
        overall: 0,
        trend: 'neutral',
        confidence: 0,
        dataPoints: 0
      }
    }

    const overall = sentiments.reduce((sum, s) => sum + s.sentiment.overall, 0) / sentiments.length
    const confidence = sentiments.reduce((sum, s) => sum + s.sentiment.confidence, 0) / sentiments.length

    // Calculate trend (comparing first and last sentiment)
    const recent = sentiments.slice(0, Math.min(5, sentiments.length))
    const older = sentiments.slice(-Math.min(5, sentiments.length))

    const recentAvg = recent.reduce((sum, s) => sum + s.sentiment.overall, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s.sentiment.overall, 0) / older.length

    let trend = 'neutral'
    if (recentAvg > olderAvg + 0.1) trend = 'improving'
    else if (recentAvg < olderAvg - 0.1) trend = 'declining'

    return {
      overall,
      trend,
      confidence,
      dataPoints: sentiments.length
    }
  }

  // =============================================================================
  // Social Media Operations
  // =============================================================================

  async saveSocialMediaPost(post: Partial<SocialMediaPost>): Promise<SocialMediaPost> {
    const socialPost = new this.SocialMediaPost(post)
    return await socialPost.save()
  }

  async getSocialSentimentForSymbol(
    symbol: string,
    platform?: string,
    hours: number = 24
  ): Promise<{
    sentiment: number
    volume: number
    topInfluencers: Array<{ author: string; influence: number; sentiment: number }>
  }> {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    const query: any = {
      mentionedSymbols: symbol,
      timestamp: { $gte: startTime }
    }

    if (platform) {
      query.platform = platform
    }

    const posts = await this.SocialMediaPost
      .find(query)
      .sort({ timestamp: -1 })
      .exec()

    if (posts.length === 0) {
      return { sentiment: 0, volume: 0, topInfluencers: [] }
    }

    const sentiment = posts.reduce((sum, p) => sum + p.sentiment, 0) / posts.length

    // Get top influencers
    const influencerMap = new Map<string, { influence: number; sentiment: number; count: number }>()

    posts.forEach(post => {
      const existing = influencerMap.get(post.author) || { influence: 0, sentiment: 0, count: 0 }
      existing.influence = Math.max(existing.influence, post.influence)
      existing.sentiment = (existing.sentiment * existing.count + post.sentiment) / (existing.count + 1)
      existing.count++
      influencerMap.set(post.author, existing)
    })

    const topInfluencers = Array.from(influencerMap.entries())
      .map(([author, data]) => ({
        author,
        influence: data.influence,
        sentiment: data.sentiment
      }))
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 5)

    return {
      sentiment,
      volume: posts.length,
      topInfluencers
    }
  }

  // =============================================================================
  // Economic Events Operations
  // =============================================================================

  async saveEconomicEvent(event: Partial<EconomicEvent>): Promise<EconomicEvent> {
    const economicEvent = new this.EconomicEvent(event)
    return await economicEvent.save()
  }

  async getUpcomingEvents(
    days: number = 7,
    importance?: string
  ): Promise<EconomicEvent[]> {
    const startTime = new Date()
    const endTime = new Date()
    endTime.setDate(endTime.getDate() + days)

    const query: any = {
      releaseTime: {
        $gte: startTime,
        $lte: endTime
      }
    }

    if (importance) {
      query.importance = importance
    }

    return await this.EconomicEvent
      .find(query)
      .sort({ releaseTime: 1 })
      .exec()
  }

  // =============================================================================
  // Analytics and Aggregations
  // =============================================================================

  async getMarketSentimentOverview(): Promise<{
    news: { positive: number; negative: number; neutral: number }
    social: { positive: number; negative: number; neutral: number }
    trending: Array<{ symbol: string; mentions: number; sentiment: number }>
  }> {
    const [newsStats, socialStats, trending] = await Promise.all([
      // News sentiment distribution
      this.NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 }
        }}
      ]),

      // Social sentiment distribution
      this.SocialMediaPost.aggregate([
        { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: {
            $cond: [
              { $gt: ['$sentiment', 0.1] }, 'positive',
              { $cond: [
                { $lt: ['$sentiment', -0.1] }, 'negative', 'neutral'
              ]}
            ]
          },
          count: { $sum: 1 }
        }}
      ]),

      // Trending symbols
      this.SocialMediaPost.aggregate([
        { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $unwind: '$mentionedSymbols' },
        { $group: {
          _id: '$mentionedSymbols',
          mentions: { $sum: 1 },
          avgSentiment: { $avg: '$sentiment' }
        }},
        { $sort: { mentions: -1 } },
        { $limit: 10 },
        { $project: {
          symbol: '$_id',
          mentions: 1,
          sentiment: '$avgSentiment',
          _id: 0
        }}
      ])
    ])

    // Process results
    const newsDistribution = { positive: 0, negative: 0, neutral: 0 }
    newsStats.forEach((stat: any) => {
      newsDistribution[stat._id as keyof typeof newsDistribution] = stat.count
    })

    const socialDistribution = { positive: 0, negative: 0, neutral: 0 }
    socialStats.forEach((stat: any) => {
      socialDistribution[stat._id as keyof typeof socialDistribution] = stat.count
    })

    return {
      news: newsDistribution,
      social: socialDistribution,
      trending
    }
  }

  // Database statistics
  async getCollectionStats(): Promise<{
    newsArticles: number
    sentimentAnalysis: number
    socialPosts: number
    economicEvents: number
  }> {
    const [newsCount, sentimentCount, socialCount, eventCount] = await Promise.all([
      this.NewsArticle.countDocuments(),
      this.SentimentAnalysis.countDocuments(),
      this.SocialMediaPost.countDocuments(),
      this.EconomicEvent.countDocuments()
    ])

    return {
      newsArticles: newsCount,
      sentimentAnalysis: sentimentCount,
      socialPosts: socialCount,
      economicEvents: eventCount
    }
  }
}

// Export singleton instance
export const mongoService = MongoDBService.getInstance()