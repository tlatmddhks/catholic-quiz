-- 가톨릭 퀴즈 인증/결과 테이블 생성
-- catholic_quiz DB에서 실행

USE [catholic_quiz];
GO

CREATE TABLE dbo.quiz_user (
    user_id       INT            NOT NULL PRIMARY KEY,
    username      NVARCHAR(100)  NOT NULL UNIQUE,
    password_hash NVARCHAR(200)  NOT NULL,
    nickname      NVARCHAR(100)  NULL,
    created_at    DATETIME2      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.quiz_session (
    session_id  NVARCHAR(64)   NOT NULL PRIMARY KEY,
    user_id     INT            NOT NULL REFERENCES dbo.quiz_user(user_id) ON DELETE CASCADE,
    expires_at  DATETIME2      NOT NULL
);
GO

CREATE INDEX idx_session_expires ON dbo.quiz_session(expires_at);
GO

CREATE TABLE dbo.quiz_result (
    result_id       INT         NOT NULL PRIMARY KEY,
    user_id         INT         NOT NULL REFERENCES dbo.quiz_user(user_id) ON DELETE CASCADE,
    mode            NVARCHAR(20) NOT NULL,
    lv              INT         NULL,
    score           INT         NOT NULL,
    total_questions INT         NOT NULL,
    correct_count   INT         NOT NULL,
    time_sec        INT         NULL,
    played_at       DATETIME2   NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_result_user ON dbo.quiz_result(user_id);
CREATE INDEX idx_result_mode ON dbo.quiz_result(mode);
GO
