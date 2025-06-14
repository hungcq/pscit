package main

import (
	"github.com/hungcq/pscit/backend/internal/config"
	"github.com/hungcq/pscit/backend/internal/routes"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	// Initialize Zap logger
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "ts"
	encoderConfig.EncodeTime = zapcore.EpochMillisTimeEncoder
	if !config.AppConfig.IsProd() {
		encoderConfig = zap.NewDevelopmentEncoderConfig()
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		encoderConfig.EncodeTime = zapcore.RFC3339TimeEncoder
	}

	core := zapcore.NewCore(
		zapcore.NewConsoleEncoder(encoderConfig),
		zapcore.Lock(os.Stdout),
		zapcore.InfoLevel,
	)

	logger := zap.New(core)
	defer logger.Sync()

	zap.ReplaceGlobals(logger)

	// Initialize database
	db := config.InitDB()

	// Create Gin router
	r := gin.New()
	r.Use(ginZapLogger(logger), gin.Recovery())

	// Setup CORS
	r.Use(config.CORSMiddleware())

	// Initialize routes
	routes.SetupRoutes(r, db)

	// Start server
	if err := r.Run(":" + config.AppConfig.Port); err != nil {
		zap.L().Fatal("Failed to start server:", zap.Error(err))
	}
}

func ginZapLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		duration := time.Since(start)
		logger.Info("HTTP request",
			zap.Int("status", c.Writer.Status()),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("client_ip", c.ClientIP()),
			zap.Duration("latency", duration),
		)
	}
}
