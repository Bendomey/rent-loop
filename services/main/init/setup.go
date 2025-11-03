package main

import (
	"fmt"
	"os"

	"github.com/Bendomey/rent-loop/services/main/init/migration"
	logger "github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

func Setup(isInit bool) {
	logger.Info("======== Setting Up ==========")

	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASS")
	dbname := os.Getenv("DB_NAME")
	default_dbname := os.Getenv("DB_DEFAULT_DBNAME")
	port := os.Getenv("DB_PORT")
	sslmode := os.Getenv("DB_SSLMODE")

	dropOldDatabase := true
	if !isInit {
		dropOldDatabase = false
	}

	ResolveDatabase(host, user, password, dbname, default_dbname, port, sslmode, dropOldDatabase)

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		host,
		user,
		password,
		dbname,
		port,
		sslmode,
	)
	db, dbErr := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger.Default.LogMode(gormLogger.Info),
	})

	if dbErr != nil {
		logger.Info("connecting to myles db errored out: ", dbErr)
		os.Exit(1)
	}

	logger.Info("======== Myles DB connected successfully ==========")

	logger.Info("======== Tables Migration Starting ==========")

	migrationErr := migration.ServiceAutoMigration(db)
	if migrationErr != nil {
		logger.Info("migrating tables: ", migrationErr)
		os.Exit(1)
	}

	logger.Info("======== Tables Migration Done ==========")

	// close db connection
	sql, dbErr := db.DB()
	defer func() {
		_ = sql.Close()
	}()

	if dbErr != nil {
		logger.Info(dbErr)
		os.Exit(1)
	}
}

func ResolveDatabase(host, user, password, dbname, default_dbname, port, sslmode string, dropOldDatabase bool) {
	postgresDbname := default_dbname

	postgresDsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		host,
		user,
		password,
		postgresDbname,
		port,
		sslmode,
	)

	postgresDb, postgresDberr := gorm.Open(postgres.Open(postgresDsn), &gorm.Config{
		Logger: gormLogger.Default.LogMode(gormLogger.Info),
	})

	if postgresDberr != nil {
		logger.Info("connecting to postgres db errored out: ", postgresDberr)
		os.Exit(1)
	}
	logger.Info("======== Postgres DB connected successfully ==========")

	// check if db exists
	stmt := fmt.Sprintf("SELECT * FROM pg_database WHERE datname = '%s';", dbname)
	rs := postgresDb.Raw(stmt)
	if rs.Error != nil {
		logger.Info("checking if db exists errored out: ", rs.Error)
		os.Exit(1)
	}

	// Check if db exists
	rec := make(map[string]interface{})
	if rs.Find(rec); len(rec) == 0 {
		// If it doesn't create it
		logger.Info("======== DB does not exist, creating db ==========")
		stmt := fmt.Sprintf("CREATE DATABASE %s;", dbname)
		if rs := postgresDb.Exec(stmt); rs.Error != nil {
			logger.Info(rs.Error)
			os.Exit(1)
		}
	} else if dropOldDatabase {
		logger.Info("======== DB does exist, dropping db ==========")
		terminateConnectionsStmt := fmt.Sprintf("SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '%s';", dbname)
		if rs := postgresDb.Exec(terminateConnectionsStmt); rs.Error != nil {
			logger.Info("terminating connections errored out: ", rs.Error)
			os.Exit(1)
		}
		// if it does drop it
		stmt := fmt.Sprintf("DROP DATABASE %s;", dbname)
		if rs := postgresDb.Exec(stmt); rs.Error != nil {
			logger.Info(rs.Error)
			os.Exit(1)
		}

		logger.Info("======== Dropped db, creating db ==========")
		createStmt := fmt.Sprintf("CREATE DATABASE %s;", dbname)
		if rs := postgresDb.Exec(createStmt); rs.Error != nil {
			logger.Info(rs.Error)
			os.Exit(1)
		}
	}

	// close postgres Db connection
	postgresSql, postgresErr := postgresDb.DB()
	defer func() {
		_ = postgresSql.Close()
	}()

	if postgresErr != nil {
		logger.Info(postgresErr)
		os.Exit(1)
	}
}
