-- 관리자 패널 추가 기능용 스키마
-- catholic_quiz DB에서 SSMS로 실행

USE [catholic_quiz];
GO

-- 1. 회원 차단 컬럼
ALTER TABLE dbo.quiz_user ADD is_blocked BIT NOT NULL DEFAULT 0;
GO

-- 2. 공지사항 테이블
CREATE TABLE dbo.quiz_notice (
  notice_id  INT           NOT NULL PRIMARY KEY IDENTITY(1,1),
  title      NVARCHAR(200) NOT NULL,
  content    NVARCHAR(MAX) NOT NULL,
  is_active  BIT           NOT NULL DEFAULT 1,
  created_at DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO
