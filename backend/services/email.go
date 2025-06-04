package services

import (
	"fmt"
	"strings"

	"github.com/hungcq/pscit/backend/config"
	"github.com/hungcq/pscit/backend/models"
	"gopkg.in/gomail.v2"
)

type EmailService struct {
	dialer *gomail.Dialer
}

func NewEmailService() *EmailService {
	dialer := gomail.NewDialer(
		config.AppConfig.SMTPHost,
		config.AppConfig.SMTPPort,
		config.AppConfig.SMTPUsername,
		config.AppConfig.SMTPPassword,
	)

	return &EmailService{
		dialer: dialer,
	}
}

func (s *EmailService) SendReservationNotification(reservation *models.Reservation) error {
	// Send to user
	userMsg := gomail.NewMessage()
	userMsg.SetHeader("From", config.AppConfig.SMTPUsername)
	userMsg.SetHeader("To", reservation.User.Email)
	userMsg.SetHeader("Subject", "Book Reservation Confirmation")
	userMsg.SetBody("text/html", fmt.Sprintf(`
		<h2>Book Reservation Confirmation</h2>
		<p>Dear %s,</p>
		<p>Your reservation for the book "%s" has been confirmed.</p>
		<p>Please pick up the book before: %s</p>
		<p>Thank you for using our library service!</p>
	`, reservation.User.Name, reservation.BookCopy.Book.Title, reservation.EndDate.Format("2006-01-02 15:04:05")))

	// Send to admin
	adminMsg := gomail.NewMessage()
	adminMsg.SetHeader("From", config.AppConfig.SMTPUsername)
	adminMsg.SetHeader("To", config.AppConfig.AdminEmail)
	adminMsg.SetHeader("Subject", "New Book Reservation")
	adminMsg.SetBody("text/html", fmt.Sprintf(`
		<h2>New Book Reservation</h2>
		<p>A new reservation has been made:</p>
		<ul>
			<li>User: %s (%s)</li>
			<li>Book: %s</li>
			<li>Expires: %s</li>
		</ul>
	`, reservation.User.Name, reservation.User.Email, reservation.BookCopy.Book.Title, reservation.EndDate.Format("2006-01-02 15:04:05")))

	// Send both emails
	if err := s.dialer.DialAndSend(userMsg, adminMsg); err != nil {
		return err
	}

	return nil
}

func (s *EmailService) SendNewBookNotification(book *models.Book, subscribers []models.User) error {
	for _, user := range subscribers {
		msg := gomail.NewMessage()
		msg.SetHeader("From", config.AppConfig.SMTPUsername)
		msg.SetHeader("To", user.Email)
		msg.SetHeader("Subject", "New Book Available")

		// Format authors
		authors := make([]string, len(book.Authors))
		for i, author := range book.Authors {
			authors[i] = author.Name
		}
		authorsStr := strings.Join(authors, ", ")

		msg.SetBody("text/html", fmt.Sprintf(`
			<h2>New Book Available</h2>
			<p>Dear %s,</p>
			<p>A new book is now available in our library:</p>
			<h3>%s</h3>
			<p>By: %s</p>
			<p>%s</p>
			<p>Visit our library to check it out!</p>
		`, user.Name, book.Title, authorsStr, book.Description))

		if err := s.dialer.DialAndSend(msg); err != nil {
			return err
		}
	}

	return nil
}
