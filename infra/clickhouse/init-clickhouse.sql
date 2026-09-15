-- =============================================================================
-- MFILM CLICKHOUSE ANALYTICS SCHEMA
-- Optimized Columnar Engine for Real-Time Streaming Events
-- =============================================================================

CREATE DATABASE IF NOT EXISTS mfilm_analytics;

USE mfilm_analytics;

-- 1. Main Streaming Events Raw Table
CREATE TABLE IF NOT EXISTS streaming_events (
    eventId UUID,
    eventType LowCardinality(String),
    eventVersion LowCardinality(String) DEFAULT '1',
    occurredAt DateTime64(3, 'UTC'),
    receivedAt DateTime64(3, 'UTC'),
    userId LowCardinality(String),
    sessionId String,
    movieId LowCardinality(String),
    episodeId LowCardinality(String),
    metadata String, -- JSON string containing event specific payload
    clientIp String DEFAULT '',
    userAgent String DEFAULT '',
    createdAt DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurredAt)
ORDER BY (eventType, toDate(occurredAt), movieId, userId, occurredAt)
TTL toDateTime(occurredAt) + INTERVAL 180 DAY
SETTINGS index_granularity = 8192;

-- 2. Real-time Aggregated Table: Hourly Movie Trends
CREATE TABLE IF NOT EXISTS hourly_movie_stats (
    hour DateTime,
    movieId String,
    views UInt64,
    completes UInt64,
    totalProgressSeconds UInt64,
    uniqueUsers AggregateFunction(uniq, String),
    bufferCount UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, movieId);

-- Materialized View feeding hourly_movie_stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hourly_movie_stats
TO hourly_movie_stats AS
SELECT
    toStartOfHour(occurredAt) AS hour,
    movieId,
    countIf(eventType = 'movie_view' OR eventType = 'play') AS views,
    countIf(eventType = 'complete') AS completes,
    sumIf(JSONExtractInt(metadata, 'progress'), eventType = 'watch_progress') AS totalProgressSeconds,
    uniqState(userId) AS uniqueUsers,
    countIf(eventType = 'buffer_start') AS bufferCount
FROM streaming_events
WHERE movieId != ''
GROUP BY hour, movieId;

-- 3. Real-time Aggregated Table: User Activity Summary
CREATE TABLE IF NOT EXISTS daily_user_stats (
    date Date,
    userId String,
    totalEvents UInt64,
    watchTimeSeconds UInt64,
    searchCount UInt64,
    uniqueMoviesWatched AggregateFunction(uniq, String)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, userId);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_user_stats
TO daily_user_stats AS
SELECT
    toDate(occurredAt) AS date,
    userId,
    count() AS totalEvents,
    sumIf(JSONExtractInt(metadata, 'watchDeltaSeconds'), eventType = 'watch_progress') AS watchTimeSeconds,
    countIf(eventType = 'search') AS searchCount,
    uniqState(movieId) AS uniqueMoviesWatched
FROM streaming_events
WHERE userId != ''
GROUP BY date, userId;
