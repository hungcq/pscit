package outbound

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log"
	"os"
)

var db *gorm.DB

func InitMySqlDb() {
	connStr := fmt.Sprintf("%s:%s@tcp(pscit-db.ceq2eokowsmi.ap-southeast-1.rds.amazonaws.com:3306)/book",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	var err error
	db, err = gorm.Open(mysql.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatalf("unable to connect to DB %v", err)
	}
	fmt.Println("Connected!")
}
