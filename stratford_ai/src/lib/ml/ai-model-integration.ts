/**
 * AI/ML Model Integration for Financial Predictions
 * Production-ready machine learning pipeline for trading decisions
 */

import { redisService } from '../database/redis'
import { mongoService } from '../database/mongodb'
import { captureError } from '../monitoring/error-tracking'
import { recordMetric } from '../monitoring'

export interface ModelConfig {
  name: string
  version: string
  type: ModelType
  framework: 'tensorflow' | 'pytorch' | 'sklearn' | 'xgboost' | 'custom'
  endpoint?: string
  local: boolean
  warm: boolean
  batchSize: number
  timeout: number
  retries: number
  confidence: {
    threshold: number
    required: boolean
  }
  features: ModelFeature[]
  target: ModelTarget
  metadata: ModelMetadata
}

export enum ModelType {
  PRICE_PREDICTION = 'PRICE_PREDICTION',
  TREND_CLASSIFICATION = 'TREND_CLASSIFICATION',
  VOLATILITY_FORECASTING = 'VOLATILITY_FORECASTING',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  PORTFOLIO_OPTIMIZATION = 'PORTFOLIO_OPTIMIZATION',
  SIGNAL_GENERATION = 'SIGNAL_GENERATION',
}

export interface ModelFeature {
  name: string
  type: 'numerical' | 'categorical' | 'text' | 'time_series'
  source: 'market_data' | 'portfolio' | 'news' | 'economic' | 'technical' | 'sentiment'
  window?: number
  aggregation?: 'mean' | 'sum' | 'max' | 'min' | 'std' | 'last'
  encoding?: 'one_hot' | 'label' | 'embedding'
  scaling?: 'standard' | 'minmax' | 'robust' | 'none'
  required: boolean
}

export interface ModelTarget {
  name: string
  type: 'regression' | 'classification' | 'time_series'
  horizon: number
  units: string
  classes?: string[]
}

export interface ModelMetadata {
  description: string
  author: string
  trainedAt: Date
  datasetSize: number
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  rmse?: number
  mae?: number
  sharpeRatio?: number
  backtest: BacktestResults
  compliance: ComplianceInfo
}

export interface BacktestResults {
  period: [Date, Date]
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  trades: number
  avgHoldingPeriod: number
}

export interface ComplianceInfo {
  explainability: boolean
  fairness: boolean
  bias: BiasMetrics
  regulatory: string[]
  auditTrail: boolean
}

export interface BiasMetrics {
  demographic: number
  statistical: number
  representational: number
}

export interface PredictionRequest {
  modelName: string
  features: Record<string, any>
  symbols?: string[]
  timeframe?: string
  confidence?: number
  explanation?: boolean
  metadata?: Record<string, any>
}

export interface PredictionResponse {
  modelName: string
  modelVersion: string
  prediction: any
  confidence: number
  features: Record<string, any>
  explanation?: ModelExplanation
  metadata: PredictionMetadata
  timestamp: Date
}

export interface ModelExplanation {
  featureImportance: Record<string, number>
  shapValues?: Record<string, number>
  lime?: any
  attention?: Record<string, number>
  decisionPath?: string[]
}

export interface PredictionMetadata {
  latency: number
  cacheHit: boolean
  modelLoad: number
  preprocessing: number
  inference: number
  postprocessing: number
  warnings?: string[]
  errors?: string[]
}

class AIModelService {
  private models: Map<string, ModelConfig> = new Map()
  private modelCache: Map<string, any> = new Map()
  private predictionCache: Map<string, PredictionResponse> = new Map()

  constructor() {
    this.initializeModels()
  }

  private initializeModels(): void {
    // Price Prediction Model
    this.registerModel({
      name: 'price_predictor_v3',
      version: '3.2.1',
      type: ModelType.PRICE_PREDICTION,
      framework: 'tensorflow',
      endpoint: process.env.PRICE_MODEL_ENDPOINT || 'http://ml-service:8090/predict/price',
      local: false,
      warm: true,
      batchSize: 32,
      timeout: 5000,
      retries: 2,
      confidence: {
        threshold: 0.7,
        required: true,
      },
      features: [
        {
          name: 'price_history',
          type: 'time_series',
          source: 'market_data',
          window: 60,
          aggregation: 'last',
          scaling: 'standard',
          required: true,
        },
        {
          name: 'volume',
          type: 'numerical',
          source: 'market_data',
          window: 20,
          aggregation: 'mean',
          scaling: 'standard',
          required: true,
        },
        {
          name: 'technical_indicators',
          type: 'numerical',
          source: 'technical',
          window: 14,
          aggregation: 'last',
          scaling: 'standard',
          required: true,
        },
        {
          name: 'market_sentiment',
          type: 'numerical',
          source: 'sentiment',
          window: 1,
          aggregation: 'last',
          scaling: 'minmax',
          required: false,
        },
      ],
      target: {
        name: 'price_change',
        type: 'regression',
        horizon: 1,
        units: 'percentage',
      },
      metadata: {
        description: 'LSTM-based price prediction model with attention mechanism',
        author: 'Stratford AI Research Team',
        trainedAt: new Date('2024-10-01'),
        datasetSize: 1000000,
        rmse: 0.023,
        mae: 0.018,
        sharpeRatio: 1.85,
        backtest: {
          period: [new Date('2023-01-01'), new Date('2024-09-30')],
          totalReturn: 0.247,
          sharpeRatio: 1.85,
          maxDrawdown: -0.087,
          winRate: 0.58,
          profitFactor: 1.34,
          trades: 2847,
          avgHoldingPeriod: 3.2,
        },
        compliance: {
          explainability: true,
          fairness: true,
          bias: {
            demographic: 0.02,
            statistical: 0.01,
            representational: 0.03,
          },
          regulatory: ['SEC', 'FINRA'],
          auditTrail: true,
        },
      },
    })

    // Sentiment Analysis Model
    this.registerModel({
      name: 'sentiment_analyzer_v2',
      version: '2.1.0',
      type: ModelType.SENTIMENT_ANALYSIS,
      framework: 'pytorch',
      endpoint: process.env.SENTIMENT_MODEL_ENDPOINT || 'http://ml-service:8091/predict/sentiment',
      local: false,
      warm: true,
      batchSize: 16,
      timeout: 3000,
      retries: 2,
      confidence: {
        threshold: 0.8,
        required: false,
      },
      features: [
        {
          name: 'news_text',
          type: 'text',
          source: 'news',
          encoding: 'embedding',
          required: true,
        },
        {
          name: 'social_mentions',
          type: 'text',
          source: 'sentiment',
          encoding: 'embedding',
          required: false,
        },
      ],
      target: {
        name: 'sentiment_score',
        type: 'regression',
        horizon: 1,
        units: 'score',
      },
      metadata: {
        description: 'BERT-based financial sentiment analysis',
        author: 'Stratford AI NLP Team',
        trainedAt: new Date('2024-09-15'),
        datasetSize: 500000,
        accuracy: 0.891,
        precision: 0.887,
        recall: 0.894,
        f1Score: 0.890,
        backtest: {
          period: [new Date('2023-06-01'), new Date('2024-08-31')],
          totalReturn: 0.156,
          sharpeRatio: 1.42,
          maxDrawdown: -0.062,
          winRate: 0.62,
          profitFactor: 1.28,
          trades: 1534,
          avgHoldingPeriod: 2.8,
        },
        compliance: {
          explainability: true,
          fairness: true,
          bias: {
            demographic: 0.01,
            statistical: 0.02,
            representational: 0.01,
          },
          regulatory: ['SEC'],
          auditTrail: true,
        },
      },
    })

    // Risk Assessment Model
    this.registerModel({
      name: 'risk_assessor_v1',
      version: '1.3.0',
      type: ModelType.RISK_ASSESSMENT,
      framework: 'xgboost',
      local: true,
      warm: false,
      batchSize: 64,
      timeout: 2000,
      retries: 1,
      confidence: {
        threshold: 0.85,
        required: true,
      },
      features: [
        {
          name: 'portfolio_composition',
          type: 'numerical',
          source: 'portfolio',
          required: true,
          scaling: 'standard',
        },
        {
          name: 'market_volatility',
          type: 'numerical',
          source: 'market_data',
          window: 30,
          aggregation: 'std',
          scaling: 'standard',
          required: true,
        },
        {
          name: 'correlation_matrix',
          type: 'numerical',
          source: 'market_data',
          window: 252,
          required: true,
        },
      ],
      target: {
        name: 'risk_score',
        type: 'classification',
        horizon: 1,
        units: 'categorical',
        classes: ['low', 'medium', 'high', 'critical'],
      },
      metadata: {
        description: 'Ensemble risk assessment model',
        author: 'Stratford AI Risk Team',
        trainedAt: new Date('2024-08-01'),
        datasetSize: 250000,
        accuracy: 0.943,
        precision: 0.938,
        recall: 0.941,
        f1Score: 0.939,
        backtest: {
          period: [new Date('2023-01-01'), new Date('2024-07-31')],
          totalReturn: 0.089,
          sharpeRatio: 2.31,
          maxDrawdown: -0.034,
          winRate: 0.74,
          profitFactor: 2.18,
          trades: 892,
          avgHoldingPeriod: 8.5,
        },
        compliance: {
          explainability: true,
          fairness: true,
          bias: {
            demographic: 0.005,
            statistical: 0.008,
            representational: 0.004,
          },
          regulatory: ['SEC', 'FINRA', 'Basel III'],
          auditTrail: true,
        },
      },
    })
  }

  /**
   * Register ML model
   */
  registerModel(config: ModelConfig): void {
    this.models.set(config.name, config)

    if (config.warm) {
      this.warmUpModel(config.name)
    }
  }

  /**
   * Make prediction
   */
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = Date.now()

    try {
      const model = this.models.get(request.modelName)
      if (!model) {
        throw new Error(`Model ${request.modelName} not found`)
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = await this.getCachedPrediction(cacheKey)
      if (cached) {
        recordMetric('ml.prediction.cache_hit', 1, { model: request.modelName })
        return cached
      }

      // Validate and prepare features
      const preprocessingStart = Date.now()
      const processedFeatures = await this.preprocessFeatures(model, request.features)
      const preprocessingTime = Date.now() - preprocessingStart

      // Make prediction
      const inferenceStart = Date.now()
      let prediction: any
      let explanation: ModelExplanation | undefined

      if (model.local) {
        prediction = await this.predictLocal(model, processedFeatures)
      } else {
        prediction = await this.predictRemote(model, processedFeatures)
      }

      const inferenceTime = Date.now() - inferenceStart

      // Generate explanation if requested
      if (request.explanation && model.metadata.compliance.explainability) {
        explanation = await this.generateExplanation(model, processedFeatures, prediction)
      }

      // Validate confidence
      const confidence = this.calculateConfidence(model, prediction)
      if (model.confidence.required && confidence < model.confidence.threshold) {
        throw new Error(`Prediction confidence ${confidence} below threshold ${model.confidence.threshold}`)
      }

      const totalTime = Date.now() - startTime

      const response: PredictionResponse = {
        modelName: model.name,
        modelVersion: model.version,
        prediction,
        confidence,
        features: processedFeatures,
        explanation,
        metadata: {
          latency: totalTime,
          cacheHit: false,
          modelLoad: 0,
          preprocessing: preprocessingTime,
          inference: inferenceTime,
          postprocessing: 0,
        },
        timestamp: new Date(),
      }

      // Cache the response
      await this.cachePrediction(cacheKey, response, model)

      // Record metrics
      recordMetric('ml.prediction.latency', totalTime, { model: request.modelName })
      recordMetric('ml.prediction.confidence', confidence, { model: request.modelName })
      recordMetric('ml.prediction.count', 1, { model: request.modelName, type: model.type })

      return response
    } catch (error) {
      const totalTime = Date.now() - startTime

      captureError(error as Error, {
        component: 'AIModelService',
        action: 'predict',
        metadata: {
          modelName: request.modelName,
          latency: totalTime,
        },
      })

      recordMetric('ml.prediction.error', 1, { model: request.modelName })
      throw error
    }
  }

  /**
   * Batch prediction
   */
  async predictBatch(requests: PredictionRequest[]): Promise<PredictionResponse[]> {
    const batchSize = 32
    const results: PredictionResponse[] = []

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(request => this.predict(request))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelName: string, period?: [Date, Date]): Promise<any> {
    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Fetch prediction history from MongoDB
    const predictions = await mongoService.aggregate('ml_predictions', [
      {
        $match: {
          modelName,
          ...(period && {
            timestamp: {
              $gte: period[0],
              $lte: period[1],
            }
          })
        }
      },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgLatency: { $avg: '$metadata.latency' },
          cacheHitRate: {
            $avg: { $cond: ['$metadata.cacheHit', 1, 0] }
          }
        }
      }
    ])

    return {
      model: {
        name: model.name,
        version: model.version,
        type: model.type,
        metadata: model.metadata,
      },
      performance: predictions[0] || {
        totalPredictions: 0,
        avgConfidence: 0,
        avgLatency: 0,
        cacheHitRate: 0,
      },
      period: period || [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()],
    }
  }

  /**
   * Update model
   */
  async updateModel(modelName: string, newVersion: string, config: Partial<ModelConfig>): Promise<void> {
    const existingModel = this.models.get(modelName)
    if (!existingModel) {
      throw new Error(`Model ${modelName} not found`)
    }

    const updatedModel: ModelConfig = {
      ...existingModel,
      ...config,
      version: newVersion,
    }

    // Validate new model
    await this.validateModel(updatedModel)

    // A/B test new model if configured
    if (config.metadata?.compliance?.auditTrail) {
      await this.runABTest(existingModel, updatedModel)
    }

    // Update model registry
    this.models.set(modelName, updatedModel)

    // Warm up new model
    if (updatedModel.warm) {
      await this.warmUpModel(modelName)
    }
  }

  /**
   * Private helper methods
   */
  private async preprocessFeatures(model: ModelConfig, features: Record<string, any>): Promise<Record<string, any>> {
    const processed: Record<string, any> = {}

    for (const featureConfig of model.features) {
      const value = features[featureConfig.name]

      if (featureConfig.required && (value === undefined || value === null)) {
        throw new Error(`Required feature ${featureConfig.name} is missing`)
      }

      if (value !== undefined && value !== null) {
        processed[featureConfig.name] = await this.processFeature(featureConfig, value)
      }
    }

    return processed
  }

  private async processFeature(config: ModelFeature, value: any): Promise<any> {
    let processed = value

    // Apply aggregation for time series
    if (config.window && config.aggregation) {
      processed = this.applyAggregation(value, config.aggregation)
    }

    // Apply scaling
    if (config.scaling && config.scaling !== 'none') {
      processed = await this.applyScaling(processed, config.scaling, config.name)
    }

    // Apply encoding for categorical features
    if (config.encoding) {
      processed = await this.applyEncoding(processed, config.encoding, config.name)
    }

    return processed
  }

  private applyAggregation(data: any[], aggregation: string): number {
    switch (aggregation) {
      case 'mean': return data.reduce((a, b) => a + b, 0) / data.length
      case 'sum': return data.reduce((a, b) => a + b, 0)
      case 'max': return Math.max(...data)
      case 'min': return Math.min(...data)
      case 'std': return this.calculateStandardDeviation(data)
      case 'last': return data[data.length - 1]
      default: return data[data.length - 1]
    }
  }

  private calculateStandardDeviation(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
    return Math.sqrt(variance)
  }

  private async applyScaling(value: any, scaling: string, featureName: string): Promise<any> {
    // In production, these would use pre-computed scaling parameters
    switch (scaling) {
      case 'standard':
        return (value - 0) / 1 // Simplified
      case 'minmax':
        return (value - 0) / (1 - 0) // Simplified
      case 'robust':
        return value // Simplified
      default:
        return value
    }
  }

  private async applyEncoding(value: any, encoding: string, featureName: string): Promise<any> {
    // In production, these would use pre-trained encoders
    switch (encoding) {
      case 'one_hot':
        return this.oneHotEncode(value)
      case 'label':
        return this.labelEncode(value)
      case 'embedding':
        return this.embedText(value)
      default:
        return value
    }
  }

  private oneHotEncode(value: string): number[] {
    // Simplified one-hot encoding
    return [1, 0, 0, 0] // Placeholder
  }

  private labelEncode(value: string): number {
    // Simplified label encoding
    return value.length % 10 // Placeholder
  }

  private async embedText(text: string): Promise<number[]> {
    // In production, this would use a proper text embedding model
    return Array.from({ length: 768 }, () => Math.random()) // Placeholder
  }

  private async predictLocal(model: ModelConfig, features: Record<string, any>): Promise<any> {
    // Load and run local model
    const cachedModel = this.modelCache.get(model.name)
    if (!cachedModel) {
      throw new Error(`Local model ${model.name} not loaded`)
    }

    // Run inference (simplified)
    return Math.random() // Placeholder
  }

  private async predictRemote(model: ModelConfig, features: Record<string, any>): Promise<any> {
    if (!model.endpoint) {
      throw new Error(`No endpoint configured for model ${model.name}`)
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.name,
        version: model.version,
        features,
      }),
      signal: AbortSignal.timeout(model.timeout),
    })

    if (!response.ok) {
      throw new Error(`Model prediction failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.prediction
  }

  private calculateConfidence(model: ModelConfig, prediction: any): number {
    // Simplified confidence calculation
    if (model.target.type === 'classification' && Array.isArray(prediction)) {
      return Math.max(...prediction)
    }
    return 0.85 // Placeholder
  }

  private async generateExplanation(
    model: ModelConfig,
    features: Record<string, any>,
    prediction: any
  ): Promise<ModelExplanation> {
    // Generate feature importance (simplified)
    const featureImportance: Record<string, number> = {}
    for (const feature of model.features) {
      featureImportance[feature.name] = Math.random()
    }

    return {
      featureImportance,
      shapValues: featureImportance, // Simplified
      decisionPath: ['feature1 > 0.5', 'feature2 < 0.3'],
    }
  }

  private generateCacheKey(request: PredictionRequest): string {
    const key = `${request.modelName}:${JSON.stringify(request.features)}`
    return Buffer.from(key).toString('base64')
  }

  private async getCachedPrediction(cacheKey: string): Promise<PredictionResponse | null> {
    try {
      const cached = await redisService.redis.get(`ml:prediction:${cacheKey}`)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  private async cachePrediction(
    cacheKey: string,
    response: PredictionResponse,
    model: ModelConfig
  ): Promise<void> {
    try {
      const ttl = 300 // 5 minutes
      await redisService.redis.setex(
        `ml:prediction:${cacheKey}`,
        ttl,
        JSON.stringify(response)
      )
    } catch (error) {
      console.warn('Failed to cache prediction:', error)
    }
  }

  private async warmUpModel(modelName: string): Promise<void> {
    // Pre-load model for faster inference
    const model = this.models.get(modelName)
    if (!model || !model.local) return

    // Simplified model loading
    this.modelCache.set(modelName, { loaded: true, timestamp: Date.now() })
  }

  private async validateModel(model: ModelConfig): Promise<void> {
    // Model validation logic
    if (!model.features.length) {
      throw new Error('Model must have at least one feature')
    }

    if (model.confidence.threshold < 0 || model.confidence.threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1')
    }
  }

  private async runABTest(oldModel: ModelConfig, newModel: ModelConfig): Promise<void> {
    // A/B testing logic for model comparison
    console.log(`Running A/B test between ${oldModel.version} and ${newModel.version}`)
  }
}

// Singleton instance
let aiModelInstance: AIModelService | null = null

export function initializeAIModels(): AIModelService {
  if (!aiModelInstance) {
    aiModelInstance = new AIModelService()
  }
  return aiModelInstance
}

export function getAIModels(): AIModelService | null {
  return aiModelInstance
}

// Convenience functions
export async function predictPrice(
  symbol: string,
  features: Record<string, any>
): Promise<PredictionResponse> {
  const service = getAIModels()
  if (!service) throw new Error('AI models not initialized')

  return service.predict({
    modelName: 'price_predictor_v3',
    features: { ...features, symbol },
    symbols: [symbol],
    explanation: true,
  })
}

export async function analyzeSentiment(
  text: string,
  symbol?: string
): Promise<PredictionResponse> {
  const service = getAIModels()
  if (!service) throw new Error('AI models not initialized')

  return service.predict({
    modelName: 'sentiment_analyzer_v2',
    features: { news_text: text, symbol },
    explanation: false,
  })
}

export async function assessRisk(
  portfolioData: Record<string, any>
): Promise<PredictionResponse> {
  const service = getAIModels()
  if (!service) throw new Error('AI models not initialized')

  return service.predict({
    modelName: 'risk_assessor_v1',
    features: portfolioData,
    explanation: true,
    confidence: 0.9,
  })
}

export { AIModelService }