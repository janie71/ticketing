-- Database 생성
CREATE DATABASE ticket_system;

-- 연결
\c ticket_system;

-- 1. bands 테이블 (곡/팀 정보)
CREATE TABLE bands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. reservations 테이블 (예약 정보)
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    band_id INTEGER REFERENCES bands(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, start_time)
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_band_id ON reservations(band_id);

-- 3. settings 테이블 (관리자 설정)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 초기 설정 데이터
INSERT INTO settings (key, value) VALUES 
('reservation_open_time', '2025-11-11 00:00:00'),
('is_reservation_open', 'false');

-- 4. blocked_times 테이블 (예약 불가 시간)
CREATE TABLE blocked_times (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(200)
);

-- 5. visible_dates 테이블 (공개된 날짜)
CREATE TABLE visible_dates (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    week_number INTEGER NOT NULL
);

-- 테스트 데이터 (선택사항)
INSERT INTO bands (name, color) VALUES 
('밴드A', '#FF5733'),
('밴드B', '#3498DB'),
('밴드C', '#2ECC71');

INSERT INTO reservations (band_id, date, start_time, end_time) VALUES 
(1, '2025-11-11', '14:00', '14:30'),
(2, '2025-11-11', '15:00', '15:30'),
(3, '2025-11-11', '16:00', '16:30');