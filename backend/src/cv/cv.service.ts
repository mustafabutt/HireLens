import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { CvEntity } from './entities/cv.entity';
import { CvMetadataDto } from './dto/cv.dto';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);
  private openai: OpenAI;
  private pinecone: Pinecone;
  private pineconeIndex: any;

  constructor(private configService: ConfigService) {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    // Initialize Pinecone client
    this.pinecone = new Pinecone({
      apiKey: this.configService.get<string>('PINECONE_API_KEY')!,
    });

    // Get Pinecone index for CV storage
    const indexName = this.configService.get<string>('PINECONE_INDEX_NAME')!;
    this.pineconeIndex = this.pinecone.index(indexName);
  }

  /**
   * Process a newly uploaded CV file
   * This method handles the complete pipeline: text extraction, metadata parsing, and vector indexing
   */
  async processCv(filePath: string, filename: string): Promise<CvEntity> {
    try {
      this.logger.log(`Processing CV: ${filename}`);

      // Create unique ID for the CV
      const cvId = uuidv4();
      
      // Normalize file path to absolute for reliable access later
      const normalizedFilePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      // Extract text from PDF
      const fullText = await this.extractTextFromPdf(normalizedFilePath);
      
      // Parse metadata using AI
      const metadata = await this.parseMetadataWithAI(fullText);
      
      // Generate vector embedding
      const embedding = await this.generateEmbedding(fullText);
      
      // Log total estimated cost for this CV
      const totalCost = this.estimateTotalCvProcessingCost(fullText.length);
      this.logger.log(`Total estimated OpenAI cost for CV processing: $${totalCost.toFixed(6)}`);
      
      // Create CV entity
      const cvEntity: CvEntity = {
        id: cvId,
        filename,
        filePath: normalizedFilePath,
        fullText,
        metadata,
        embedding,
        uploadDate: new Date(),
        updatedDate: new Date(),
        fileSize: fs.statSync(normalizedFilePath).size,
        status: 'indexed',
      };

      // Store in Pinecone vector database
      await this.storeInPinecone(cvEntity);

      // Persist mapping of cvId -> file path for reliable downloads
      await this.saveFileMapping(cvEntity.id, cvEntity.filePath);

      this.logger.log(`Successfully processed CV: ${filename}`);
      return cvEntity;

    } catch (error) {
      this.logger.error(`Error processing CV ${filename}:`, error);
      throw new BadRequestException(`Failed to process CV: ${error.message}`);
    }
  }

  /**
   * Extract raw text content from a PDF file
   */
  private async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      // Import pdf-parse dynamically to avoid issues
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      this.logger.error(`Error extracting text from PDF at ${filePath}:`, error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Use OpenAI to parse CV metadata from extracted text
   */
  private async parseMetadataWithAI(text: string): Promise<CvMetadataDto> {
    try {
      const prompt = `
        Extract the following details from the CV if available:
        - Full name
        - Email
        - Phone
        - Skills (list) - Look for programming languages, frameworks, tools, technologies mentioned
        - Years of experience (numeric if possible)
        - Education - Look for degrees, universities, certifications, academic background
        - Location - Look for cities, countries, or "based in" mentions
        
        Return the output as valid JSON with these exact field names. Only include fields that have actual values - omit fields that are not found or not applicable:
        {
          "fullName": "string",
          "email": "string", 
          "phone": "string",
          "skills": ["array of strings"],
          "yearsExperience": number,
          "education": "string",
          "location": "string"
        }
        
        Important: 
        - Do not include fields with null values. Only include fields that have actual content.
        - For skills: Extract ALL technical skills, programming languages, frameworks, tools mentioned
        - For education: Extract degree, university, major, graduation year if available
        - For location: Extract city, country, or "based in" location
        - Be thorough in extraction - don't miss important details
        
        CV Text:
        ${text.substring(0, 3000)} // Reduced limit for cost efficiency
      `;

      // Log cost estimation for monitoring
      const textLength = text.substring(0, 3000).length;
      const estimatedCost = this.estimateChatCompletionCost(textLength);
      this.logger.debug(`Parsing CV metadata for ${textLength} characters. Estimated cost: $${estimatedCost.toFixed(6)}`);

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional who extracts structured information from CVs. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 1000, // Limit response length for cost control
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const metadata = JSON.parse(responseText);
      
      // Clean up the metadata to ensure no null values are sent to Pinecone
      const cleanedMetadata: any = {};
      
      if (metadata.fullName && metadata.fullName !== null) cleanedMetadata.fullName = metadata.fullName;
      if (metadata.email && metadata.email !== null) cleanedMetadata.email = metadata.email;
      if (metadata.phone && metadata.phone !== null) cleanedMetadata.phone = metadata.phone;
      const cleanedSkills = this.ensureStringArray(metadata.skills);
      if (cleanedSkills) cleanedMetadata.skills = cleanedSkills;
      if (metadata.yearsExperience !== null && metadata.yearsExperience !== undefined && !isNaN(metadata.yearsExperience)) {
        cleanedMetadata.yearsExperience = Number(metadata.yearsExperience);
      }
      const eduString = this.formatEducationToString(metadata.education);
      if (eduString) cleanedMetadata.education = eduString;
      if (metadata.location && metadata.location !== null) cleanedMetadata.location = metadata.location;
      
      return cleanedMetadata;

    } catch (error) {
      this.logger.error('Error parsing metadata with AI:', error);
      // Return empty metadata if AI parsing fails
      return {
        fullName: undefined,
        email: undefined,
        phone: undefined,
        skills: undefined,
        yearsExperience: undefined,
        education: undefined,
        location: undefined,
      };
    }
  }

  /**
   * Estimate OpenAI API costs for monitoring
   */
  private estimateEmbeddingCost(textLength: number): number {
    // text-embedding-3-small: $0.00002 per 1K tokens
    // text-embedding-3-large: $0.00013 per 1K tokens
    // Rough estimation: 1 character ≈ 0.25 tokens
    const tokens = textLength * 0.25;
    const costPer1kTokens = 0.00002; // text-embedding-3-small
    return (tokens / 1000) * costPer1kTokens;
  }

  /**
   * Estimate OpenAI chat completion costs for monitoring
   */
  private estimateChatCompletionCost(textLength: number): number {
    // gpt-3.5-turbo: $0.0005 per 1K input tokens, $0.0015 per 1K output tokens
    // gpt-4: $0.03 per 1K input tokens, $0.06 per 1K output tokens
    // Rough estimation: 1 character ≈ 0.25 tokens
    const inputTokens = textLength * 0.25;
    const outputTokens = 1000; // max_tokens limit
    const costPer1kInputTokens = 0.0005; // gpt-3.5-turbo
    const costPer1kOutputTokens = 0.0015; // gpt-3.5-turbo
    return (inputTokens / 1000) * costPer1kInputTokens + (outputTokens / 1000) * costPer1kOutputTokens;
  }

  /**
   * Estimate total OpenAI costs for CV processing
   */
  private estimateTotalCvProcessingCost(textLength: number): number {
    const chatCompletionCost = this.estimateChatCompletionCost(textLength);
    const embeddingCost = this.estimateEmbeddingCost(textLength);
    return chatCompletionCost + embeddingCost;
  }

  /**
   * Generate vector embedding for CV text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Log cost estimation for monitoring
    const textLength = text.substring(0, 6000).length;
    const estimatedCost = this.estimateEmbeddingCost(textLength);
    this.logger.debug(`Generating embedding for ${textLength} characters. Estimated cost: $${estimatedCost.toFixed(6)}`);
    try {
      const response = await this.openai.embeddings.create({
        model: this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small',
        input: text.substring(0, 6000), // Reduced limit for cost efficiency
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Store CV data in Pinecone vector database
   */
  private async storeInPinecone(cvEntity: CvEntity): Promise<void> {
    try {
      // Filter out null values from metadata as Pinecone doesn't accept them
      const metadata: any = {
            filename: cvEntity.filename,
            fullText: cvEntity.fullText,
            uploadDate: cvEntity.uploadDate.toISOString(),
            fileSize: cvEntity.fileSize,
        storedFilePath: cvEntity.filePath,
        storedFilename: path.basename(cvEntity.filePath),
        cvId: cvEntity.id,
        // Normalized fields for stronger matching/filtering
        skillsNormalized: Array.isArray(cvEntity.metadata.skills)
          ? cvEntity.metadata.skills.map(s => this.normalizeSkill(s)).filter(Boolean)
          : undefined,
        locationNormalized: cvEntity.metadata.location ? this.normalizeLocation(cvEntity.metadata.location) : undefined,
      };

      // Only add non-null metadata fields
      if (cvEntity.metadata.fullName !== null && cvEntity.metadata.fullName !== undefined) {
        metadata.fullName = cvEntity.metadata.fullName;
      }
      if (cvEntity.metadata.email !== null && cvEntity.metadata.email !== undefined) {
        metadata.email = cvEntity.metadata.email;
      }
      if (cvEntity.metadata.phone !== null && cvEntity.metadata.phone !== undefined) {
        metadata.phone = cvEntity.metadata.phone;
      }
      if (cvEntity.metadata.skills !== null && cvEntity.metadata.skills !== undefined) {
        const cleanedSkills = this.ensureStringArray(cvEntity.metadata.skills);
        if (cleanedSkills) metadata.skills = cleanedSkills;
      }
      if (cvEntity.metadata.yearsExperience !== null && cvEntity.metadata.yearsExperience !== undefined) {
        metadata.yearsExperience = cvEntity.metadata.yearsExperience;
      }
      if (cvEntity.metadata.education !== null && cvEntity.metadata.education !== undefined) {
        const eduString = this.formatEducationToString(cvEntity.metadata.education);
        if (eduString) metadata.education = eduString;
      }
      if (cvEntity.metadata.location !== null && cvEntity.metadata.location !== undefined) {
        metadata.location = cvEntity.metadata.location;
      }

      await this.pineconeIndex.upsert([
        {
          id: cvEntity.id,
          values: cvEntity.embedding,
          metadata,
        },
      ]);

      this.logger.log(`Stored CV ${cvEntity.filename} in Pinecone`);
    } catch (error) {
      this.logger.error('Error storing in Pinecone:', error);
      throw new Error('Failed to store CV in vector database');
    }
  }

  /**
   * Search for CVs using vector similarity and metadata filters
   */
  async searchCvs(query: string, filters?: any): Promise<any[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Extract potential skills and locations from the query
      const extractedSkillIds = this.extractSkillsFromQuery(query);
      const extractedLocation = this.extractLocationFromQuery(query);
      const extractedLocationNormalized = extractedLocation ? this.normalizeLocation(extractedLocation) : null;
      const extractedEducation = this.extractEducationFromQuery(query);
      
      // Combine extracted terms with explicit filters from frontend
      const combinedSkillIds = [
        ...extractedSkillIds,
        ...(filters?.skills || []).map((s: string) => s.toLowerCase())
      ];
      
      const finalLocation = filters?.location || extractedLocation;
      const finalLocationNormalized = finalLocation ? this.normalizeLocation(finalLocation) : extractedLocationNormalized;
      
      const finalEducation = filters?.education || extractedEducation;
      
      // Debug logging
      this.logger.debug(`Search filters received: ${JSON.stringify(filters)}`);
      this.logger.debug(`Final location: "${finalLocation}", normalized: "${finalLocationNormalized}"`);
      this.logger.debug(`Combined skill IDs: ${JSON.stringify(combinedSkillIds)}`);
      this.logger.debug(`Final education: "${finalEducation}"`);
      
      // Determine if we should enforce strict filtering based on query content
      const hasSkillTerms = combinedSkillIds.length > 0;
      const hasLocationTerms = !!finalLocationNormalized;
      const hasEducationTerms = !!finalEducation;
      const isGeneralQuery = !hasSkillTerms && !hasLocationTerms && !hasEducationTerms;

      // Build Pinecone query with appropriate filters
      const combinedFilters = {
        ...(filters || {}),
        ...(hasSkillTerms ? { skillIds: combinedSkillIds } : {}),
        ...(hasLocationTerms ? { locationNormalized: finalLocationNormalized } : {}),
        ...(hasEducationTerms ? { education: finalEducation } : {}),
        ...(filters?.minExperience && { minExperience: filters.minExperience }),
        ...(filters?.maxExperience && { maxExperience: filters.maxExperience }),
      };
      
      // Add strict location filtering at Pinecone level if location is specified
      if (hasLocationTerms && finalLocationNormalized) {
        combinedFilters.locationNormalized = finalLocationNormalized;
        this.logger.debug(`Adding strict Pinecone location filter: ${finalLocationNormalized}`);
      }
      const builtFilter = this.buildPineconeFilter(combinedFilters);
      
      this.logger.debug(`Built Pinecone filter: ${JSON.stringify(builtFilter)}`);
      
      const queryRequest: any = {
        vector: queryEmbedding,
        topK: 20,
        includeMetadata: true,
      };
      if (builtFilter) {
        queryRequest.filter = builtFilter;
      }

      // Primary search
      let searchResponse = await this.pineconeIndex.query(queryRequest);
      let results = (searchResponse.matches || []);
      
      this.logger.debug(`Pinecone returned ${results.length} results before post-filtering`);
      if (results.length > 0) {
        this.logger.debug(`First result metadata: ${JSON.stringify(results[0].metadata)}`);
      }

      // Apply post-filtering based on query intent
      if (hasSkillTerms) {
        results = results.filter(match => {
          const skillsMeta: unknown = match.metadata?.skills;
          const skillsNorm: unknown = match.metadata?.skillsNormalized;
          const fullText: string | undefined = match.metadata?.fullText;
          const skillsArray: string[] = Array.isArray(skillsMeta) ? (skillsMeta as string[]) : [];
          const normArray: string[] = Array.isArray(skillsNorm) ? (skillsNorm as string[]) : [];
          const skillsLower = skillsArray.map(s => (typeof s === 'string' ? s.toLowerCase() : ''));
          const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';

          // Check if ANY of the extracted skills are present
          return combinedSkillIds.some(skillId => {
            const s = skillId.toLowerCase();
            if (normArray.includes(s)) return true;
            if (skillsLower.includes(s)) return true;
            if (fullTextLower.includes(s)) return true;
            const skillVariants = this.getSkillVariants(s);
            return skillVariants.some(v => fullTextLower.includes(v));
          });
        });
      }

      if (hasLocationTerms) {
        this.logger.debug(`Starting location filtering with ${results.length} results. Query location: "${finalLocationNormalized}"`);
        this.logger.debug(`Results before location filtering: ${results.map(r => `${r.id}: location="${r.metadata?.location}", normalized="${r.metadata?.locationNormalized}"`).join(', ')}`);
        results = results.filter(match => {
          const loc: string | undefined = match.metadata?.location;
          const locNorm: string | undefined = match.metadata?.locationNormalized;
          const fullText: string | undefined = match.metadata?.fullText;
          const locLower = typeof loc === 'string' ? loc.toLowerCase() : '';
          const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
          const qLoc = finalLocationNormalized!.toLowerCase();
          
          this.logger.debug(`Location filtering CV ${match.id}: location="${loc}", normalized="${locNorm}", query location="${qLoc}"`);
          
          // SMART location matching - exact matches OR city name contained in location
          let hasLocation = false;
          
          // First priority: exact match in locationNormalized field
          if (typeof locNorm === 'string' && locNorm.toLowerCase() === qLoc) {
            hasLocation = true;
            this.logger.debug(`Exact location match in normalized field: "${qLoc}" === "${locNorm}"`);
          }
          // Second priority: exact match in location field
          else if (locLower === qLoc) {
            hasLocation = true;
            this.logger.debug(`Exact location match in location field: "${qLoc}" === "${locLower}"`);
          }
          // Third priority: city name is contained in the location (e.g., "sialkot" in "sialkot, pakistan")
          else if (typeof locNorm === 'string' && locNorm.toLowerCase().includes(qLoc)) {
            hasLocation = true;
            this.logger.debug(`City name "${qLoc}" found in location "${locNorm}"`);
          }
          else if (locLower.includes(qLoc)) {
            hasLocation = true;
            this.logger.debug(`City name "${qLoc}" found in location "${locLower}"`);
          }
          // No match found
          else {
            this.logger.debug(`Location "${qLoc}" not found in CV location "${loc}" or normalized "${locNorm}"`);
          }
          
          if (hasLocation) {
            this.logger.debug(`Location "${qLoc}" found in CV ${match.id}`);
          } else {
            this.logger.debug(`CV ${match.id} filtered out - no matching location`);
          }
          
          return hasLocation;
        });
      }

      if (hasEducationTerms) {
        results = results.filter(match => {
          const education: string | undefined = match.metadata?.education;
          const fullText: string | undefined = match.metadata?.fullText;
          const eduLower = typeof education === 'string' ? education.toLowerCase() : '';
          const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
          const qEdu = finalEducation!.toLowerCase();
          
          this.logger.debug(`Education filtering CV ${match.id}: education="${education}", query education="${qEdu}"`);
          
          // More flexible education matching
          let hasEducation = false;
          
          // Check if query education appears in stored education
          if (eduLower.includes(qEdu)) {
            hasEducation = true;
            this.logger.debug(`Education match found in education field: "${qEdu}" in "${eduLower}"`);
          }
          // Check if query education appears in fullText
          else if (fullTextLower.includes(qEdu)) {
            hasEducation = true;
            this.logger.debug(`Education match found in fullText: "${qEdu}" in fullText`);
          }
          // Check for partial matches (e.g., "information technology" in "Bachelor of Science (B.S.) Information Technology")
          else {
            const queryWords = qEdu.split(/\s+/);
            const hasPartialMatch = queryWords.some(word => 
              word.length > 2 && (eduLower.includes(word) || fullTextLower.includes(word))
            );
            if (hasPartialMatch) {
              hasEducation = true;
              this.logger.debug(`Partial education match found: query words "${queryWords}" in education or fullText`);
            }
          }
          
          if (hasEducation) {
            this.logger.debug(`Education "${qEdu}" found in CV ${match.id}`);
          } else {
            this.logger.debug(`CV ${match.id} filtered out - no matching education`);
          }
          
          return hasEducation;
        });
      }

      // Apply similarity threshold (more reasonable)
      results = results.filter(match => 
        typeof match.score === 'number' ? match.score >= 0.3 : true
      );

      // Apply sorting if specified
      if (filters?.sortBy && filters.sortBy !== 'relevance') {
        results.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'experience':
              aValue = a.metadata?.yearsExperience || 0;
              bValue = b.metadata?.yearsExperience || 0;
              break;
            case 'uploadDate':
              aValue = new Date(a.metadata?.uploadDate || 0);
              bValue = new Date(b.metadata?.uploadDate || 0);
              break;
            default:
              return 0;
          }
          
          if (filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      // If no results and we had strict filtering, try a more lenient search
      if (results.length === 0 && (hasSkillTerms || hasLocationTerms || hasEducationTerms)) {
        this.logger.debug(`No results found with strict filtering, trying fallback search`);
        const fallbackRequest: any = {
          vector: queryEmbedding,
          topK: 30,
          includeMetadata: true,
        };
        const fallbackResponse = await this.pineconeIndex.query(fallbackRequest);
        const fallbackResults = (fallbackResponse.matches || [])
          .filter(match => typeof match.score === 'number' ? match.score >= 0.2 : true);
        
        this.logger.debug(`Fallback search returned ${fallbackResults.length} results`);
        if (fallbackResults.length > 0) {
          this.logger.debug(`Fallback result metadata: ${JSON.stringify(fallbackResults[0].metadata)}`);
        }

        // Apply softer filtering for fallback, but ALWAYS apply location filtering if location terms exist
        if (hasSkillTerms) {
          results = fallbackResults.filter(match => {
            const fullText: string | undefined = match.metadata?.fullText;
            const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
            
            return combinedSkillIds.some(skillId => {
              const s = skillId.toLowerCase();
              if (fullTextLower.includes(s)) return true;
              const skillVariants = this.getSkillVariants(s);
              return skillVariants.some(v => fullTextLower.includes(v));
            });
          });
        } else {
          results = fallbackResults;
        }

        // IMPORTANT: Always apply location filtering in fallback if location terms exist
        if (hasLocationTerms) {
          this.logger.debug(`Applying location filtering to fallback results`);
          results = results.filter(match => {
            const loc: string | undefined = match.metadata?.location;
            const locNorm: string | undefined = match.metadata?.locationNormalized;
            const fullText: string | undefined = match.metadata?.fullText;
            const locLower = typeof loc === 'string' ? loc.toLowerCase() : '';
            const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
            const qLoc = finalLocationNormalized!.toLowerCase();
            
            this.logger.debug(`Fallback location filtering CV ${match.id}: location="${loc}", normalized="${locNorm}", query location="${qLoc}"`);
            
            // SMART location matching in fallback too - exact matches OR city name contained in location
            let hasLocation = false;
            
            // First priority: exact match in locationNormalized field
            if (typeof locNorm === 'string' && locNorm.toLowerCase() === qLoc) {
              hasLocation = true;
              this.logger.debug(`Fallback: Exact location match in normalized field: "${qLoc}" === "${locNorm}"`);
            }
            // Second priority: exact match in location field
            else if (locLower === qLoc) {
              hasLocation = true;
              this.logger.debug(`Fallback: Exact location match in location field: "${qLoc}" === "${locLower}"`);
            }
            // Third priority: city name is contained in the location (e.g., "sialkot" in "sialkot, pakistan")
            else if (typeof locNorm === 'string' && locNorm.toLowerCase().includes(qLoc)) {
              hasLocation = true;
              this.logger.debug(`Fallback: City name "${qLoc}" found in location "${locNorm}"`);
            }
            else if (locLower.includes(qLoc)) {
              hasLocation = true;
              this.logger.debug(`Fallback: City name "${qLoc}" found in location "${locLower}"`);
            }
            // No match found
            else {
              this.logger.debug(`Fallback: Location "${qLoc}" not found in CV location "${loc}" or normalized "${locNorm}"`);
            }
            
            if (!hasLocation) {
              this.logger.debug(`CV ${match.id} filtered out in fallback - no matching location`);
            }
            
            return hasLocation;
          });
        }

        // IMPORTANT: Always apply education filtering in fallback if education terms exist
        if (hasEducationTerms) {
          this.logger.debug(`Applying education filtering to fallback results`);
          this.logger.debug(`Education filter criteria: "${finalEducation}"`);
          results = results.filter(match => {
            const education: string | undefined = match.metadata?.education;
            const fullText: string | undefined = match.metadata?.fullText;
            const eduLower = typeof education === 'string' ? education.toLowerCase() : '';
            const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
            const qEdu = finalEducation!.toLowerCase();
            
            this.logger.debug(`CV ${match.id} education: "${education}", fullText contains education: ${fullTextLower.includes(qEdu)}`);
            
            const hasEducation = eduLower.includes(qEdu) || fullTextLower.includes(qEdu);
            
            if (!hasEducation) {
              this.logger.debug(`CV ${match.id} filtered out in fallback - no matching education`);
            } else {
              this.logger.debug(`CV ${match.id} passes education filter`);
            }
            
            return hasEducation;
          });
        }
      }

      // Format results
      return results.map(match => {
        const metadata: any = {};
        if (match.metadata?.fullName) metadata.fullName = match.metadata.fullName;
        if (match.metadata?.email) metadata.email = match.metadata.email;
        if (match.metadata?.phone) metadata.phone = match.metadata.phone;
        if (match.metadata?.skills) metadata.skills = match.metadata.skills;
        if (match.metadata?.yearsExperience !== undefined && match.metadata?.yearsExperience !== null) {
          metadata.yearsExperience = match.metadata.yearsExperience;
        }
        if (match.metadata?.education) metadata.education = match.metadata.education;
        if (match.metadata?.location) metadata.location = match.metadata.location;
        
        return {
          id: match.id,
          filename: match.metadata?.filename,
          metadata,
          similarityScore: match.score,
          uploadDate: new Date(match.metadata?.uploadDate),
          education: match.metadata?.education,
        };
      });

    } catch (error) {
      this.logger.error('Error searching CVs:', error);
      throw new Error('Failed to search CVs');
    }
  }

  /**
   * Build Pinecone filter based on search criteria
   */
  private buildPineconeFilter(filters?: any): any {
    if (!filters) return undefined;

    const filter: any = {};

    // Add location filter if specified
    if (filters.location) {
      filter.location = { $eq: filters.location };
    }
    if (filters.locationNormalized) {
      filter.locationNormalized = { $eq: filters.locationNormalized };
    }

    // Add education filter if specified
    if (filters.education) {
      filter.education = { $eq: filters.education };
    }

    // Add experience range filter if specified
    if (filters.minExperience || filters.maxExperience) {
      filter.yearsExperience = {};
      if (filters.minExperience) {
        filter.yearsExperience.$gte = filters.minExperience;
      }
      if (filters.maxExperience) {
        filter.yearsExperience.$lte = filters.maxExperience;
      }
    }

    // Add skills filter if specified (match any of the provided skills)
    if (filters.skills && filters.skills.length > 0) {
      const skillsList: string[] = filters.skills
        .filter((s: unknown) => typeof s === 'string' && (s as string).trim().length > 0)
        .map((s: string) => s.trim());

      if (skillsList.length === 1) {
        // Single skill: use $in with a single-element array
        filter.skills = { $in: [skillsList[0]] };
      } else if (skillsList.length > 1) {
        // Multiple skills: OR together single-skill $in clauses
        filter.$or = skillsList.map((s: string) => ({ skills: { $in: [s] } }));
      }
    }

    // Normalized skill IDs
    if (filters.skillIds && filters.skillIds.length > 0) {
      const ids: string[] = filters.skillIds
        .filter((s: unknown) => typeof s === 'string' && (s as string).trim().length > 0)
        .map((s: string) => s.trim().toLowerCase());
      if (ids.length === 1) {
        filter.skillsNormalized = { $in: [ids[0]] };
      } else if (ids.length > 1) {
        filter.$or = [...(filter.$or || []), ...ids.map(i => ({ skillsNormalized: { $in: [i] } }))];
      }
    }

    // If no filters were added, return undefined so the query omits `filter`
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * Extract likely location keyword from the query
   */
  private extractLocationFromQuery(query: string): string | null {
    const q = (query || '').toLowerCase();
    // Simple heuristic: look for 'in <loc>' or 'from <loc>' or explicit city names in a small catalog
    const inMatch = q.match(/\b(?:in|from|based in|located in|of)\s+([a-z\s]+?)(?:\?|\.|,|$)/);
    if (inMatch && inMatch[1]) {
      const loc = inMatch[1].trim();
      if (loc.length >= 3 && loc.length <= 40) {
        return loc.charAt(0).toUpperCase() + loc.slice(1);
      }
    }

    // Known cities catalog (extend as needed)
    const cities = ['karachi', 'sialkot', 'lahore', 'islamabad', 'rawalpindi'];
    for (const city of cities) {
      if (q.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }

    return null;
  }

  /**
   * Extract location context to determine if a location mention is primary or secondary
   */
  private extractLocationContext(fullText: string, location: string): { isPrimaryLocation: boolean; context: string } {
    const locationLower = location.toLowerCase();
    const textLower = fullText.toLowerCase();
    
    // Look for patterns that suggest this is the candidate's primary location
    const primaryLocationPatterns = [
      new RegExp(`\\b(based in|located in|from|resident of|address:?|lives in)\\s+${locationLower}\\b`, 'i'),
      new RegExp(`\\b${locationLower}\\s+(pakistan|city|area|region)\\b`, 'i'),
      new RegExp(`\\b(contact|phone|email|address).*?${locationLower}`, 'i'),
    ];
    
    // Look for patterns that suggest this is a secondary/mentioned location
    const secondaryLocationPatterns = [
      new RegExp(`\\b(worked in|experience in|project in|client in|visited|traveled to)\\s+${locationLower}\\b`, 'i'),
      new RegExp(`\\b${locationLower}\\s+(office|branch|client|project)`, 'i'),
    ];
    
    // Check for primary location patterns
    for (const pattern of primaryLocationPatterns) {
      if (pattern.test(textLower)) {
        return { isPrimaryLocation: true, context: `Primary location pattern: ${pattern.source}` };
      }
    }
    
    // Check for secondary location patterns
    for (const pattern of secondaryLocationPatterns) {
      if (pattern.test(textLower)) {
        return { isPrimaryLocation: false, context: `Secondary location pattern: ${pattern.source}` };
      }
    }
    
    // If no clear patterns, be conservative and assume it's secondary
    return { isPrimaryLocation: false, context: 'No clear location context pattern found' };
  }

  /**
   * Extract likely education keywords from a natural language query
   */
  private extractEducationFromQuery(query: string): string | null {
    const q = (query || '').toLowerCase();
    
    // Look for education-related patterns
    const educationPatterns = [
      /\b(?:with|having|degree in|studied|graduated|bachelor|master|phd|diploma|certification)\s+([a-z\s]+?)(?:\?|\.|,|$)/i,
      /\b(?:from|at)\s+([a-z\s]+?(?:university|college|institute|school))/i,
      /\b(?:university|college|institute|school)\s+of\s+([a-z\s]+)/i,
      /\bdegree\s+in\s+([a-z\s]+)/i,  // Added this pattern for "degree in Information technology"
    ];

    for (const pattern of educationPatterns) {
      const match = q.match(pattern);
      if (match && match[1]) {
        const edu = match[1].trim();
        if (edu.length >= 3 && edu.length <= 50) {
          this.logger.debug(`Education extracted from pattern: "${edu}" from query: "${query}"`);
          return edu.charAt(0).toUpperCase() + edu.slice(1);
        }
      }
    }

    // Look for specific degree types
    const degreeTypes = [
      'bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certification',
      'bs', 'ms', 'mba', 'bsc', 'msc', 'ba', 'ma'
    ];
    
    for (const degree of degreeTypes) {
      if (q.includes(degree)) {
        this.logger.debug(`Degree type extracted: "${degree}" from query: "${query}"`);
        return degree.charAt(0).toUpperCase() + degree.slice(1);
      }
    }

    // Look for specific fields of study
    const studyFields = [
      'computer science', 'information technology', 'software engineering',
      'data science', 'artificial intelligence', 'machine learning',
      'web development', 'mobile development', 'cybersecurity',
      'business administration', 'management', 'marketing'
    ];
    
    for (const field of studyFields) {
      if (q.includes(field)) {
        this.logger.debug(`Study field extracted: "${field}" from query: "${query}"`);
        return field.charAt(0).toUpperCase() + field.slice(1);
      }
    }

    this.logger.debug(`No education terms extracted from query: "${query}"`);
    return null;
  }

  /**
   * Extract likely skill keywords from a natural language query
   */
  private extractSkillsFromQuery(query: string): string[] {
    const q = (query || '').toLowerCase();
    const catalog: Record<string, string[]> = {
      // Programming Languages
      python: ['python', 'py'],
      javascript: ['javascript', 'js', 'ecmascript'],
      typescript: ['typescript', 'ts'],
      java: ['java', 'j2ee', 'j2se'],
      'c#': ['c#', 'csharp', 'dotnet', '.net'],
      'c++': ['c++', 'cpp', 'c plus plus'],
      c: ['c programming', 'c language'],
      go: ['go', 'golang'],
      rust: ['rust'],
      swift: ['swift'],
      kotlin: ['kotlin'],
      scala: ['scala'],
      php: ['php', 'hypertext preprocessor'],
      ruby: ['ruby', 'ruby on rails', 'rails'],
      perl: ['perl'],
      r: ['r programming', 'r language'],
      matlab: ['matlab'],
      julia: ['julia'],
      
      // Web Technologies
      html: ['html', 'html5', 'hypertext markup language'],
      css: ['css', 'css3', 'cascading style sheets'],
      'node.js': ['node.js', 'nodejs', 'node js', 'node'],
      react: ['react', 'reactjs', 'react.js', 'react native'],
      angular: ['angular', 'angularjs', 'angular.js'],
      vue: ['vue', 'vue.js', 'vuejs'],
      svelte: ['svelte'],
      next: ['next.js', 'nextjs'],
      nuxt: ['nuxt.js', 'nuxtjs'],
      express: ['express', 'express.js', 'expressjs'],
      fastify: ['fastify'],
      koa: ['koa'],
      hapi: ['hapi'],
      
      // Backend Frameworks
      django: ['django', 'django framework'],
      flask: ['flask', 'flask framework'],
      fastapi: ['fastapi', 'fast api'],
      spring: ['spring', 'spring boot', 'springboot', 'spring framework'],
      'spring boot': ['spring boot', 'springboot'],
      laravel: ['laravel'],
      symfony: ['symfony'],
      codeigniter: ['codeigniter'],
      asp: ['asp', 'asp.net', 'aspnet'],
      
      // Databases
      sql: ['sql', 'structured query language', 'mysql', 'postgresql', 'oracle', 'sql server'],
      mysql: ['mysql', 'my sql'],
      postgresql: ['postgresql', 'postgres', 'psql', 'postgre sql'],
      mongodb: ['mongodb', 'mongo', 'mongo db'],
      redis: ['redis'],
      elasticsearch: ['elasticsearch', 'elastic search', 'es'],
      cassandra: ['cassandra'],
      couchdb: ['couchdb', 'couch db'],
      neo4j: ['neo4j', 'neo 4j'],
      sqlite: ['sqlite', 'sql lite'],
      oracle: ['oracle', 'oracle db', 'oracle database'],
      'sql server': ['sql server', 'mssql', 'ms sql'],
      
      // Cloud & DevOps
      aws: ['aws', 'amazon web services', 'amazon aws'],
      azure: ['azure', 'microsoft azure', 'azure cloud'],
      gcp: ['gcp', 'google cloud', 'google cloud platform'],
      docker: ['docker', 'docker container'],
      kubernetes: ['kubernetes', 'k8s', 'kube'],
      terraform: ['terraform'],
      ansible: ['ansible'],
      jenkins: ['jenkins'],
      gitlab: ['gitlab', 'git lab'],
      github: ['github', 'git hub'],
      git: ['git', 'git version control'],
      ci: ['ci', 'continuous integration', 'continuous integration/cd'],
      cd: ['cd', 'continuous deployment', 'continuous delivery'],
      
      // Data Science & ML
      ml: ['machine learning', 'ml', 'machine learning algorithms'],
      'machine learning': ['machine learning', 'ml', 'machine learning algorithms'],
      ai: ['artificial intelligence', 'ai', 'artificial intelligence algorithms'],
      'artificial intelligence': ['artificial intelligence', 'ai'],
      nlp: ['nlp', 'natural language processing', 'natural language processing algorithms'],
      'natural language processing': ['nlp', 'natural language processing'],
      'deep learning': ['deep learning', 'deep learning algorithms', 'neural networks'],
      'neural networks': ['neural networks', 'neural network', 'deep learning'],
      pandas: ['pandas', 'pandas library'],
      numpy: ['numpy', 'numpy library'],
      scikit: ['scikit-learn', 'scikit learn', 'sklearn', 'scikit'],
      'scikit-learn': ['scikit-learn', 'scikit learn', 'sklearn', 'scikit'],
      tensorflow: ['tensorflow', 'tensor flow', 'tf'],
      pytorch: ['pytorch', 'py torch', 'torch'],
      keras: ['keras'],
      opencv: ['opencv', 'open cv', 'computer vision'],
      'computer vision': ['computer vision', 'opencv', 'open cv'],
      
      // Frontend & UI
      redux: ['redux', 'redux toolkit'],
      mobx: ['mobx'],
      'tailwind css': ['tailwind', 'tailwindcss', 'tailwind css'],
      bootstrap: ['bootstrap', 'bootstrap framework'],
      material: ['material ui', 'material-ui', 'mui'],
      'material ui': ['material ui', 'material-ui', 'mui'],
      sass: ['sass', 'scss'],
      less: ['less'],
      webpack: ['webpack'],
      vite: ['vite'],
      rollup: ['rollup'],
      babel: ['babel'],
      
      // Testing & Quality
      jest: ['jest', 'jest testing'],
      mocha: ['mocha'],
      chai: ['chai'],
      cypress: ['cypress', 'cypress testing'],
      playwright: ['playwright'],
      selenium: ['selenium', 'selenium webdriver'],
      'unit testing': ['unit testing', 'unit test', 'unit tests'],
      'integration testing': ['integration testing', 'integration test', 'integration tests'],
      'end to end testing': ['end to end testing', 'e2e testing', 'e2e test'],
      
      // Other Technologies
      graphql: ['graphql', 'graph ql'],
      rest: ['rest', 'rest api', 'restful', 'restful api'],
      soap: ['soap', 'soap api'],
      microservices: ['microservices', 'micro service', 'micro services'],
      'api development': ['api development', 'api dev', 'api design'],
      'web development': ['web development', 'web dev'],
      'mobile development': ['mobile development', 'mobile dev', 'mobile app development'],
      'desktop development': ['desktop development', 'desktop app development'],
      'game development': ['game development', 'game dev', 'game programming'],
      'blockchain': ['blockchain', 'block chain', 'ethereum', 'bitcoin'],
      'cybersecurity': ['cybersecurity', 'cyber security', 'information security'],
      'data engineering': ['data engineering', 'data engineer', 'etl', 'data pipeline'],
      'devops': ['devops', 'dev ops', 'development operations'],
      'agile': ['agile', 'agile methodology', 'scrum', 'kanban'],
      'scrum': ['scrum', 'scrum methodology'],
      'kanban': ['kanban', 'kanban methodology'],
      'project management': ['project management', 'project manager', 'pm'],
      'team leadership': ['team leadership', 'team lead', 'technical lead', 'tech lead'],
    };

    const found: string[] = [];
    for (const canonical of Object.keys(catalog)) {
      const variants = catalog[canonical];
      if (variants.some(v => q.includes(v))) {
        // Use canonical lowercase id for normalized matching
        found.push(canonical.toLowerCase());
        this.logger.debug(`Extracted skill: ${canonical} from query: "${q}"`);
      }
    }

    // Deduplicate while preserving order
    const result = Array.from(new Set(found));
    this.logger.debug(`Final extracted skills: ${JSON.stringify(result)}`);
    return result;
  }

  private normalizeSkill(skill: string): string {
    const s = (skill || '').toLowerCase().trim();
    // Map common variants to canonical IDs
    const map: Record<string, string> = {
      // Programming Languages
      'node js': 'node.js',
      'node': 'node.js',
      'nodejs': 'node.js',
      'reactjs': 'react',
      'react.js': 'react',
      'react native': 'react',
      'ts': 'typescript',
      'js': 'javascript',
      'ecmascript': 'javascript',
      'j2ee': 'java',
      'j2se': 'java',
      'csharp': 'c#',
      'dotnet': 'c#',
      '.net': 'c#',
      'cpp': 'c++',
      'c plus plus': 'c++',
      'c programming': 'c',
      'c language': 'c',
      'golang': 'go',
      'hypertext preprocessor': 'php',
      'ruby on rails': 'ruby',
      'rails': 'ruby',
      'r programming': 'r',
      'r language': 'r',
      
      // Web Technologies
      'html5': 'html',
      'hypertext markup language': 'html',
      'css3': 'css',
      'cascading style sheets': 'css',
      'angularjs': 'angular',
      'angular.js': 'angular',
      'vue.js': 'vue',
      'vuejs': 'vue',
      'next.js': 'next',
      'nextjs': 'next',
      'nuxt.js': 'nuxt',
      'nuxtjs': 'nuxt',
      'express.js': 'express',
      'expressjs': 'express',
      
      // Backend Frameworks
      'django framework': 'django',
      'flask framework': 'flask',
      'fast api': 'fastapi',
      'spring boot': 'spring boot',
      'springboot': 'spring boot',
      'spring framework': 'spring',
      'asp.net': 'asp',
      'aspnet': 'asp',
      
      // Databases
      'structured query language': 'sql',
      'my sql': 'mysql',
      'postgre sql': 'postgresql',
      'mongo db': 'mongodb',
      'elastic search': 'elasticsearch',
      'es': 'elasticsearch',
      'couch db': 'couchdb',
      'neo 4j': 'neo4j',
      'sql lite': 'sqlite',
      'oracle db': 'oracle',
      'oracle database': 'oracle',
      'ms sql': 'sql server',
      'mssql': 'sql server',
      
      // Cloud & DevOps
      'amazon web services': 'aws',
      'amazon aws': 'aws',
      'microsoft azure': 'azure',
      'azure cloud': 'azure',
      'google cloud': 'gcp',
      'google cloud platform': 'gcp',
      'docker container': 'docker',
      'k8s': 'kubernetes',
      'kube': 'kubernetes',
      'git lab': 'gitlab',
      'git hub': 'github',
      'git version control': 'git',
      'continuous integration': 'ci',
      'continuous integration/cd': 'ci',
      'continuous deployment': 'cd',
      'continuous delivery': 'cd',
      
      // Data Science & ML
      'machine learning algorithms': 'ml',
      'artificial intelligence algorithms': 'ai',
      'natural language processing algorithms': 'nlp',
      'deep learning algorithms': 'deep learning',
      'neural network': 'neural networks',
      'pandas library': 'pandas',
      'numpy library': 'numpy',
      'scikit learn': 'scikit-learn',
      'sklearn': 'scikit-learn',
      'scikit': 'scikit-learn',
      'tensor flow': 'tensorflow',
      'tf': 'tensorflow',
      'py torch': 'pytorch',
      'torch': 'pytorch',
      'open cv': 'opencv',
      'computer vision': 'opencv',
      
      // Frontend & UI
      'redux toolkit': 'redux',
      'tailwindcss': 'tailwind css',
      'bootstrap framework': 'bootstrap',
      'material-ui': 'material ui',
      'mui': 'material ui',
      'scss': 'sass',
      'jest testing': 'jest',
      'cypress testing': 'cypress',
      'selenium webdriver': 'selenium',
      'unit test': 'unit testing',
      'unit tests': 'unit testing',
      'integration test': 'integration testing',
      'integration tests': 'integration testing',
      'e2e testing': 'end to end testing',
      'e2e test': 'end to end testing',
      
      // Other Technologies
      'graph ql': 'graphql',
      'rest api': 'rest',
      'restful': 'rest',
      'restful api': 'rest',
      'soap api': 'soap',
      'micro service': 'microservices',
      'micro services': 'microservices',
      'api dev': 'api development',
      'api design': 'api development',
      'mobile dev': 'mobile development',
      'mobile app development': 'mobile development',
      'desktop app development': 'desktop development',
      'game dev': 'game development',
      'game programming': 'game development',
      'block chain': 'blockchain',
      'ethereum': 'blockchain',
      'bitcoin': 'blockchain',
      'cyber security': 'cybersecurity',
      'information security': 'cybersecurity',
      'data engineer': 'data engineering',
      'etl': 'data engineering',
      'data pipeline': 'data engineering',
      'dev ops': 'devops',
      'development operations': 'devops',
      'agile methodology': 'agile',
      'scrum methodology': 'scrum',
      'kanban methodology': 'kanban',
      'project manager': 'project management',
      'pm': 'project management',
      'team lead': 'team leadership',
      'technical lead': 'team leadership',
      'tech lead': 'team leadership',
      
      // Business & Web Development Skills
      'web development': 'website development',
      'web dev': 'website development',
      'website dev': 'website development',
      'web management': 'website management',
      'site management': 'website management',
      'smm': 'social media marketing',
      'social marketing': 'social media marketing',
      'digital marketing': 'social media marketing',
      'search engine optimization': 'seo',
      'search engine optimisation': 'seo',
      'client management': 'client dealing',
      'customer service': 'client dealing',
      'client relations': 'client dealing',
      'communication skills': 'communication',
      'verbal communication': 'communication',
      'written communication': 'communication',
      'leadership skills': 'leadership',
      'team management': 'leadership',
      'supervision': 'leadership',
      'administrative management': 'office management',
      'office administration': 'office management',
      'presentations': 'presentation skills',
      'public speaking': 'presentation skills',
      'business communication': 'business correspondence',
      'correspondence': 'business correspondence',
      'team collaboration': 'team coordination',
      'teamwork': 'team coordination',
      'performance evaluation': 'performance management',
      'feedback': 'performance management',
      'troubleshooting': 'problem solving',
      'issue resolution': 'problem solving',
      'scheduling': 'time management',
      'prioritization': 'time management',
      'organizational skills': 'organization',
      'planning': 'organization',
      'multi-tasking': 'multitasking',
      'handling multiple tasks': 'multitasking',
      'detail oriented': 'attention to detail',
      'meticulous': 'attention to detail',
      'analytical skills': 'analytical thinking',
      'critical thinking': 'analytical thinking',
      'strategic thinking': 'strategic planning',
      'change implementation': 'change management',
      'adaptation': 'change management',
    };
    const normalized = map[s] || s;
    this.logger.debug(`Normalized skill "${skill}" -> "${normalized}"`);
    return normalized;
  }

  private normalizeLocation(loc: string): string {
    const l = (loc || '').toLowerCase().trim();
    // Simple canonicalization (extend with a gazetteer as needed)
    const map: Record<string, string> = {
      'karachi': 'karachi',
      'sialkot': 'sialkot',
      'lahore': 'lahore',
      'islamabad': 'islamabad',
      'rawalpindi': 'rawalpindi',
    };
    return map[l] || l;
  }

  /**
   * Get all variants for a given skill ID
   */
  private getSkillVariants(skillId: string): string[] {
    const catalog: Record<string, string[]> = {
      // Programming Languages
      python: ['python', 'py'],
      javascript: ['javascript', 'js', 'ecmascript'],
      typescript: ['typescript', 'ts'],
      java: ['java', 'j2ee', 'j2se'],
      'c#': ['c#', 'csharp', 'dotnet', '.net'],
      'c++': ['c++', 'cpp', 'c plus plus'],
      c: ['c programming', 'c language'],
      go: ['go', 'golang'],
      rust: ['rust'],
      swift: ['swift'],
      kotlin: ['kotlin'],
      scala: ['scala'],
      php: ['php', 'hypertext preprocessor'],
      ruby: ['ruby', 'ruby on rails', 'rails'],
      perl: ['perl'],
      r: ['r programming', 'r language'],
      matlab: ['matlab'],
      julia: ['julia'],
      
      // Web Technologies
      html: ['html', 'html5', 'hypertext markup language'],
      css: ['css', 'css3', 'cascading style sheets'],
      'node.js': ['node.js', 'nodejs', 'node js', 'node'],
      react: ['react', 'reactjs', 'react.js', 'react native'],
      angular: ['angular', 'angularjs', 'angular.js'],
      vue: ['vue', 'vue.js', 'vuejs'],
      svelte: ['svelte'],
      next: ['next.js', 'nextjs'],
      nuxt: ['nuxt.js', 'nuxtjs'],
      express: ['express', 'express.js', 'expressjs'],
      fastify: ['fastify'],
      koa: ['koa'],
      hapi: ['hapi'],
      
      // Backend Frameworks
      django: ['django', 'django framework'],
      flask: ['flask', 'flask framework'],
      fastapi: ['fastapi', 'fast api'],
      spring: ['spring', 'spring boot', 'springboot', 'spring framework'],
      'spring boot': ['spring boot', 'springboot'],
      laravel: ['laravel'],
      symfony: ['symfony'],
      codeigniter: ['codeigniter'],
      asp: ['asp', 'asp.net', 'aspnet'],
      
      // Databases
      sql: ['sql', 'structured query language', 'mysql', 'postgresql', 'oracle', 'sql server'],
      mysql: ['mysql', 'my sql'],
      postgresql: ['postgresql', 'postgres', 'psql', 'postgre sql'],
      mongodb: ['mongodb', 'mongo', 'mongo db'],
      redis: ['redis'],
      elasticsearch: ['elasticsearch', 'elastic search', 'es'],
      cassandra: ['cassandra'],
      couchdb: ['couchdb', 'couch db'],
      neo4j: ['neo4j', 'neo 4j'],
      sqlite: ['sqlite', 'sql lite'],
      oracle: ['oracle', 'oracle db', 'oracle database'],
      'sql server': ['sql server', 'mssql', 'ms sql'],
      
      // Cloud & DevOps
      aws: ['aws', 'amazon web services', 'amazon aws'],
      azure: ['azure', 'microsoft azure', 'azure cloud'],
      gcp: ['gcp', 'google cloud', 'google cloud platform'],
      docker: ['docker', 'docker container'],
      kubernetes: ['kubernetes', 'k8s', 'kube'],
      terraform: ['terraform'],
      ansible: ['ansible'],
      jenkins: ['jenkins'],
      gitlab: ['gitlab', 'git lab'],
      github: ['github', 'git hub'],
      git: ['git', 'git version control'],
      ci: ['ci', 'continuous integration', 'continuous integration/cd'],
      cd: ['cd', 'continuous deployment', 'continuous delivery'],
      
      // Data Science & ML
      ml: ['machine learning', 'ml', 'machine learning algorithms'],
      'machine learning': ['machine learning', 'ml', 'machine learning algorithms'],
      ai: ['artificial intelligence', 'ai', 'artificial intelligence algorithms'],
      'artificial intelligence': ['artificial intelligence', 'ai'],
      nlp: ['nlp', 'natural language processing', 'natural language processing algorithms'],
      'natural language processing': ['nlp', 'natural language processing'],
      'deep learning': ['deep learning', 'deep learning algorithms', 'neural networks'],
      'neural networks': ['neural networks', 'neural network', 'deep learning'],
      pandas: ['pandas', 'pandas library'],
      numpy: ['numpy', 'numpy library'],
      scikit: ['scikit-learn', 'scikit learn', 'sklearn', 'scikit'],
      'scikit-learn': ['scikit-learn', 'scikit learn', 'sklearn', 'scikit'],
      tensorflow: ['tensorflow', 'tensor flow', 'tf'],
      pytorch: ['pytorch', 'py torch', 'torch'],
      keras: ['keras'],
      opencv: ['opencv', 'open cv', 'computer vision'],
      'computer vision': ['computer vision', 'opencv', 'open cv'],
      
      // Frontend & UI
      redux: ['redux', 'redux toolkit'],
      mobx: ['mobx'],
      'tailwind css': ['tailwind', 'tailwindcss', 'tailwind css'],
      bootstrap: ['bootstrap', 'bootstrap framework'],
      material: ['material ui', 'material-ui', 'mui'],
      'material ui': ['material ui', 'material-ui', 'mui'],
      sass: ['sass', 'scss'],
      less: ['less'],
      webpack: ['webpack'],
      vite: ['vite'],
      rollup: ['rollup'],
      babel: ['babel'],
      
      // Testing & Quality
      jest: ['jest', 'jest testing'],
      mocha: ['mocha'],
      chai: ['chai'],
      cypress: ['cypress', 'cypress testing'],
      playwright: ['playwright'],
      selenium: ['selenium', 'selenium webdriver'],
      'unit testing': ['unit testing', 'unit test', 'unit tests'],
      'integration testing': ['integration testing', 'integration test', 'integration tests'],
      'end to end testing': ['end to end testing', 'e2e testing', 'e2e test'],
      
      // Other Technologies
      graphql: ['graphql', 'graph ql'],
      rest: ['rest', 'rest api', 'restful', 'restful api'],
      soap: ['soap', 'soap api'],
      microservices: ['microservices', 'micro service', 'micro services'],
      'api development': ['api development', 'api dev', 'api design'],
      'web development': ['web development', 'web dev'],
      'mobile development': ['mobile development', 'mobile dev', 'mobile app development'],
      'desktop development': ['desktop development', 'desktop app development'],
      'game development': ['game development', 'game dev', 'game programming'],
      'blockchain': ['blockchain', 'block chain', 'ethereum', 'bitcoin'],
      'cybersecurity': ['cybersecurity', 'cyber security', 'information security'],
      'data engineering': ['data engineering', 'data engineer', 'etl', 'data pipeline'],
      'devops': ['devops', 'dev ops', 'development operations'],
      'agile': ['agile', 'agile methodology', 'scrum', 'kanban'],
      'scrum': ['scrum', 'scrum methodology'],
      'kanban': ['kanban', 'kanban methodology'],
      'project management': ['project management', 'project manager', 'pm'],
      'team leadership': ['team leadership', 'team lead', 'technical lead', 'tech lead'],
    };
    
    return catalog[skillId] || [skillId];
  }

  /**
   * Get CV file path for download
   */
  getCvFilePath(cvId: string): string {
    // Try to fetch the vector metadata to get the real stored path
    // Note: Pinecone fetch is async, so expose a separate async method
    // This sync method is kept for backward-compat and will fall back to legacy path format
    const uploadsDir = path.join(process.cwd(), 'uploads');
    return path.join(uploadsDir, cvId);
  }

  /**
   * Fetch the stored file path from Pinecone metadata by CV id
   */
  async getCvFilePathFromIndex(cvId: string): Promise<string | null> {
    try {
      // Attempt 1: Standard fetch with ids array in object
      try {
        const fetchResp = await this.pineconeIndex.fetch({ ids: [cvId] });
        const vector = fetchResp?.vectors?.[cvId];
        const stored = vector?.metadata as any;
        const storedFilePath: string | undefined = stored?.storedFilePath;
        const storedFilename: string | undefined = stored?.storedFilename;

        if (storedFilePath && typeof storedFilePath === 'string') {
          return storedFilePath;
        }

        if (storedFilename && typeof storedFilename === 'string') {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          return path.join(uploadsDir, storedFilename);
        }
      } catch (innerErr) {
        this.logger.warn(`Pinecone fetch (object form) failed for ${cvId}: ${String(innerErr)}`);
      }

      // Attempt 2: Namespace API if available
      try {
        if (typeof this.pineconeIndex.namespace === 'function') {
          const ns = this.pineconeIndex.namespace('__default__');
          const fetchResp2 = await ns.fetch([cvId]);
          const vector2 = fetchResp2?.vectors?.[cvId];
          const stored2 = vector2?.metadata as any;
          const storedFilePath2: string | undefined = stored2?.storedFilePath;
          const storedFilename2: string | undefined = stored2?.storedFilename;

          if (storedFilePath2 && typeof storedFilePath2 === 'string') {
            return storedFilePath2;
          }
          if (storedFilename2 && typeof storedFilename2 === 'string') {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            return path.join(uploadsDir, storedFilename2);
          }
        }
      } catch (innerErr2) {
        this.logger.warn(`Pinecone fetch (namespace form) failed for ${cvId}: ${String(innerErr2)}`);
      }

      // Attempt 3: Query by id to get metadata
      try {
        const queryResp = await this.pineconeIndex.query({
          id: cvId,
          topK: 1,
          includeMetadata: true,
        });
        const match = queryResp?.matches?.[0];
        const storedQ = match?.metadata as any;
        const storedFilePathQ: string | undefined = storedQ?.storedFilePath;
        const storedFilenameQ: string | undefined = storedQ?.storedFilename;
        if (storedFilePathQ && typeof storedFilePathQ === 'string') {
          return storedFilePathQ;
        }
        if (storedFilenameQ && typeof storedFilenameQ === 'string') {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          return path.join(uploadsDir, storedFilenameQ);
        }
      } catch (innerErr3) {
        this.logger.warn(`Pinecone query (by id) failed for ${cvId}: ${String(innerErr3)}`);
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching file path for CV ${cvId} from Pinecone:`, error);
      return null;
    }
  }

  /**
   * Persist and retrieve a simple local JSON mapping to avoid relying solely on Pinecone
   */
  private get mappingFilePath(): string {
    const dataDir = path.join(process.cwd(), 'uploads');
    return path.join(dataDir, 'cv-filemap.json');
  }

  private async saveFileMapping(id: string, filePath: string): Promise<void> {
    try {
      const fsPromises = fs.promises;
      const mapPath = this.mappingFilePath;
      let map: Record<string, string> = {};
      try {
        const existing = await fsPromises.readFile(mapPath, 'utf8');
        map = JSON.parse(existing);
      } catch (_) {
        map = {};
      }
      map[id] = filePath;
      await fsPromises.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf8');
    } catch (err) {
      this.logger.warn(`Failed to persist file mapping for ${id}: ${String(err)}`);
    }
  }

  async getFilePathFromLocalMap(id: string): Promise<string | null> {
    try {
      const fsPromises = fs.promises;
      const mapPath = this.mappingFilePath;
      const content = await fsPromises.readFile(mapPath, 'utf8');
      const map = JSON.parse(content) as Record<string, string>;
      return typeof map[id] === 'string' ? map[id] : null;
    } catch (_err) {
      return null;
    }
  }

  private formatEducationToString(education: unknown): string | undefined {
    try {
      if (education === null || education === undefined) return undefined;
      if (typeof education === 'string') return education;
      if (Array.isArray(education)) {
        // If array of strings or objects, join into a single string summary
        const parts = education
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>;
              const fields = ['degree', 'program', 'major', 'university', 'institution', 'year', 'graduationYear'];
              const tokens = fields
                .map((f) => (typeof obj[f] === 'string' || typeof obj[f] === 'number' ? String(obj[f]) : ''))
                .filter(Boolean);
              return tokens.join(', ');
            }
            return '';
          })
          .filter(Boolean);
        return parts.join(' | ');
      }
      if (typeof education === 'object') {
        const obj = education as Record<string, unknown>;
        const fields = ['degree', 'program', 'major', 'university', 'institution', 'year', 'graduationYear'];
        const tokens = fields
          .map((f) => (typeof obj[f] === 'string' || typeof obj[f] === 'number' ? String(obj[f]) : ''))
          .filter(Boolean);
        const joined = tokens.join(', ');
        return joined.length > 0 ? joined : undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private ensureStringArray(value: unknown): string[] | undefined {
    if (!value) return undefined;
    try {
      if (Array.isArray(value)) {
        const arr = value
          .map((v) => (typeof v === 'string' ? v : v && typeof v === 'object' && 'toString' in v ? String(v) : ''))
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        return arr.length > 0 ? arr : undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        // Split comma/pipe separated strings into array
        const parts = trimmed.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
        return parts.length > 0 ? parts : [trimmed];
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
} 