-- =============================================================================
-- MFILM RELATIONAL DATABASE SCHEMA (PostgreSQL 16)
-- Converted and Normalized from Firestore Collections
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Reference: Sex
CREATE TABLE IF NOT EXISTS sex (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

INSERT INTO sex (id, name) VALUES
    ('male', 'Nam'),
    ('female', 'Nữ'),
    ('other', 'Khác')
ON CONFLICT (id) DO NOTHING;

-- 2. Reference: Countries
CREATE TABLE IF NOT EXISTS countries (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    img_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscription Plans & Features
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_features (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    plan_id VARCHAR(50) REFERENCES plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS plan_packages (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    plan_id VARCHAR(50) REFERENCES plans(id) ON DELETE CASCADE,
    discount NUMERIC(5, 2) DEFAULT 0.00,
    duration_months INT NOT NULL DEFAULT 1
);

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY, -- Firebase UID or UUID
    name VARCHAR(150),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    date_of_birth DATE,
    role VARCHAR(30) NOT NULL DEFAULT 'user', -- 'user', 'admin', 'vip'
    avatar_url TEXT,
    sex_id VARCHAR(50) REFERENCES sex(id) ON DELETE SET NULL,
    gender VARCHAR(30),
    plan_id VARCHAR(50) REFERENCES plans(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. Categories & Types
CREATE TABLE IF NOT EXISTS category_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 6. People: Actors, Authors, Characters
CREATE TABLE IF NOT EXISTS actors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    img_url TEXT,
    description TEXT,
    country_id VARCHAR(50) REFERENCES countries(id) ON DELETE SET NULL,
    sex_id VARCHAR(50) REFERENCES sex(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS authors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    img_url TEXT,
    description TEXT,
    country_id VARCHAR(50) REFERENCES countries(id) ON DELETE SET NULL,
    sex_id VARCHAR(50) REFERENCES sex(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS characters (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    img_url TEXT,
    description TEXT,
    country_id VARCHAR(50) REFERENCES countries(id) ON DELETE SET NULL,
    sex_id VARCHAR(50) REFERENCES sex(id) ON DELETE SET NULL
);

-- 7. Movies Core
CREATE TABLE IF NOT EXISTS movies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    other_name VARCHAR(255),
    description TEXT,
    img_url TEXT,
    banner_url TEXT,
    trailer_url TEXT,
    duration INT DEFAULT 0,
    views BIGINT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 0.00,
    end_episode INT DEFAULT 0,
    category_type_id VARCHAR(50) REFERENCES category_types(id) ON DELETE SET NULL,
    country_id VARCHAR(50) REFERENCES countries(id) ON DELETE SET NULL,
    plan_id VARCHAR(50) REFERENCES plans(id) ON DELETE SET NULL,
    rent_price NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Đang chiếu',
    production_year INT,
    release_year INT,
    age_rating VARCHAR(20) DEFAULT 'P',
    is_hot BOOLEAN DEFAULT false,
    has_sub BOOLEAN DEFAULT false,
    has_dub BOOLEAN DEFAULT false,
    has_voice BOOLEAN DEFAULT false,
    episode_sub INT DEFAULT 0,
    episode_dub INT DEFAULT 0,
    episode_voice INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_views ON movies(views DESC);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_is_hot ON movies(is_hot);

-- Junction tables for Movie Many-to-Many
CREATE TABLE IF NOT EXISTS movie_categories (
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, category_id)
);

CREATE TABLE IF NOT EXISTS movie_actors (
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    actor_id VARCHAR(100) REFERENCES actors(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, actor_id)
);

CREATE TABLE IF NOT EXISTS movie_authors (
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    author_id VARCHAR(100) REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, author_id)
);

CREATE TABLE IF NOT EXISTS movie_characters (
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    character_id VARCHAR(100) REFERENCES characters(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, character_id)
);

-- 8. Episodes
CREATE TABLE IF NOT EXISTS episodes (
    id VARCHAR(100) PRIMARY KEY,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    number_episode INT NOT NULL,
    title VARCHAR(255),
    stream_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_episodes_movie_number ON episodes(movie_id, number_episode);

-- 9. ShowTimes (Phim chiếu rạp / Lịch chiếu)
CREATE TABLE IF NOT EXISTS show_times (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    show_time TIMESTAMP WITH TIME ZONE NOT NULL,
    room_name VARCHAR(100) NOT NULL
);

-- 10. User Interactions: Favorites, Folders & Saved Movies
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_favorite UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_saves (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    folder_id VARCHAR(100) NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_folder_movie UNIQUE(folder_id, movie_id)
);

-- 11. Watch History
CREATE TABLE IF NOT EXISTS watch_histories (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    episode_id VARCHAR(100) REFERENCES episodes(id) ON DELETE SET NULL,
    progress_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_history UNIQUE(user_id, movie_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_histories(user_id, updated_at DESC);

-- 12. Community: Reviews & Comments
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rate NUMERIC(2, 1) NOT NULL CHECK (rate >= 0 AND rate <= 10),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_movie ON reviews(movie_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id VARCHAR(100) REFERENCES comments(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_movie ON comments(movie_id, created_at DESC);

-- 13. Financial: Rent Movies & Subscriptions
CREATE TABLE IF NOT EXISTS rent_movies (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    transaction_id VARCHAR(150),
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) DEFAULT 'paypal',
    price NUMERIC(12, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rent_movies_user ON rent_movies(user_id, status);

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    transaction_id VARCHAR(150),
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) DEFAULT 'paypal',
    price NUMERIC(12, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

-- 14. Topics & Smart Recommendations
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    icon VARCHAR(100),
    gradient VARCHAR(150),
    is_smart BOOLEAN DEFAULT false,
    smart_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS topic_movies (
    topic_id VARCHAR(100) REFERENCES topics(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, movie_id)
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- 16. Catalog Replication Jobs (Outbox & Reconciliation for Dual-Write)
CREATE TABLE IF NOT EXISTS catalog_replication_jobs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mutation_id VARCHAR(100) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    firestore_status VARCHAR(50) NOT NULL,
    postgres_status VARCHAR(50) NOT NULL,
    payload JSONB,
    retry_count INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cat_repl_status ON catalog_replication_jobs(postgres_status, retry_count);
CREATE INDEX IF NOT EXISTS idx_cat_repl_mutation ON catalog_replication_jobs(mutation_id);

-- 17. User Preferences (Non-financial UI/Notification Settings)
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(128) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Big Data Interaction Fact Table (Derived for Recommendations & Behavioral Analysis)
CREATE TABLE IF NOT EXISTS user_movie_interactions (
    user_id VARCHAR(128) NOT NULL,
    movie_id VARCHAR(100) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    view_count INT DEFAULT 0,
    play_count INT DEFAULT 0,
    watch_seconds INT DEFAULT 0,
    completion_rate NUMERIC(5, 4) DEFAULT 0.0000,
    complete_count INT DEFAULT 0,
    favorite BOOLEAN DEFAULT false,
    rating NUMERIC(3, 1) DEFAULT NULL,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_score NUMERIC(8, 2) DEFAULT 0.00,
    PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_user_movie_score ON user_movie_interactions(user_id, interaction_score DESC);
CREATE INDEX IF NOT EXISTS idx_movie_interaction_score ON user_movie_interactions(movie_id, interaction_score DESC);

