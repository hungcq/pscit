package config

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDB() *gorm.DB {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s",
		AppConfig.DBHost,
		AppConfig.DBUser,
		AppConfig.DBPassword,
		AppConfig.DBName,
		AppConfig.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: &zapGormLogger{
			zap:      zap.L(),
			logLevel: logger.Info,
		},
	})
	if err != nil {
		zap.L().Fatal("Failed to connect to database:", zap.Error(err))
	}

	return db
}

// zapGormLogger wraps zap.Logger to satisfy GORM logger.Interface
type zapGormLogger struct {
	zap      *zap.Logger
	logLevel logger.LogLevel
}

func (l *zapGormLogger) LogMode(level logger.LogLevel) logger.Interface {
	newLogger := *l
	newLogger.logLevel = level
	return &newLogger
}

func (l *zapGormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.logLevel >= logger.Info {
		l.zap.Sugar().Infof(msg, data...)
	}
}

func (l *zapGormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.logLevel >= logger.Warn {
		l.zap.Sugar().Warnf(msg, data...)
	}
}

func (l *zapGormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.logLevel >= logger.Error {
		l.zap.Sugar().Errorf(msg, data...)
	}
}

func (l *zapGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	if l.logLevel <= 0 {
		return
	}
	sql, rows := fc()
	elapsed := time.Since(begin)

	switch {
	case err != nil && l.logLevel >= logger.Error:
		l.zap.Error("GORM error",
			zap.Error(err),
			zap.String("sql", sql),
			zap.Duration("elapsed", elapsed),
			zap.Int64("rows", rows),
		)
	case elapsed > 200*time.Millisecond && l.logLevel >= logger.Warn:
		l.zap.Warn("GORM slow query",
			zap.String("sql", sql),
			zap.Duration("elapsed", elapsed),
			zap.Int64("rows", rows),
		)
	case l.logLevel >= logger.Info:
		l.zap.Info("GORM query",
			zap.String("sql", sql),
			zap.Duration("elapsed", elapsed),
			zap.Int64("rows", rows),
		)
	}
}
