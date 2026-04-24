import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  }

  async makeRequest(messages, options = {}) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Product Photo Enhancer'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: 10000,
          ...options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenRouter API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw error;
    }
  }

  // Background Removal Analysis
  async analyzeForBackgroundRemoval(imageDescription) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI image analysis expert specializing in product photography.
        Analyze images and provide detailed recommendations for background removal.
        Always respond in JSON format with the following structure:
        {
          "analysis": {
            "subject": "description of main subject",
            "background": "description of current background",
            "edges": "description of edge complexity",
            "challenges": ["list of removal challenges"]
          },
          "recommendations": {
            "method": "recommended removal method",
            "difficulty": "easy/medium/hard",
            "estimatedQuality": "percentage",
            "tips": ["list of tips for best results"]
          },
          "suggestedBackgrounds": ["list of 5 suggested new backgrounds"],
          "colorPalette": ["extracted colors from subject"]
        }`
      },
      {
        role: 'user',
        content: `Analyze this product image for background removal: ${imageDescription}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Image Enhancement Suggestions
  async analyzeForEnhancement(imageDescription, enhancementType) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI expert in product photo enhancement.
        Provide detailed enhancement recommendations.
        Always respond in JSON format with the following structure:
        {
          "currentAssessment": {
            "brightness": "assessment",
            "contrast": "assessment",
            "saturation": "assessment",
            "sharpness": "assessment",
            "overallQuality": "percentage"
          },
          "enhancements": {
            "brightness": { "adjustment": "value", "reason": "explanation" },
            "contrast": { "adjustment": "value", "reason": "explanation" },
            "saturation": { "adjustment": "value", "reason": "explanation" },
            "sharpness": { "adjustment": "value", "reason": "explanation" },
            "additionalFilters": ["list of recommended filters"]
          },
          "professionalTips": ["list of professional photography tips"],
          "expectedImprovement": "percentage improvement expected"
        }`
      },
      {
        role: 'user',
        content: `Analyze this product image for ${enhancementType} enhancement: ${imageDescription}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Lifestyle Shot Generation
  async generateLifestyleConcepts(productDescription, targetAudience, style) {
    const messages = [
      {
        role: 'system',
        content: `You are a creative director specializing in product lifestyle photography.
        Generate creative lifestyle shot concepts for products.
        Always respond in JSON format with the following structure:
        {
          "concepts": [
            {
              "title": "concept name",
              "description": "detailed scene description",
              "setting": "location/environment",
              "mood": "emotional tone",
              "lighting": "lighting setup",
              "props": ["list of props"],
              "colorScheme": ["colors"],
              "cameraAngle": "suggested angle",
              "targetEmotion": "what viewers should feel"
            }
          ],
          "styleGuide": {
            "overallAesthetic": "description",
            "brandAlignment": "how it aligns with brand",
            "marketingPotential": "platforms and uses"
          },
          "productionNotes": {
            "difficulty": "easy/medium/hard",
            "estimatedCost": "budget range",
            "requiredEquipment": ["list of equipment"]
          }
        }`
      },
      {
        role: 'user',
        content: `Generate 5 lifestyle shot concepts for this product: ${productDescription}.
        Target audience: ${targetAudience}.
        Preferred style: ${style}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Product Description Generation
  async generateProductDescription(imageDescription, category) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert e-commerce copywriter.
        Generate compelling product descriptions.
        Always respond in JSON format with the following structure:
        {
          "shortDescription": "brief 1-2 sentence description",
          "longDescription": "detailed 3-4 paragraph description",
          "keyFeatures": ["list of 5-7 key features"],
          "benefits": ["list of customer benefits"],
          "specifications": {
            "estimated": ["list of likely specifications"]
          },
          "seoKeywords": ["list of SEO keywords"],
          "marketingCopy": {
            "headline": "attention-grabbing headline",
            "tagline": "memorable tagline",
            "callToAction": "compelling CTA"
          },
          "socialMediaCaptions": {
            "instagram": "Instagram caption with hashtags",
            "facebook": "Facebook post",
            "twitter": "Tweet under 280 chars"
          }
        }`
      },
      {
        role: 'user',
        content: `Generate product description for: ${imageDescription}. Category: ${category}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Color Analysis
  async analyzeColors(imageDescription) {
    const messages = [
      {
        role: 'system',
        content: `You are a color theory expert for product photography.
        Analyze colors and provide recommendations.
        Always respond in JSON format with the following structure:
        {
          "dominantColors": [
            { "name": "color name", "hex": "#hexcode", "percentage": "%" }
          ],
          "colorHarmony": {
            "type": "harmony type",
            "explanation": "why these colors work"
          },
          "complementaryColors": ["list of complementary colors with hex"],
          "backgroundRecommendations": [
            { "color": "color name", "hex": "#hexcode", "reason": "why it works" }
          ],
          "seasonalAppropriate": {
            "spring": "suitability",
            "summer": "suitability",
            "fall": "suitability",
            "winter": "suitability"
          },
          "emotionalImpact": {
            "primaryEmotion": "emotion",
            "secondaryEmotions": ["list"],
            "targetDemographic": "who responds best"
          }
        }`
      },
      {
        role: 'user',
        content: `Analyze the colors in this product image: ${imageDescription}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Quality Assessment
  async assessImageQuality(imageDescription) {
    const messages = [
      {
        role: 'system',
        content: `You are a professional product photography quality assessor.
        Evaluate image quality for e-commerce use.
        Always respond in JSON format with the following structure:
        {
          "overallScore": 85,
          "scores": {
            "composition": { "score": 90, "feedback": "explanation" },
            "lighting": { "score": 85, "feedback": "explanation" },
            "focus": { "score": 88, "feedback": "explanation" },
            "background": { "score": 80, "feedback": "explanation" },
            "productVisibility": { "score": 92, "feedback": "explanation" },
            "colorAccuracy": { "score": 87, "feedback": "explanation" }
          },
          "ecommerceReadiness": {
            "amazon": { "ready": true, "issues": [] },
            "ebay": { "ready": true, "issues": [] },
            "shopify": { "ready": true, "issues": [] },
            "instagram": { "ready": true, "issues": [] }
          },
          "improvements": [
            { "priority": "high/medium/low", "suggestion": "what to improve", "impact": "expected improvement" }
          ],
          "professionalAssessment": "overall professional opinion"
        }`
      },
      {
        role: 'user',
        content: `Assess the quality of this product image: ${imageDescription}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Size Reference Analysis (NEW)
  async analyzeSizeReference(productDescription, referenceObject) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert in product dimension visualization and size reference photography.
        Analyze products and suggest optimal size references.
        Always respond in JSON format with the following structure:
        {
          "productDimensions": {
            "estimatedWidth": "measurement",
            "estimatedHeight": "measurement",
            "estimatedDepth": "measurement",
            "confidence": "percentage"
          },
          "referenceObjects": [
            {
              "object": "reference item name",
              "reason": "why this works",
              "placement": "where to place it",
              "effectiveness": "high/medium/low"
            }
          ],
          "scaleSuggestions": {
            "primaryReference": "best reference object",
            "alternativeReferences": ["list of alternatives"],
            "avoidObjects": ["objects that would confuse scale"]
          },
          "photographyTips": {
            "angle": "best angle for size reference",
            "distance": "optimal distance",
            "lighting": "lighting recommendation",
            "background": "background suggestion"
          },
          "commonMistakes": ["list of mistakes to avoid"],
          "industryStandards": {
            "category": "product category",
            "standardReferences": ["industry standard references"]
          }
        }`
      },
      {
        role: 'user',
        content: `Analyze size reference needs for this product: ${productDescription}. Reference object being considered: ${referenceObject || 'none specified'}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // 360 View Analysis (NEW)
  async analyze360View(productDescription, frameCount) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert in 360-degree product photography and interactive viewing experiences.
        Provide guidance for creating optimal 360 view content.
        Always respond in JSON format with the following structure:
        {
          "shootingPlan": {
            "totalFrames": "recommended frame count",
            "degreesPerFrame": "rotation per frame",
            "cameraHeight": "optimal height",
            "turntableSpeed": "recommended speed"
          },
          "keyAngles": [
            {
              "angle": "degree position",
              "importance": "why this angle matters",
              "features": ["features visible at this angle"]
            }
          ],
          "technicalRequirements": {
            "lighting": "lighting setup for consistent 360",
            "background": "background recommendation",
            "equipment": ["required equipment"],
            "resolution": "recommended resolution"
          },
          "postProcessing": {
            "alignment": "alignment tips",
            "colorConsistency": "color matching advice",
            "smoothness": "frame transition tips"
          },
          "interactivityFeatures": {
            "hotspots": ["suggested interactive hotspots"],
            "zoomAreas": ["areas worth highlighting"],
            "annotations": ["suggested text annotations"]
          },
          "platformOptimization": {
            "web": { "format": "format", "size": "file size target" },
            "mobile": { "format": "format", "size": "file size target" },
            "ar": { "compatible": true, "notes": "AR compatibility notes" }
          }
        }`
      },
      {
        role: 'user',
        content: `Create a 360 view shooting plan for: ${productDescription}. Desired frame count: ${frameCount || 36}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Size Recommender (NEW)
  async recommendSize(productDescription, customerMeasurements, productCategory) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert e-commerce size recommendation AI.
        Analyze customer measurements and product specifications to recommend the best fit.
        Always respond in JSON format with the following structure:
        {
          "recommendedSize": "size (S/M/L/XL or numeric)",
          "confidenceScore": 85,
          "fitAnalysis": {
            "primaryFit": "how the recommended size will fit",
            "alternativeSize": "backup recommendation",
            "fitType": "regular/slim/relaxed"
          },
          "measurementComparison": {
            "chest": { "customer": "value", "product": "value", "difference": "value", "fit": "assessment" },
            "waist": { "customer": "value", "product": "value", "difference": "value", "fit": "assessment" },
            "hips": { "customer": "value", "product": "value", "difference": "value", "fit": "assessment" },
            "length": { "customer": "value", "product": "value", "difference": "value", "fit": "assessment" }
          },
          "sizeChart": [
            { "size": "S", "chest": "range", "waist": "range", "recommended": false },
            { "size": "M", "chest": "range", "waist": "range", "recommended": true },
            { "size": "L", "chest": "range", "waist": "range", "recommended": false }
          ],
          "customerInsights": {
            "bodyType": "identified body type",
            "preferencePattern": "sizing preference pattern",
            "suggestions": ["personalized suggestions"]
          },
          "returnRisk": {
            "probability": "percentage",
            "commonIssues": ["potential fit issues"],
            "mitigations": ["how to reduce return risk"]
          }
        }`
      },
      {
        role: 'user',
        content: `Recommend size for product: ${productDescription}. Category: ${productCategory}. Customer measurements: ${JSON.stringify(customerMeasurements)}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Gift Suggester (NEW)
  async suggestGift(productDescription, recipientProfile, occasion, budgetRange) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert gift recommendation AI for e-commerce.
        Analyze products and recipient profiles to determine gift suitability.
        Always respond in JSON format with the following structure:
        {
          "matchScore": 85,
          "suitabilityAnalysis": {
            "overallMatch": "how well this product matches the recipient",
            "strengthPoints": ["why this is a good gift"],
            "potentialConcerns": ["potential issues"]
          },
          "recipientInsights": {
            "likelyInterests": ["inferred interests"],
            "personalityMatch": "personality compatibility",
            "ageAppropriate": true,
            "genderNeutral": false
          },
          "occasionFit": {
            "appropriate": true,
            "formalityLevel": "casual/formal/versatile",
            "seasonality": "seasonal relevance",
            "traditionality": "how traditional this gift is"
          },
          "giftPresentation": {
            "wrappingSuggestions": ["wrapping ideas"],
            "pairings": ["complementary items to add"],
            "personalizations": ["personalization options"]
          },
          "alternativeProducts": [
            {
              "category": "product category",
              "reason": "why consider this alternative",
              "priceRange": "estimated price"
            }
          ],
          "giftMessage": {
            "suggested": "suggested gift message",
            "tone": "message tone"
          }
        }`
      },
      {
        role: 'user',
        content: `Analyze gift suitability for: ${productDescription}. Recipient: ${JSON.stringify(recipientProfile)}. Occasion: ${occasion}. Budget: ${budgetRange}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Return Predictor (NEW)
  async predictReturn(productDescription, customerHistory, productCategory) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert e-commerce return prediction AI.
        Analyze products and customer behavior to predict return likelihood.
        Always respond in JSON format with the following structure:
        {
          "returnProbability": 25,
          "riskLevel": "low/medium/high",
          "riskFactors": [
            {
              "factor": "risk factor name",
              "impact": "high/medium/low",
              "description": "explanation",
              "mitigation": "how to reduce this risk"
            }
          ],
          "customerAnalysis": {
            "returnHistory": "analysis of return patterns",
            "satisfactionIndicators": ["positive indicators"],
            "concernIndicators": ["concerning patterns"]
          },
          "productRiskProfile": {
            "categoryReturnRate": "typical return rate for category",
            "commonReturnReasons": ["frequent return reasons"],
            "fitRisk": "sizing/fit risk level",
            "qualityRisk": "quality perception risk"
          },
          "preventionStrategies": [
            {
              "strategy": "strategy name",
              "implementation": "how to implement",
              "expectedImpact": "expected reduction in returns"
            }
          ],
          "customerCommunication": {
            "preDelivery": ["messages to send before delivery"],
            "postDelivery": ["follow-up messages"],
            "ifDissatisfied": ["retention strategies"]
          },
          "financialImpact": {
            "estimatedReturnCost": "cost if returned",
            "preventionROI": "return on prevention investment"
          }
        }`
      },
      {
        role: 'user',
        content: `Predict return likelihood for: ${productDescription}. Category: ${productCategory}. Customer history: ${JSON.stringify(customerHistory)}`
      }
    ];

    const response = await this.makeRequest(messages);
    return this.parseAIResponse(response);
  }

  // Attempt to repair truncated JSON by closing unclosed braces/brackets
  repairJSON(jsonStr) {
    // Remove trailing comma if present
    let str = jsonStr.replace(/,\s*$/, '');
    // Remove incomplete key-value pairs at the end (e.g. "key": or "key": {)
    str = str.replace(/,\s*"[^"]*"\s*:\s*\{?\s*$/, '');
    str = str.replace(/,\s*"[^"]*"\s*:\s*\[?\s*$/, '');
    str = str.replace(/,\s*"[^"]*"\s*:\s*$/, '');
    // Count unclosed braces and brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;
    for (const ch of str) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
    }
    // Close unclosed brackets and braces
    for (let i = 0; i < openBrackets; i++) str += ']';
    for (let i = 0; i < openBraces; i++) str += '}';
    return str;
  }

  parseAIResponse(response) {
    try {
      const content = response.choices[0]?.message?.content || '';

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // JSON might be truncated - try to repair it
          const repaired = this.repairJSON(jsonMatch[0]);
          parsed = JSON.parse(repaired);
        }
        return {
          success: true,
          data: parsed,
          rawResponse: content,
          model: response.model,
          usage: response.usage
        };
      }

      // No JSON found - try to repair the whole content
      const braceStart = content.indexOf('{');
      if (braceStart !== -1) {
        const partial = content.substring(braceStart);
        const repaired = this.repairJSON(partial);
        try {
          const parsed = JSON.parse(repaired);
          return {
            success: true,
            data: parsed,
            rawResponse: content,
            model: response.model,
            usage: response.usage
          };
        } catch (e) {
          // Fall through
        }
      }

      return {
        success: true,
        data: { text: content },
        rawResponse: content,
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse AI response',
        rawResponse: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage
      };
    }
  }
}

export default new OpenRouterService();
