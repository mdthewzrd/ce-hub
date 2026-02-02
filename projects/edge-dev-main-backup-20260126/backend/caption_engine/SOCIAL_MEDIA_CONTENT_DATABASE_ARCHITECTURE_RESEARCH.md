# Social Media Content Management Database Architecture - Comprehensive Research Report

**Research Date:** 2026-01-01
**Focus:** Database architecture for social media automation content management systems
**Context:** Designing systems to manage scraped/referenced content and posted content with recommendation capabilities

---

## Executive Summary

This research synthesizes best practices from social media management platforms (Buffer, Hootsuite), recommendation system architecture, and content curation systems to provide comprehensive database design guidance for social media automation platforms.

### Key Findings:
1. **Dual-Database Pattern**: Successful platforms separate source content (discovered but not posted) from posted content (performance tracking)
2. **Metadata-Driven Architecture**: Rich metadata storage enables sophisticated recommendation algorithms
3. **Duplicate Detection Critical**: AI-powered deduplication frameworks essential for social media data
4. **Performance Over Normalization**: Read-optimized denormalized schemas preferred for recommendation queries
5. **Real-Time Scoring**: Streaming event processing for engagement tracking

---

## 1. Source Content Database Design

### Purpose
Store and manage content discovered through scraping, APIs, or user submission that hasn't been posted yet. This is your "content pool" or "content library."

### Core Table Structure

#### 1.1 Primary Content Table

```sql
CREATE TABLE source_content (
  -- Primary Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash VARCHAR(64) UNIQUE NOT NULL,  -- For duplicate detection

  -- Content References
  platform VARCHAR(50) NOT NULL,  -- 'youtube', 'tiktok', 'instagram', 'twitter'
  external_id VARCHAR(255) NOT NULL,  -- Platform-specific content ID
  content_url TEXT NOT NULL,

  -- Content Metadata
  content_type VARCHAR(50) NOT NULL,  -- 'video', 'image', 'text', 'carousel'
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  duration INT,  -- For videos (seconds)

  -- Engagement Metrics (Original Poster's Performance)
  original_views BIGINT,
  original_likes BIGINT,
  original_comments BIGINT,
  original_shares BIGINT,
  original_saves BIGINT,
  engagement_rate DECIMAL(5, 4),  -- Computed: (likes+comments+shares)/views
  engagement_velocity DECIMAL(10, 2),  -- Engagement per hour since post

  -- Source Account Information
  source_account_id VARCHAR(255) NOT NULL,
  source_account_username VARCHAR(255),
  source_account_followers BIGINT,
  source_account_verified BOOLEAN DEFAULT FALSE,
  source_account_authority_score DECIMAL(5, 2),  -- 0-100

  -- Categorization & Discovery
  category VARCHAR(100),  -- 'education', 'entertainment', 'tech', etc.
  themes JSONB,  -- Array of theme tags: ['ai', 'automation', 'productivity']
  keywords JSONB,  -- Extracted keywords with relevance scores
  sentiment_score DECIMAL(3, 2),  -- -1 to 1
  content_quality_score DECIMAL(5, 2),  -- AI-assessed quality 0-100

  -- Timestamps
  original_posted_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_valid_until TIMESTAMP WITH TIME ZONE,  -- For time-sensitive content

  -- Processing Status
  processing_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'analyzed', 'approved', 'rejected'
  duplicate_of UUID REFERENCES source_content(id),  -- If duplicate, link to original
  is_duplicate BOOLEAN DEFAULT FALSE,

  -- Recommendation Readiness
  analysis_complete BOOLEAN DEFAULT FALSE,
  embedding_vector VECTOR(1536),  -- For semantic similarity search
  relevance_score DECIMAL(5, 2),  -- For our specific audience

  -- Moderation & Compliance
  moderation_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'flagged', 'rejected'
  content_flags JSONB,  -- Any policy violations detected
  age_restriction BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB,  -- Flexible storage for platform-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_source_content_hash ON source_content(content_hash);
CREATE INDEX idx_source_content_platform ON source_content(platform);
CREATE INDEX idx_source_content_category ON source_content(category);
CREATE INDEX idx_source_content_engagement_rate ON source_content(engagement_rate DESC);
CREATE INDEX idx_source_content_source_account ON source_content(source_account_id);
CREATE INDEX idx_source_content_relevance_score ON source_content(relevance_score DESC);
CREATE INDEX idx_source_content_themes ON source_content USING GIN(themes);
CREATE INDEX idx_source_content_status ON source_content(processing_status, moderation_status);
CREATE INDEX idx_source_content_posted_at ON source_content(original_posted_at DESC);

-- Vector similarity index (if using pgvector)
CREATE INDEX idx_source_content_vector ON source_content USING ivfflat(embedding_vector vector_cosine_ops);
```

#### 1.2 Content Analysis Cache Table

```sql
CREATE TABLE content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES source_content(id) ON DELETE CASCADE,

  -- Analysis Results
  analysis_type VARCHAR(100) NOT NULL,  -- 'transcript', 'topics', 'entities', 'visual_analysis'
  analysis_provider VARCHAR(100),  -- 'openai', 'anthropic', 'custom'
  analysis_result JSONB NOT NULL,
  confidence_score DECIMAL(3, 2),

  -- Timestamps
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,  -- Cache expiration

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(content_id, analysis_type)
);

CREATE INDEX idx_content_analysis_content ON content_analysis(content_id);
CREATE INDEX idx_content_analysis_type ON content_analysis(analysis_type);
```

#### 1.3 Source Accounts Table

```sql
CREATE TABLE source_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Account Identification
  platform VARCHAR(50) NOT NULL,
  platform_account_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),

  -- Account Metrics
  followers_count BIGINT,
  following_count BIGINT,
  post_count INT,
  verified BOOLEAN DEFAULT FALSE,
  account_tier VARCHAR(50),  -- 'nano', 'micro', 'macro', 'mega'

  -- Performance Tracking
  avg_engagement_rate DECIMAL(5, 4),
  content_performance_score DECIMAL(5, 2),  -- 0-100 based on historical performance
  trust_score DECIMAL(5, 2),  -- 0-100 reliability/authenticity

  -- Categorization
  account_categories JSONB,  -- ['tech', 'education', 'news']
  content_themes JSONB,  -- Most common themes in their content

  -- Relationship to Our Account
  is_competitor BOOLEAN DEFAULT FALSE,
  is_partner BOOLEAN DEFAULT FALSE,
  partnership_tier VARCHAR(50),  -- NULL, 'basic', 'premium', 'exclusive'

  -- Monitoring
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_frequency INT DEFAULT 86400,  -- Seconds between scrapes
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(platform, platform_account_id)
);

CREATE INDEX idx_source_accounts_platform ON source_accounts(platform);
CREATE INDEX idx_source_accounts_performance ON source_accounts(content_performance_score DESC);
CREATE INDEX idx_source_accounts_tier ON source_accounts(account_tier);
```

---

## 2. Posted Content Database Design

### Purpose
Track content that has been posted to OUR accounts with performance metrics, learning data, and optimization insights.

### Core Table Structure

#### 2.1 Posted Content Table

```sql
CREATE TABLE posted_content (
  -- Primary Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to Source
  source_content_id UUID REFERENCES source_content(id),

  -- Our Post Details
  platform VARCHAR(50) NOT NULL,  -- Where WE posted it
  our_post_id VARCHAR(255) UNIQUE,  -- Platform's ID for our post
  our_post_url TEXT,

  -- Posting Context
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  posted_by VARCHAR(100),  -- 'automation', 'user', 'scheduled'
  posting_schedule_id UUID REFERENCES posting_schedules(id),

  -- Content Adaptations (if we modified original)
  adaptations JSONB,  -- {'caption_edited': true, 'thumbnail_changed': true}
  our_caption TEXT,
  our_hashtags JSONB,

  -- Distribution Strategy
  post_type VARCHAR(50),  -- 'repost', 'adaptation', 'inspired_by', 'original'
  attribution_type VARCHAR(50),  -- 'direct_credit', 'inspired_by', 'none'

  -- Initial Performance (24-48 hours)
  initial_views BIGINT DEFAULT 0,
  initial_likes BIGINT DEFAULT 0,
  initial_comments BIGINT DEFAULT 0,
  initial_shares BIGINT DEFAULT 0,
  initial_saves BIGINT DEFAULT 0,
  initial_engagement_rate DECIMAL(5, 4),

  -- Current Performance (Lifetime)
  current_views BIGINT DEFAULT 0,
  current_likes BIGINT DEFAULT 0,
  current_comments BIGINT DEFAULT 0,
  current_shares BIGINT DEFAULT 0,
  current_saves BIGINT DEFAULT 0,
  current_engagement_rate DECIMAL(5, 4),

  -- Velocity Metrics
  views_per_hour DECIMAL(10, 2),
  likes_per_hour DECIMAL(10, 2),
  comments_per_hour DECIMAL(10, 2),

  -- Performance Scoring
  performance_score DECIMAL(5, 2),  -- 0-100 based on our account benchmarks
  viral_coefficient DECIMAL(5, 4),  -- shares/views ratio
  retention_rate DECIMAL(5, 4),  -- completion rate for videos

  -- Audience Insights
  audience_demographics JSONB,  -- Age, location, interests from platform analytics
  peak_engagement_time TIME,  -- When this content got most engagement
  best_performing_day VARCHAR(20),  -- Day of week

  -- Comparison to Source
  outperformed_source BOOLEAN,
  performance_ratio DECIMAL(5, 2),  -- Our engagement / Source engagement

  -- Monetization (if applicable)
  revenue_generated DECIMAL(10, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 4),

  -- Status & Lifecycle
  post_status VARCHAR(50) DEFAULT 'active',  -- 'active', 'archived', 'deleted', 'flagged'
  evergreen_score DECIMAL(5, 2),  -- Long-term value 0-100
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Learning Data
  ml_features JSONB,  -- Features used for ML prediction
  prediction_accuracy DECIMAL(5, 2),  -- How accurate was our performance prediction

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_posted_content_source ON posted_content(source_content_id);
CREATE INDEX idx_posted_content_platform ON posted_content(platform);
CREATE INDEX idx_posted_content_posted_at ON posted_content(posted_at DESC);
CREATE INDEX idx_posted_content_performance ON posted_content(performance_score DESC);
CREATE INDEX idx_posted_content_viral ON posted_content(viral_coefficient DESC);
CREATE INDEX idx_posted_content_evergreen ON posted_content(evergreen_score DESC);
CREATE INDEX idx_posted_content_status ON posted_content(post_status);

-- Composite index for common queries
CREATE INDEX idx_posted_content_platform_performance ON posted_content(platform, performance_score DESC, posted_at DESC);
```

#### 2.2 Engagement Timeline Table

```sql
CREATE TABLE engagement_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_content_id UUID NOT NULL REFERENCES posted_content(id) ON DELETE CASCADE,

  -- Snapshot Data
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hours_since_post INT NOT NULL,

  -- Engagement Metrics at this point
  views BIGINT NOT NULL,
  likes BIGINT NOT NULL,
  comments BIGINT NOT NULL,
  shares BIGINT NOT NULL,
  saves BIGINT NOT NULL,

  -- Calculated Metrics
  engagement_rate DECIMAL(5, 4),
  growth_rate DECIMAL(10, 2),  -- Change since last snapshot

  UNIQUE(posted_content_id, hours_since_post)
);

CREATE INDEX idx_engagement_timeline_content ON engagement_timeline(posted_content_id);
CREATE INDEX idx_engagement_timeline_recorded ON engagement_timeline(recorded_at DESC);
CREATE INDEX idx_engagement_timeline_hours ON engagement_timeline(hours_since_post);
```

#### 2.3 Content Experiments Table

```sql
CREATE TABLE content_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Experiment Design
  experiment_name VARCHAR(255) NOT NULL,
  hypothesis TEXT,
  experiment_type VARCHAR(100),  -- 'caption_variants', 'posting_time', 'thumbnail_test'

  -- Content Variants
  control_content_id UUID REFERENCES posted_content(id),
  variant_content_ids JSONB NOT NULL,  -- Array of posted_content UUIDs

  -- Experiment Timeline
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_hours INT,

  -- Results
  statistical_significance DECIMAL(5, 4),
  winner_variant_id UUID REFERENCES posted_content(id),
  lift_percentage DECIMAL(5, 2),
  confidence_interval JSONB,

  -- Insights
  key_learnings TEXT,
  recommendations JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'running',  -- 'running', 'completed', 'inconclusive'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_experiments_type ON content_experiments(experiment_type);
CREATE INDEX idx_experiments_status ON content_experiments(status);
CREATE INDEX idx_experiments_dates ON content_experiments(started_at DESC);
```

---

## 3. Relationship Architecture

### 3.1 Foreign Key Relationships

```
source_accounts (1) ──< (N) source_content

source_content (1) ──< (N) posted_content
                         |
                         └──< (N) engagement_timeline

source_content (1) ──< (N) content_analysis

posting_schedules (1) ──< (N) posted_content

content_experiments (1) ──< (N) posted_content (control)
content_experiments (1) ──< (N) posted_content (variants)
```

### 3.2 Relationship Table: Content Relationships

```sql
CREATE TABLE content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship Definition
  relationship_type VARCHAR(50) NOT NULL,  -- 'similar_to', 'sequel_to', 'response_to', 'inspired_by'
  from_content_id UUID NOT NULL REFERENCES source_content(id) ON DELETE CASCADE,
  to_content_id UUID NOT NULL REFERENCES source_content(id) ON DELETE CASCADE,

  -- Relationship Strength
  similarity_score DECIMAL(3, 2),  -- 0 to 1
  relationship_confidence DECIMAL(3, 2),

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(from_content_id, to_content_id, relationship_type),
  CHECK (from_content_id != to_content_id)
);

CREATE INDEX idx_content_relationships_from ON content_relationships(from_content_id);
CREATE INDEX idx_content_relationships_to ON content_relationships(to_content_id);
CREATE INDEX idx_content_relationships_type ON content_relationships(relationship_type);
CREATE INDEX idx_content_relationships_similarity ON content_relationships(similarity_score DESC);
```

### 3.3 Relationship Table: Posted Performance Learning

```sql
CREATE TABLE posted_performance_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linking Source to Posted
  source_content_id UUID NOT NULL REFERENCES source_content(id),
  posted_content_id UUID NOT NULL REFERENCES posted_content(id),

  -- Learning Metrics
  -- How well did source metrics predict posted performance?
  source_engagement_correlation DECIMAL(5, 2),  -- Correlation coefficient
  source_authority_correlation DECIMAL(5, 2),
  theme_performance_correlation DECIMAL(5, 2),

  -- Prediction Accuracy
  predicted_performance DECIMAL(5, 2),
  actual_performance DECIMAL(5, 2),
  prediction_error DECIMAL(5, 2),

  -- Attribution
  which_source_metrics_mattered JSONB,  -- Feature importance
  which_factors_were_different JSONB,  -- Context differences

  -- Insights
  lessons_learned TEXT,
  applicable_themes JSONB,  -- When this pattern applies

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(source_content_id, posted_content_id)
);

CREATE INDEX idx_learning_source ON posted_performance_learning(source_content_id);
CREATE INDEX idx_learning_posted ON posted_performance_learning(posted_content_id);
CREATE INDEX idx_learning_correlation ON posted_performance_learning(source_engagement_correlation DESC);
```

---

## 4. Recommendation & Scoring System Architecture

### 4.1 Content Recommendation Cache Table

```sql
CREATE TABLE content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recommendation Context
  recommendation_type VARCHAR(100) NOT NULL,  -- 'high_potential', 'trending', 'evergreen', 'audience_match'
  target_audience VARCHAR(100),  -- 'general', 'niche', 'test_segment'

  -- Content Being Recommended
  source_content_id UUID NOT NULL REFERENCES source_content(id),

  -- Scoring Breakdown
  total_score DECIMAL(5, 2) NOT NULL,

  -- Score Components (all weighted and summed)
  original_engagement_score DECIMAL(5, 2),  -- Based on source performance
  source_authority_score DECIMAL(5, 2),  -- Account credibility
  content_quality_score DECIMAL(5, 2),  -- AI-assessed quality
  audience_match_score DECIMAL(5, 2),  -- How well matches our audience
  freshness_score DECIMAL(5, 2),  -- Recency bonus
  uniqueness_score DECIMAL(5, 2),  -- How different from recent posts
  trend_alignment_score DECIMAL(5, 2),  -- Alignment with current trends
  historical_pattern_score DECIMAL(5, 2),  -- Similar content performance

  -- Metadata
  score_weights JSONB,  -- How each component was weighted
  confidence_level DECIMAL(3, 2),  -- 0 to 1
  recommendation_reason TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'posted'
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Validity
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  UNIQUE(source_content_id, recommendation_type, target_audience)
);

CREATE INDEX idx_recommendations_score ON content_recommendations(total_score DESC);
CREATE INDEX idx_recommendations_type ON content_recommendations(recommendation_type);
CREATE INDEX idx_recommendations_status ON content_recommendations(status);
CREATE INDEX idx_recommendations_validity ON content_recommendations(valid_until);

-- Composite index for pending queue
CREATE INDEX idx_recommendations_pending ON content_recommendations(status, total_score DESC) WHERE status = 'pending';
```

### 4.2 Scoring Algorithm Configuration Table

```sql
CREATE TABLE scoring_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration Details
  config_name VARCHAR(255) NOT NULL UNIQUE,
  config_type VARCHAR(100) NOT NULL,  -- 'recommendation', 'quality', 'engagement_prediction'

  -- Weight Configuration
  weights JSONB NOT NULL,  -- Component weights
  thresholds JSONB,  -- Minimum/maximum values
  multipliers JSONB,  -- Special case multipliers

  -- Model Parameters
  model_version VARCHAR(100),
  algorithm_type VARCHAR(100),  -- 'linear', 'ml', 'ensemble'
  hyperparameters JSONB,

  -- Performance Tracking
  accuracy_metrics JSONB,  -- Historical performance
  last_calibrated_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scoring_config_active ON scoring_configurations(is_active) WHERE is_active = TRUE;
```

### 4.3 Real-Time Scoring Materialized View

```sql
CREATE MATERIALIZED VIEW content_recommendation_dashboard AS
SELECT
  sc.id,
  sc.platform,
  sc.content_type,
  sc.category,
  sc.themes,
  sc.original_engagement_rate,
  sc.engagement_velocity,
  sc.source_account_authority_score,
  sc.content_quality_score,
  sc.relevance_score,
  sc.scraped_at,

  -- Calculate real-time recommendation score
  (
    (sc.original_engagement_rate * 0.25) +
    (sc.source_account_authority_score / 100 * 0.15) +
    (sc.content_quality_score / 100 * 0.20) +
    (sc.relevance_score / 100 * 0.25) +
    -- Recency bonus (content < 7 days old gets 0.15, else 0)
    CASE
      WHEN sc.scraped_at > NOW() - INTERVAL '7 days' THEN 0.15
      ELSE 0
    END
  ) * 100 AS recommendation_score,

  -- Count how many times we've posted similar content
  COALESCE(pc.similar_post_count, 0) as times_posted_similar,

  -- Last time we posted content from this category
  COALESCE(lc.last_posted_in_category, NOW() - INTERVAL '365 days') as last_category_post

FROM source_content sc
LEFT JOIN (
  SELECT
    sc2.category,
    COUNT(*) as similar_post_count
  FROM posted_content pc
  JOIN source_content sc2 ON pc.source_content_id = sc2.id
  WHERE pc.posted_at > NOW() - INTERVAL '30 days'
  GROUP BY sc2.category
) pc ON sc.category = pc.category
LEFT JOIN (
  SELECT
    sc3.category,
    MAX(pc.posted_at) as last_posted_in_category
  FROM posted_content pc
  JOIN source_content sc3 ON pc.source_content_id = sc3.id
  GROUP BY sc3.category
) lc ON sc.category = lc.category

WHERE sc.processing_status = 'analyzed'
  AND sc.moderation_status = 'approved'
  AND sc.analysis_complete = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM posted_content pc2
    WHERE pc2.source_content_id = sc.id
  );

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_content_recommendation_dashboard_refresh ON content_recommendation_dashboard(id);

-- Create indexes for common query patterns
CREATE INDEX idx_content_recommendation_dashboard_score ON content_recommendation_dashboard(recommendation_score DESC);
CREATE INDEX idx_content_recommendation_dashboard_category ON content_recommendation_dashboard(category, recommendation_score DESC);
CREATE INDEX idx_content_recommendation_dashboard_themes ON content_recommendation_dashboard USING GIN(themes);

-- Refresh schedule (run via cron or application)
-- REFRESH MATERIALIZED VIEW content_recommendation_dashboard;
```

---

## 5. Duplicate Detection & Prevention Strategy

### 5.1 Multi-Layered Deduplication Approach

Based on research into social media deduplication frameworks, implement a multi-stage approach:

#### Stage 1: Pre-Insert Hash Check
```sql
-- Before inserting new source content
CREATE OR REPLACE FUNCTION check_duplicate_content(
  p_content_url TEXT,
  p_content_hash VARCHAR(64)
) RETURNS TABLE (is_duplicate BOOLEAN, duplicate_id UUID) AS $$
BEGIN
  -- Exact hash match
  RETURN QUERY
  SELECT
    TRUE as is_duplicate,
    id as duplicate_id
  FROM source_content
  WHERE content_hash = p_content_hash;

  -- If no exact match, return not duplicate
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### Stage 2: Similarity Detection (Using Embeddings)
```sql
-- Find semantically similar content using vector similarity
CREATE OR REPLACE FUNCTION find_similar_content(
  p_embedding_vector VECTOR(1536),
  p_threshold DECIMAL DEFAULT 0.95,
  p_limit INT DEFAULT 10
) RETURNS TABLE (
  similar_content_id UUID,
  similarity_score DECIMAL,
  content_url TEXT,
  title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id as similar_content_id,
    1 - (sc.embedding_vector <=> p_embedding_vector) as similarity_score,
    sc.content_url,
    sc.title
  FROM source_content sc
  WHERE sc.embedding_vector IS NOT NULL
    AND (1 - (sc.embedding_vector <=> p_embedding_vector)) > p_threshold
  ORDER BY sc.embedding_vector <=> p_embedding_vector
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

#### Stage 3: Cross-Platform Deduplication
```sql
-- Track same content across different platforms
CREATE TABLE content_cross_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_content_id UUID NOT NULL REFERENCES source_content(id),
  platform VARCHAR(50) NOT NULL,
  platform_content_id VARCHAR(255) NOT NULL,
  content_url TEXT NOT NULL,
  confidence_score DECIMAL(3, 2),  -- How sure are we it's the same content
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(platform, platform_content_id)
);

CREATE INDEX idx_cross_references_canonical ON content_cross_references(canonical_content_id);
CREATE INDEX idx_cross_references_platform ON content_cross_references(platform);
```

### 5.2 Duplicate Detection Pipeline

```
1. INGEST CONTENT
   ↓
2. COMPUTE CONTENT HASH (SHA-256 of content URL + key metadata)
   ↓
3. CHECK EXACT HASH MATCH
   ├─ MATCH → Mark as duplicate, link to original, SKIP
   └─ NO MATCH → Continue
   ↓
4. GENERATE EMBEDDING VECTOR
   ↓
5. VECTOR SIMILARITY SEARCH (threshold: 0.95)
   ├─ SIMILAR FOUND → Human review → Approve/Merge
   └─ NO SIMILAR → Continue
   ↓
6. INSERT AS NEW CONTENT
   ↓
7. SCHEDULE PERIODIC RE-SCAN (catch duplicates added later)
```

---

## 6. Performance Optimization Strategies

### 6.1 Database vs. Caching Strategy

#### Hot Data (Redis Cache)
- Real-time engagement counts
- Session-based recommendation queues
- Rate limiting counters
- Active posting locks

#### Warm Data (PostgreSQL with Materialized Views)
- Content recommendations (refresh every 5-15 minutes)
- Performance dashboards (refresh every hour)
- Trending content lists (refresh every 30 minutes)

#### Cold Data (PostgreSQL with Archival)
- Historical engagement data
- Old posted content (> 6 months)
- Raw scraping logs

### 6.2 Partitioning Strategy

```sql
-- Partition posted_content by posted_at (monthly partitions)
CREATE TABLE posted_content (
  -- ... same structure as above ...
) PARTITION BY RANGE (posted_at);

-- Create partitions
CREATE TABLE posted_content_2025_01 PARTITION OF posted_content
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE posted_content_2025_02 PARTITION OF posted_content
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Archive old partitions to cheaper storage
--ALTER TABLE posted_content DETACH PARTITION posted_content_2024_01;
```

### 6.3 Denormalization vs Normalization Trade-offs

**DENORMALIZE (Read Optimization):**
- Engagement metrics on source_content (don't join to posted_content for basic queries)
- Account statistics on source_accounts (don't aggregate on every query)
- Recommendation scores (pre-calculated, not computed on-the-fly)

**NORMALIZE (Write Optimization):**
- Content relationships (avoid circular dependencies)
- Experiments (keep variants flexible)
- Analysis results (cache separately, don't embed in main table)

### 6.4 Index Strategy

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_source_content_hot_candidates ON source_content(
  category,
  processing_status,
  moderation_status,
  engagement_rate DESC,
  scraped_at DESC
) WHERE
  processing_status = 'analyzed' AND
  moderation_status = 'approved';

-- Partial indexes for filtering
CREATE INDEX idx_source_content_unposted ON source_content(id)
WHERE NOT EXISTS (
  SELECT 1 FROM posted_content pc WHERE pc.source_content_id = source_content.id
);

-- Covering indexes to avoid table lookups
CREATE INDEX idx_source_content_covering ON source_content(
  platform,
  category,
  engagement_rate,
  source_account_id,
  scraped_at
) INCLUDE (title, content_url, thumbnail_url);
```

---

## 7. Real-World Platform Architecture Insights

### 7.1 Buffer's Architecture (from research)

**Key Technologies:**
- **Language**: Ruby on Rails
- **Database**: PostgreSQL with Redshift for analytics (500M+ records)
- **Queues**: Sidekiq for background processing
- **Analytics**: Looker for dashboards
- **Big Data**: Hadoop for large-scale data processing

**Architecture Patterns:**
1. **Write-Through Cache**: Redis sits in front of PostgreSQL for hot data
2. **Analytics Pipeline**: Separate data warehouse for heavy analytics queries
3. **Async Processing**: All non-critical operations happen in background jobs
4. **API-First Design**: All services exposed through RESTful APIs

### 7.2 Hootsuite's Architecture (from research)

**Key Technologies:**
- **Language**: PHP (legacy), moving to microservices
- **Database**: MySQL for OLTP, MongoDB for flexible schema data
- **Architecture**: Microservices with event-driven communication
- **Search**: Elasticsearch for content discovery
- **Message Queue**: Kafka for real-time data streaming

**Architecture Patterns:**
1. **Microservices**: Separate services for publishing, analytics, scheduling
2. **Event Sourcing**: Kafka streams all platform events
3. **Multi-Database**: Use right tool for right job (relational + document + search)
4. **API Gateway**: Single entry point routing to appropriate service

### 7.3 Modern Recommendation System Architecture

**Components:**
1. **Candidate Generation** (Fast, millions of items)
   - Content-based filtering: Similar to what you've posted before
   - Collaborative filtering: What similar accounts post
   - Trending: What's performing well overall

2. **Scoring Layer** (Medium speed, thousands of items)
   - Machine learning model scores each candidate
   - Features: content metadata, source metrics, historical patterns
   - Output: Ranked list with confidence scores

3. **Re-ranking** (Slow, dozens of items)
   - Business rules: Don't post same category twice in a row
   - Diversity: Ensure variety in content types
   - Freshness: Boost newer content
   - Final output: Top N recommendations

**Data Flow:**
```
Source Content (PostgreSQL)
  → Candidate Generation (Redis + ML Features)
  → Scoring (Python ML Service)
  → Re-ranking (Application Logic)
  → Recommendation Cache (Redis)
  → User Dashboard
```

---

## 8. Implementation Roadmap

### Phase 1: Core Schema (Week 1-2)
- [ ] Create source_content table with basic fields
- [ ] Create posted_content table with basic fields
- [ ] Implement content_hash duplicate detection
- [ ] Set up basic indexes

### Phase 2: Metadata & Analysis (Week 3-4)
- [ ] Add content_analysis table
- [ ] Implement embedding vector storage
- [ ] Add source_accounts tracking
- [ ] Set up content categorization fields

### Phase 3: Relationship Tracking (Week 5-6)
- [ ] Create content_relationships table
- [ ] Implement posted_performance_learning
- [ ] Add engagement_timeline tracking
- [ ] Set up foreign key relationships

### Phase 4: Recommendation Engine (Week 7-8)
- [ ] Create content_recommendations table
- [ ] Implement scoring configuration
- [ ] Build materialized view for recommendations
- [ ] Set up automated scoring pipeline

### Phase 5: Optimization & Scale (Week 9-10)
- [ ] Implement table partitioning
- [ ] Set up Redis caching layer
- [ ] Optimize indexes based on query patterns
- [ ] Implement archival strategy

---

## 9. Sample Queries

### 9.1 Get Top Content Recommendations

```sql
SELECT
  id,
  platform,
  content_type,
  category,
  title,
  content_url,
  thumbnail_url,
  original_engagement_rate,
  source_account_username,
  source_account_followers,
  recommendation_score,
  times_posted_similar,
  last_category_post
FROM content_recommendation_dashboard
WHERE recommendation_score > 70
  -- Ensure variety in categories
  AND last_category_post < NOW() - INTERVAL '3 days'
  -- Don't over-post from same category
  AND times_posted_similar < 3
ORDER BY recommendation_score DESC, scraped_at DESC
LIMIT 20;
```

### 9.2 Find Content by Theme Trending

```sql
SELECT
  sc.id,
  sc.title,
  sc.content_url,
  sc.themes,
  sc.original_engagement_rate,
  AVG(pc.performance_score) as avg_performance_for_theme,
  COUNT(pc.id) as times_we_posted_this_theme
FROM source_content sc
LEFT JOIN posted_content pc ON pc.source_content_id = sc.id
CROSS JOIN LATERAL jsonb_array_elements_text(sc.themes) AS theme
WHERE theme = 'ai_automation'  -- Your target theme
  AND sc.processing_status = 'analyzed'
  AND sc.moderation_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM posted_content
    WHERE source_content_id = sc.id
  )
GROUP BY sc.id, sc.title, sc.content_url, sc.themes, sc.original_engagement_rate
ORDER BY avg_performance_for_theme DESC NULLS LAST, sc.original_engagement_rate DESC
LIMIT 10;
```

### 9.3 Track Content Performance Over Time

```sql
SELECT
  DATE(pc.posted_at) as post_date,
  sc.category,
  COUNT(*) as posts_count,
  AVG(pc.performance_score) as avg_performance,
  AVG(pc.initial_engagement_rate) as avg_initial_engagement,
  AVG(pc.current_engagement_rate) as avg_current_engagement,
  SUM(pc.current_views) as total_views
FROM posted_content pc
JOIN source_content sc ON pc.source_content_id = sc.id
WHERE pc.posted_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(pc.posted_at), sc.category
ORDER BY post_date DESC, avg_performance DESC;
```

### 9.4 Learning: What Source Metrics Predict Our Performance?

```sql
SELECT
  sc.category,
  sc.source_account_authority_score,
  AVG(sc.original_engagement_rate) as avg_source_engagement,
  AVG(pc.performance_score) as avg_our_performance,
  CORR(sc.original_engagement_rate, pc.performance_score) as engagement_correlation,
  CORR(sc.source_account_authority_score, pc.performance_score) as authority_correlation,
  COUNT(*) as sample_size
FROM posted_content pc
JOIN source_content sc ON pc.source_content_id = sc.id
WHERE pc.posted_at > NOW() - INTERVAL '90 days'
GROUP BY sc.category, sc.source_account_authority_score
HAVING COUNT(*) >= 3  -- Minimum sample size
ORDER BY avg_our_performance DESC;
```

---

## 10. Monitoring & Maintenance

### 10.1 Key Metrics to Track

**Database Health:**
- Query execution times (slow query log)
- Index usage statistics
- Table bloat and vacuum needs
- Cache hit rates (PostgreSQL + Redis)

**Data Quality:**
- Duplicate detection accuracy
- Analysis completion rate
- Embedding generation success rate
- Moderation backlog

**Recommendation Quality:**
- Prediction accuracy (predicted vs actual performance)
- Diversity of recommendations (category distribution)
- Freshness (age of recommended content)
- User acceptance rate (recommended → approved → posted)

### 10.2 Maintenance Tasks

**Daily:**
- Refresh materialized views
- Update engagement timeline snapshots
- Run duplicate detection on new content
- Generate fresh recommendations

**Weekly:**
- Analyze slow queries and optimize
- Review and update scoring weights
- Vacuum and analyze tables
- Archive old engagement data

**Monthly:**
- Review index effectiveness
- Analyze recommendation accuracy
- Update ML models with new data
- Partition maintenance (create new partitions, archive old)

---

## 11. Technology Stack Recommendations

### Primary Database
**PostgreSQL 16+**
- Vector similarity search (pgvector extension)
- JSONB for flexible metadata
- Materialized views for performance
- Excellent query optimizer
- Proven at scale (Buffer, Instagram, etc.)

### Caching Layer
**Redis 7+**
- Hot data caching
- Real-time counters
- Job queues (Sidekiq/Celery)
- Session storage
- Pub/Sub for real-time updates

### Analytics Database
**Choose one based on scale:**
- **PostgreSQL** (Small-Medium: < 1M rows)
- **TimescaleDB** (Medium-Large: time-series data)
- **ClickHouse** (Large: > 10M rows, column-oriented)

### Search & Discovery
**Elasticsearch or OpenSearch**
- Full-text search on captions/descriptions
- Aggregations and filtering
- Faceted search (by category, theme, platform)

### ML/AI Features
- **Python** with scikit-learn for basic ML
- **OpenAI/Anthropic APIs** for embeddings and content analysis
- **pgvector** for vector similarity in PostgreSQL
- **Airflow** or **Prefect** for ML pipeline orchestration

---

## 12. Common Pitfalls & Solutions

### Pitfall 1: Over-Normalization
**Problem**: Too many joins slow down recommendation queries
**Solution**: Denormalize hot data, use materialized views

### Pitfall 2: Ignoring Time Decay
**Problem**: Old content stays in recommendations forever
**Solution**: Add freshness scores, age-based filtering

### Pitfall 3: Duplicate Contamination
**Problem**: Duplicates skew performance metrics
**Solution**: Multi-stage deduplication, regular re-scanning

### Pitfall 4: Lack of Feedback Loop
**Problem**: System doesn't learn from posting performance
**Solution**: posted_performance_learning table, regular model retraining

### Pitfall 5: Monolithic Schema
**Problem**: One table tries to do everything
**Solution**: Separate concerns: source vs posted vs recommendations

### Pitfall 6: No Query Pattern Analysis
**Problem**: Indexes don't match actual usage
**Solution**: Log and analyze all queries, optimize indexes iteratively

---

## 13. Schema Migration Strategy

### Best Practices
1. **Version Control**: Store all migrations in version control
2. **Backward Compatible**: New columns should be nullable or have defaults
3. **Test First**: Run migrations on staging with production-like data
4. **Rollback Plan**: Write down migration scripts for rollback
5. **Zero Downtime**: Use online schema change tools (pg_repack, pg_squeeze)

### Example Migration
```sql
-- Migration: Add content quality scoring
-- Date: 2025-01-15
-- Author: System

BEGIN;

-- Add new columns (nullable for backward compatibility)
ALTER TABLE source_content
ADD COLUMN content_quality_score DECIMAL(5, 2),
ADD COLUMN analysis_complete BOOLEAN DEFAULT FALSE;

-- Add new index (CONCURRENTLY for zero downtime)
CREATE INDEX CONCURRENTLY idx_source_content_quality
ON source_content(content_quality_score DESC)
WHERE content_quality_score IS NOT NULL;

-- Backfill data for existing rows
UPDATE source_content
SET
  content_quality_score =
    CASE
      WHEN original_engagement_rate > 0.10 THEN 90
      WHEN original_engagement_rate > 0.05 THEN 75
      WHEN original_engagement_rate > 0.02 THEN 60
      ELSE 50
    END,
  analysis_complete = TRUE
WHERE content_quality_score IS NULL;

-- Now make columns NOT NULL (after backfill)
ALTER TABLE source_content
ALTER COLUMN content_quality_score SET NOT NULL,
ALTER COLUMN analysis_complete SET NOT NULL;

COMMIT;
```

---

## Sources & References

### Academic & Research Papers
1. [Databricks - How to Build an Online Recommendation System](https://www.databricks.com/blog/guide-to-building-online-recommendation-system)
2. [System Design Handbook - Recommendation System Design](https://www.systemdesignhandbook.com/guides/recommendation-system-design/)
3. [NVIDIA - Best Practices for Building and Deploying Recommender Systems](https://docs.nvidia.com/deeplearning/performance/recsys-best-practices/index.html)

### Database Architecture
4. [GeeksforGeeks - How to Design Database for Recommendation Systems](https://www.geeksforgeeks.org/dbms/how-to-design-database-for-recommendation-systems/)
5. [GeeksforGeeks - Designing a Database for Social Media Platform](https://www.geeksforgeeks.org/sql/how-to-design-database-for-social-media-platform/)
6. [Convex - Database Best Practices](https://docs.convex.dev/understanding/best-practices/)

### Social Media Platforms
7. [Buffer - Evolving Buffer's Data Architecture](https://buffer.com/resources/evolving-buffers-data-architecture/)
8. [Hootsuite Engineering Blog](https://medium.com/hootsuite-engineering)
9. [Sprout Social - 2024 Social Media Content Strategy Report](https://media.sproutsocial.com/uploads/2024/09/Network-Content-Strategy-Data-Report-Final.pdf)

### Duplicate Detection
10. [DagShub - Mastering Duplicate Data Management in Machine Learning](https://dagshub.com/blog/mastering-duplicate-data-management-in-machine-learning-for-optimal-model-performance/)
11. [Relevance AI - Duplicate Entry Detection AI Agents](https://relevanceai.com/agent-templates-tasks/duplicate-entry-detection)
12. [Orases - Solving Data Duplication Issues With Automation & AI](https://orases.com/blog/solving-data-duplication-issues-automation-ai/)

### Real-Time Systems
13. [Tinybird - Real-time Recommendation System Architecture](https://www.tinybird.co/blog/real-time-recommendation-system)
14. [Neo4j - Building a Recommendation Engine with Neo4j](https://neo4j.com/blog/developer/recommendation-engine-hands-on-1/)

### Content Management
15. [HubSpot - 16 website metrics to track for growth](https://blog.hubspot.com/website/engagement-metrics)
16. [Brandwell - How to Curate Content: A Comprehensive Guide](https://brandwell.ai/blog/how-to-curate-content/)
17. [IBM - What Is Data Curation?](https://www.ibm.com/think/topics/data-curation)

---

## Conclusion

This comprehensive database architecture provides a robust foundation for social media content management with the following key advantages:

1. **Scalability**: Designed to handle millions of content items with proper indexing and partitioning
2. **Intelligence**: Built-in learning from posted performance to improve recommendations
3. **Flexibility**: JSONB columns allow for evolving requirements without schema changes
4. **Performance**: Materialized views, caching, and denormalization ensure fast queries
5. **Quality**: Multi-layered duplicate detection and content analysis maintain data integrity
6. **Actionability**: Rich metadata enables sophisticated recommendation algorithms

The architecture follows proven patterns from successful social media platforms while incorporating modern approaches to recommendation systems and AI-powered content analysis.

---

**Next Steps:**
1. Review this architecture with your team
2. Identify specific requirements unique to your use case
3. Prioritize phases based on immediate needs
4. Set up development environment with PostgreSQL 16+ and pgvector
5. Begin with Phase 1 (Core Schema) and iterate based on actual usage patterns

**Document Version:** 1.0
**Last Updated:** 2026-01-01
**Maintained By:** CE-Hub Research Team
