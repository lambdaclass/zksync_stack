resource "google_sql_database_instance" "zksync_dev_01" {
  name             = "zksync-dev-01"
  database_version = "POSTGRES_14"
  region           = "us-east1"

  settings {
    tier              = "db-custom-4-15360"
    activation_policy = "ALWAYS"
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 100
    disk_autoresize   = true
    ip_configuration {
      ipv4_enabled = true

      authorized_networks {
        name  = "lambda-personal-01"
        value = "181.104.27.110/32"
      }
      authorized_networks {
        name  = "lambda-personal-02"
        value = "181.104.27.112/32"
      }
      authorized_networks {
        name  = "lambda-iplan"
        value = "200.68.104.89/32"
      }
      authorized_networks {
        name  = "lambda-telecentro"
        value = "190.55.103.226/32"
      }
    }
    backup_configuration {
      enabled = false
    }
  }
}

resource "google_sql_user" "lambda" {
  name     = "lambda"
  instance = google_sql_database_instance.zksync_dev_01.name
  password = var.sql_password
}
