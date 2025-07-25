package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/hungcq/pscit/backend/internal/config"
	"github.com/hungcq/pscit/backend/internal/models"

	"go.uber.org/zap"
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
	userMsg.SetHeader("Subject", "Book Reservation Request Received")

	// Format suggested timeslots with timezone
	pickupTimeslots := make([]string, len(reservation.SuggestedPickupTimeslots))
	loc := time.FixedZone("GMT+7", 7*60*60)
	for i, slot := range reservation.SuggestedPickupTimeslots {
		t, err := time.ParseInLocation(time.RFC3339, slot, time.UTC)
		if err != nil {
			zap.L().Error("SendReservationNotification: Failed to parse pickup timeslot", zap.String("slot", slot), zap.Error(err))
			return err
		}
		t = t.In(loc)
		endTime := t.Add(30 * time.Minute)
		_, offset := t.Zone()
		offsetHours := offset / 3600
		offsetSign := "+"
		if offsetHours < 0 {
			offsetSign = "-"
			offsetHours = -offsetHours
		}
		pickupTimeslots[i] = fmt.Sprintf("%s - %s (GMT%s%d)",
			t.Format("03:04 PM"),
			endTime.Format("03:04 PM"),
			offsetSign,
			offsetHours,
		)
	}

	returnTimeslots := make([]string, len(reservation.SuggestedReturnTimeslots))
	for i, slot := range reservation.SuggestedReturnTimeslots {
		t, err := time.ParseInLocation(time.RFC3339, slot, time.UTC)
		if err != nil {
			zap.L().Error("SendReservationNotification: Failed to parse return timeslot", zap.String("slot", slot), zap.Error(err))
			return err
		}
		t = t.In(loc)
		endTime := t.Add(30 * time.Minute)
		_, offset := t.Zone()
		offsetHours := offset / 3600
		offsetSign := "+"
		if offsetHours < 0 {
			offsetSign = "-"
			offsetHours = -offsetHours
		}
		returnTimeslots[i] = fmt.Sprintf("%s - %s (GMT%s%d)",
			t.Format("03:04 PM"),
			endTime.Format("03:04 PM"),
			offsetSign,
			offsetHours,
		)
	}

	// Format book copies information
	bookCopiesInfo := make([]string, len(reservation.BookCopies))
	for i, copy := range reservation.BookCopies {
		bookCopiesInfo[i] = fmt.Sprintf(`
			<div class="book-copy">
				<h4>%s</h4>
				<p><strong>Author(s):</strong> %s</p>
				<p><strong>Format:</strong> %s</p>
				<p><strong>Condition:</strong> %s</p>
			</div>
		`,
			copy.Book.Title,
			formatAuthors(copy.Book.Authors),
			capitalize(string(copy.Book.Format)),
			strings.Title(strings.ReplaceAll(string(copy.Condition), "_", " ")),
		)
	}

	userMsg.SetBody("text/html", fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
				.content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
				.footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
				.details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
				.timeslot { background-color: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 3px; }
				.status { display: inline-block; padding: 5px 10px; background-color: #ffd700; color: #333; border-radius: 3px; }
				.timezone { color: #666; font-size: 0.9em; }
				.book-copy { background-color: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Book Reservation Request</h1>
				</div>
				<div class="content">
					<p>Dear %s,</p>
					<p>Thank you for your book reservation request. We have received your request and will process it shortly.</p>
					
					<div class="details">
						<h3>Reservation Details</h3>
						<p><strong>Borrow Period:</strong> %s to %s</p>
						<p><strong>Status:</strong> <span class="status">%s</span></p>
					</div>

					<div class="details">
						<h3>Books Reserved</h3>
						%s
					</div>

					<div class="details">
						<h3>Suggested Pickup Times</h3>
						%s
					</div>

					<div class="details">
						<h3>Suggested Return Times</h3>
						%s
					</div>

					<p>We will review your request and send you a confirmation email with the approved pickup and return times.</p>
					<p>If you have any questions, please don't hesitate to contact us.</p>
				</div>
				<div class="footer">
					<p>Thank you for using our library service!</p>
					<p>© Hung Chu – PSciT Library</p>
				</div>
			</div>
		</body>
		</html>
	`,
		reservation.User.Name,
		reservation.StartDate.Format("January 2, 2006"),
		reservation.EndDate.Format("January 2, 2006"),
		strings.Title(string(reservation.Status)),
		strings.Join(bookCopiesInfo, ""),
		formatTimeslots(pickupTimeslots),
		formatTimeslots(returnTimeslots),
	))

	// Send to admin
	adminMsg := gomail.NewMessage()
	adminMsg.SetHeader("From", config.AppConfig.SMTPUsername)
	adminMsg.SetHeader("To", config.AppConfig.AdminEmail)
	adminMsg.SetHeader("Subject", "New Book Reservation Request")
	adminMsg.SetBody("text/html", fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
				.content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
				.footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
				.details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
				.timeslot { background-color: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 3px; }
				.book-copy { background-color: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>New Book Reservation Request</h1>
				</div>
				<div class="content">
					<div class="details">
						<h3>User Information</h3>
						<p><strong>Name:</strong> %s</p>
						<p><strong>Email:</strong> %s</p>
					</div>

					<div class="details">
						<h3>Books Reserved</h3>
						%s
					</div>

					<div class="details">
						<h3>Reservation Period</h3>
						<p><strong>From:</strong> %s</p>
						<p><strong>To:</strong> %s</p>
					</div>

					<div class="details">
						<h3>Suggested Pickup Times</h3>
						%s
					</div>

					<div class="details">
						<h3>Suggested Return Times</h3>
						%s
					</div>

					<p>Please review this reservation request and approve or reject it through the admin panel.</p>
				</div>
				<div class="footer">
					<p>Library Management System - Admin Notification</p>
					<p>© Hung Chu – PSciT Library</p>
				</div>
			</div>
		</body>
		</html>
	`,
		reservation.User.Name,
		reservation.User.Email,
		strings.Join(bookCopiesInfo, ""),
		reservation.StartDate.Format("January 2, 2006"),
		reservation.EndDate.Format("January 2, 2006"),
		formatTimeslots(pickupTimeslots),
		formatTimeslots(returnTimeslots),
	))

	// Send both emails
	if err := s.dialer.DialAndSend(userMsg, adminMsg); err != nil {
		zap.L().Error("SendReservationNotification: Failed to send reservation notification emails", zap.String("userID", reservation.User.ID.String()), zap.String("reservationID", reservation.ID.String()), zap.Error(err))
		return err
	}
	zap.L().Info("SendReservationNotification: Reservation notification emails sent successfully", zap.String("userID", reservation.User.ID.String()), zap.String("reservationID", reservation.ID.String()))
	return nil
}

func formatAuthors(authors []models.Author) string {
	names := make([]string, len(authors))
	for i, author := range authors {
		names[i] = author.Name
	}
	return strings.Join(names, ", ")
}

func formatTimeslots(timeslots []string) string {
	if len(timeslots) == 0 {
		return "<p>No timeslots suggested</p>"
	}

	var slots []string
	for _, slot := range timeslots {
		slots = append(slots, fmt.Sprintf(`<div class="timeslot">%s</div>`, slot))
	}
	return strings.Join(slots, "")
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
		`,
			user.Name, book.Title, authorsStr, book.Description))

		if err := s.dialer.DialAndSend(msg); err != nil {
			zap.L().Error("SendNewBookNotification: Failed to send new book notification to user", zap.String("bookID", book.ID.String()), zap.String("userID", user.ID.String()), zap.Error(err))
			return err
		}
		zap.L().Info("SendNewBookNotification: New book notification sent successfully", zap.String("bookID", book.ID.String()), zap.String("userID", user.ID.String()))
	}
	zap.L().Info("SendNewBookNotification: All new book notifications sent", zap.String("bookID", book.ID.String()), zap.Int("subscribersCount", len(subscribers)))
	return nil
}

func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func (s *EmailService) SendReservationStatusUpdate(reservation *models.Reservation) error {
	userMsg := gomail.NewMessage()
	userMsg.SetHeader("From", config.AppConfig.SMTPUsername)
	userMsg.SetHeader("To", reservation.User.Email)
	userMsg.SetHeader("Subject", fmt.Sprintf("Book Reservation %s", strings.Title(string(reservation.Status))))

	// Format book copies information with their pickup and return times
	bookCopiesInfo := make([]string, len(reservation.BookCopies))
	loc := time.FixedZone("GMT+7", 7*60*60)
	var pickupTimeStr, returnTimeStr string
	if reservation.PickupTime != nil {
		t := *reservation.PickupTime
		t = t.In(loc)
		endTime := t.Add(30 * time.Minute)
		_, offset := t.Zone()
		offsetHours := offset / 3600
		offsetSign := "+"
		if offsetHours < 0 {
			offsetSign = "-"
			offsetHours = -offsetHours
		}
		pickupTimeStr = fmt.Sprintf("%s - %s (GMT%s%d)",
			t.Format("03:04 PM"),
			endTime.Format("03:04 PM"),
			offsetSign,
			offsetHours,
		)
	}

	if reservation.ReturnTime != nil {
		t := *reservation.ReturnTime
		t = t.In(loc)
		endTime := t.Add(30 * time.Minute)
		_, offset := t.Zone()
		offsetHours := offset / 3600
		offsetSign := "+"
		if offsetHours < 0 {
			offsetSign = "-"
			offsetHours = -offsetHours
		}
		returnTimeStr = fmt.Sprintf("%s - %s (GMT%s%d)",
			t.Format("03:04 PM"),
			endTime.Format("03:04 PM"),
			offsetSign,
			offsetHours,
		)
	}

	for i, bookCopy := range reservation.BookCopies {
		bookCopiesInfo[i] = fmt.Sprintf(`
			<div class="book-copy">
				<h4>%s</h4>
				<p><strong>Author(s):</strong> %s</p>
				<p><strong>Format:</strong> %s</p>
				<p><strong>Condition:</strong> %s</p>
			</div>
		`,
			bookCopy.Book.Title,
			formatAuthors(bookCopy.Book.Authors),
			capitalize(string(bookCopy.Book.Format)),
			strings.Title(strings.ReplaceAll(string(bookCopy.Condition), "_", " ")),
		)
	}

	// Get status-specific message
	var statusMessage string
	switch reservation.Status {
	case models.ReservationStatusApproved:
		statusMessage = `
			<p>Your book reservation request has been approved!</p>
			<p>Please make sure to pick up and return the books at the specified times.</p>
		`
	case models.ReservationStatusRejected:
		statusMessage = `
			<p>We regret to inform you that your book reservation request has been rejected.</p>
			<p>Please feel free to make another reservation request with different times.</p>
		`
	case models.ReservationStatusReturned:
		statusMessage = `
			<p>Thank you for returning the books!</p>
			<p>We hope you enjoyed reading them.</p>
		`
	}

	// Get status-specific title
	var statusTitle string
	switch reservation.Status {
	case models.ReservationStatusApproved:
		statusTitle = "Book Reservation Approved"
	case models.ReservationStatusRejected:
		statusTitle = "Book Reservation Rejected"
	case models.ReservationStatusReturned:
		statusTitle = "Books Returned"
	default:
		statusTitle = "Book Reservation Update"
	}

	userMsg.SetBody("text/html", fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
				.content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
				.footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
				.details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
				.timeslot { background-color: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 3px; }
				.status { display: inline-block; padding: 5px 10px; background-color: %s; color: white; border-radius: 3px; }
				.timezone { color: #666; font-size: 0.9em; }
				.location { background-color: #e8f4fd; padding: 15px; margin: 15px 0; border-radius: 5px; }
				.location a { color: #4a90e2; text-decoration: none; }
				.location a:hover { text-decoration: underline; }
				.book-copy { background-color: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>%s</h1>
				</div>
				<div class="content">
					<p>Dear %s,</p>
					%s
					
					<div class="details">
						<h3>Reservation Details</h3>
						<p><strong>Borrow Period:</strong> %s to %s</p>
						<p><strong>Status:</strong> <span class="status">%s</span></p>
					</div>

					<div class="details">
						<h3>Books Reserved</h3>
						%s
					</div>
					
					%s

					%s

					<p>If you have any questions, please don't hesitate to contact us.</p>
				</div>
				<div class="footer">
					<p>Thank you for using our library service!</p>
					<p>© Hung Chu – PSciT Library</p>
				</div>
			</div>
		</body>
		</html>
	`,
		getStatusColor(reservation.Status),
		statusTitle,
		reservation.User.Name,
		statusMessage,
		reservation.StartDate.Format("January 2, 2006"),
		reservation.EndDate.Format("January 2, 2006"),
		strings.Title(string(reservation.Status)),
		strings.Join(bookCopiesInfo, ""),
		getTimeDetails(reservation.Status, pickupTimeStr, returnTimeStr),
		getLocationDetails(reservation.Status),
	))

	if err := s.dialer.DialAndSend(userMsg); err != nil {
		zap.L().Error("SendReservationStatusUpdate: Failed to send reservation status update email", zap.String("userID", reservation.User.ID.String()), zap.String("reservationID", reservation.ID.String()), zap.String("status", string(reservation.Status)), zap.Error(err))
		return err
	}
	zap.L().Info("SendReservationStatusUpdate: Reservation status update email sent successfully", zap.String("userID", reservation.User.ID.String()), zap.String("reservationID", reservation.ID.String()), zap.String("status", string(reservation.Status)))
	return nil
}

func getStatusColor(status models.ReservationStatus) string {
	switch status {
	case models.ReservationStatusApproved:
		return "#4CAF50" // Green
	case models.ReservationStatusRejected:
		return "#F44336" // Red
	case models.ReservationStatusReturned:
		return "#2196F3" // Blue
	default:
		return "#FFC107" // Yellow
	}
}

func getTimeDetails(status models.ReservationStatus, pickupTime, returnTime string) string {
	if status != models.ReservationStatusApproved {
		return ""
	}

	return fmt.Sprintf(`
		<div class="timeslot">
			<strong>Pickup Time:</strong> %s
		</div>
		<div class="timeslot">
			<strong>Return Time:</strong> %s
		</div>
	`, pickupTime, returnTime)
}

func getLocationDetails(status models.ReservationStatus) string {
	if status != models.ReservationStatusApproved {
		return ""
	}

	return `
		<div class="location">
			<h4>Pickup Location</h4>
			<p>Reserved books can be picked up at our place at <a href='https://maps.app.goo.gl/yEbHKpyqVknWia6L8'>
				No. 57, Alley 38, Lane 189, Dong Hoi Street, Dong Hoi Commune, Dong Anh District, Hanoi, Vietnam.
			</a></p>
			<p>When you arrive, you can contact us via:</p>
			<ul>
				<li>WhatsApp/Mobile: <a href="tel:+84987134200">+84 987 134 200</a></li>
			</ul>
		</div>
	`
}
