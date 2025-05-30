package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
	"github.com/hungcq/pscit/backend/config"
	"github.com/hungcq/pscit/backend/models"
	"gorm.io/gorm"
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.StandardClaims
}

type AuthService struct {
	db        *gorm.DB
	jwtSecret []byte
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{
		db:        db,
		jwtSecret: []byte(config.AppConfig.JWTSecret),
	}
}

func (s *AuthService) GetOrCreateUser(email, name, googleID string) (*models.User, error) {
	var user models.User
	result := s.db.Where("email = ?", email).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Create new user
			user = models.User{
				Email:    email,
				Name:     name,
				GoogleID: googleID,
				Role:     "user", // Default role
			}
			if err := s.db.Create(&user).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, result.Error
		}
	}

	return &user, nil
}

func (s *AuthService) GenerateToken(userID uuid.UUID, email, role string) (string, error) {
	claims := &Claims{
		UserID: userID.String(),
		Email:  email,
		Role:   role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
