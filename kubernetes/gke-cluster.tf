
resource "google_container_cluster" "cluster-from-terraform" {
  name     = "cluster-from-terraform"
  location = "europe-west4-a"

  initial_node_count = 3

  node_config {
    machine_type = "e2-medium"
    disk_size_gb = 100
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }
}
