-- 서브 관리자 테이블
-- catholic_quiz DB에서 SSMS로 실행

USE [catholic_quiz];
GO

CREATE TABLE dbo.quiz_admin (
  username    NVARCHAR(100) NOT NULL PRIMARY KEY,
  added_by    NVARCHAR(100) NOT NULL,
  created_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO
