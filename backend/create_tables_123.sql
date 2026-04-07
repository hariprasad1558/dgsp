-- Main Recommendations Table (required by backend)
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    recno INT,
    recommendation TEXT,
    actionedby TEXT,
    category VARCHAR(100),
    tablefields JSONB,
    status VARCHAR(50) DEFAULT 'Pending',
    details TEXT,
    data JSONB,
    last_updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation 1: Conferences
CREATE TABLE IF NOT EXISTS rec1_state_conferences (
    id SERIAL PRIMARY KEY,
    rec_id INT DEFAULT 1,
    conference_date DATE,
    participants TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rec1_district_conferences (
    id SERIAL PRIMARY KEY,
    rec_id INT DEFAULT 1,
    num_conferences INT,
    participants TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rec1_media (
    id SERIAL PRIMARY KEY,
    rec_id INT DEFAULT 1,
    section_name VARCHAR(255),
    media_url VARCHAR(2048),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation 2: Committees
CREATE TABLE IF NOT EXISTS rec2_committee_info (
    id SERIAL PRIMARY KEY,
    rec_id INT DEFAULT 2,
    committee_composition TEXT,
    innovative_ideas TEXT,
    competition_parameters TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS committee_implementation_details (
    id SERIAL PRIMARY KEY,
    committee_composition TEXT NOT NULL,
    innovative_ideas TEXT NOT NULL,
    competition_parameters TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation 3: Activist Profiling
CREATE TABLE IF NOT EXISTS rec3_activist_profiling (
    id SERIAL PRIMARY KEY,
    rec_id INT DEFAULT 3,
    ps_wise_count INT,
    monitoring_mechanism TEXT,
    positive_outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'Pending',
    details TEXT,
    data JSONB,
    last_updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ...existing code...
-- Recommendation 4 to 123: Generic structure
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 4..123 LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS rec%s_data (
            id SERIAL PRIMARY KEY,
            rec_id INT DEFAULT %s,
            info JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );', i, i);
    END LOOP;
END $$;
