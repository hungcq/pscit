package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

type Config struct {
	env string
	// Server
	Port string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// JWT
	JWTSecret string

	// Google OAuth
	GoogleClientID string

	// SMTP
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	AdminEmail   string
}

func (c Config) IsProd() bool {
	return c.env == "prod"
}

var AppConfig Config

func init() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		zap.L().Warn("No .env file found", zap.Error(err))
	}
	AppConfig.env = getEnv("ENV", "prod")
	// Server
	AppConfig.Port = getEnv("PORT", "8080")

	// Database
	AppConfig.DBHost = getEnv("DB_HOST", "localhost")
	AppConfig.DBPort = getEnv("DB_PORT", "5432")
	AppConfig.DBUser = getEnv("DB_USER", "postgres")
	AppConfig.DBPassword = getEnv("DB_PASSWORD", "postgres")
	AppConfig.DBName = getEnv("DB_NAME", "library")

	// JWT
	AppConfig.JWTSecret = getEnv("JWT_SECRET", "your_jwt_secret")

	// Google OAuth
	AppConfig.GoogleClientID = getEnv("GOOGLE_CLIENT_ID", "your_google_client_id")

	// SMTP
	AppConfig.SMTPHost = getEnv("SMTP_HOST", "smtp.gmail.com")
	AppConfig.SMTPPort = getEnvAsInt("SMTP_PORT", 587)
	AppConfig.SMTPUsername = getEnv("SMTP_USERNAME", "your_email@gmail.com")
	AppConfig.SMTPPassword = getEnv("SMTP_PASSWORD", "your_app_password")
	AppConfig.AdminEmail = getEnv("ADMIN_EMAIL", "admin@example.com")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
