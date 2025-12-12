VoiceOwl – Audio Transcription API A simple Node.js + TypeScript API

It  takes an audio URL, converts it into text (mock), and
saves it into MongoDB.

**Main Features**: - Mock or Azure transcription - MongoDB storage - Fetch

recent transcriptions - Health check

**Endpoints**: 
    GET / – API info

    GET /health – API health status

    POST /transcription – Mock transcription

    POST /azure-transcription – Azure transcription

    GET /transcriptions – Recent transcriptions

    GET /transcription/:id – Single transcription

MongoDB Model: _id, audioUrl, transcription, source, language,
createdAt, updatedAt

MongoDB Query & Indexing 

GET /transcriptions - Fetch transcriptions from the last 30 days
   Optimized Indexes for large datasets
   Pagination with limit & offset
   For 100M+ records:
       Use compound index { createdAt: -1, source: 1 }
       Partition collections by date (monthly)
       Use read replicas
       Add Redis caching for recent queries

Scaling to 10k+ Concurrent Requests

   Load balancing with Nginx or AWS ALB
   Multiple Node.js instances
   Redis cache for repeated queries
   Message queue (BullMQ/Redis) for heavy audio processing
   MongoDB Atlas with replica sets & sharding
   Docker + container orchestration

**Scaling Techniques**: - Auto-scaling based on CPU/memory - CDN caching for
faster responses - Async processing for long-running tasks - Queue
workers to reduce API load

## Scalability & System Design

**Architecture**: Client - Load Balancer - Node API - Redis Cache - MongoDB
Optional: Azure Speech for real transcription

**Security**: - Input validation - Rate limiting - CORS - Safe error
messages - Audio URL validation - File size limits

Tech: Node.js, TypeScript, MongoDB, Azure Speech, Jest

## Code Structure

### Directory Organization

src/
  config/            - database & environment setup
  controllers/       - route handlers
  middleware/        - validation, logging, error handling
  models/            - MongoDB schemas
  routes/            - API routes
  services/          - business logic (audio + transcription)
  types/             - TypeScript types
  index.ts           - app entry

tests/
  integration/       - API tests
  models/            - model tests
  services/          - service tests
  test-setup.ts 


### Architecture Patterns
Controllers - Services - Models
Middlewares for validation, logging, errors
Config files for environment settings
Clean folder separation for easy scaling

## Assumptions Made
Node.js 18+, MongoDB 5+
Azure Speech is optional
Audio files < 50MB
Supports MP3/WAV/MP4/M4A
No authentication, no rate limiting
English transcription by default
Local MongoDB for development

## Production Improvements

**Deployment**

Docker + Kubernetes
GitHub Actions CI/CD
Monitoring with Prometheus/Grafana
Better logging (Winston/ELK)
Security
Add JWT auth + RBAC
Redis rate limiting
Input sanitizatio
HTTPS + stricter CORS

**Performance**

Redis caching
Gzip compression
Async background jobs for transcription
Faster MongoDB queries

**Reliability**

Health checks
Retry logic + circuit breakers
Sentry error tracking
Load testing (k6/Artillery)

## MongoDB Indexing Notes

### Current Indexes

// Date-based queries (most important)
transcriptionSchema.index({ createdAt: -1 });

// Duplicate prevention
transcriptionSchema.index({ audioUrl: 1 });

// Source filtering with date sorting
transcriptionSchema.index({ source: 1, createdAt: -1 });


### Index Strategy for Scale
- **Primary Index**: `{ createdAt: -1 }` - Essential for date-range queries
- **Compound Index**: `{ source: 1, createdAt: -1 }` - For filtered queries
- **Sparse Indexes**: Only index documents with specific fields to save space
- **TTL Indexes**: Automatic cleanup of old records (optional)

### Index Maintenance
- **Background Creation**: Create indexes without blocking writes
- **Index Monitoring**: Track index usage and performance impact
- **Index Cleanup**: Remove unused indexes to reduce storage
- **Rebuilding**: Periodic index rebuilds during maintenance windows

### Query Optimization
- **Covered Queries**: Design indexes to cover frequently accessed fields
- **Index Intersection**: MongoDB can combine multiple indexes
- **Explain Plans**: Use `db.collection.explain()` to analyze query performance
- **Index Cardinality**: Prefer high-cardinality fields for better selectivity

## Scalability Notes

**Horizontal Scaling**

Load balancer (Nginx/AWS ALB)
Multiple Node.js instances
MongoDB sharding
Read replicas

**Vertical Scaling**
 Scale CPU/memory based on load patterns
 Provision adequate RAM for working set
 Use SSD storage for better I/O performance
 Ensure sufficient bandwidth for audio downloads


**Caching**
Redis for fast reads
MongoDB's built-in caching mechanisms
CDN for static assets

**Queue-Based Processing**
Move transcription to background workers
Redis-based queues for reliable task processing ny Bull mq

**Worker Pools**: Dedicated worker processes for CPU-intensive tasks
**Dead Letter Queues**: Handle failed tasks gracefully

### Database Scaling
- **Connection Pooling**: Efficient connection reuse
- **Query Optimization**: Index usage and query profiling
- **Data Partitioning**: Monthly collections for large datasets
- **Archival Strategy**: Move old data to cheaper storage

### Monitoring & Alerting
- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Database Metrics**: Connection counts, slow queries, lock waits
- **Business Metrics**: Transcription success rates, user activity
