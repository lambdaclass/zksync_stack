resource "google_service_account" "eks" {
  account_id   = "eks-service-account-01"
  display_name = "EKS Service Account"
}

resource "google_container_cluster" "zksync_dev_01" {
  name     = "zksync-dev-01"
  location = "us-central1-c"

  remove_default_node_pool = true
  initial_node_count       = 1

  release_channel {
    channel = "STABLE"
  }

  network    = "projects/zksync-413615/global/networks/default"
  subnetwork = "projects/zksync-413615/regions/us-central1/subnetworks/default"

  private_cluster_config {
    master_global_access_config {
      enabled = true
    }
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  security_posture_config {
    mode               = "BASIC"
    vulnerability_mode = "VULNERABILITY_DISABLED"
  }

  fleet {
    project = "zksync-413615"
  }

  authenticator_groups_config {
    security_group = "gke-security-groups@lambdaclass.com"
  }
}

resource "google_container_node_pool" "spot_nvidia_l4" {
  name       = "gpu-pool"
  cluster    = google_container_cluster.zksync_dev_01.name
  node_count = 1

  node_config {
    service_account = google_service_account.eks.email
    disk_size_gb    = 768
    image_type      = "COS_CONTAINERD"
    machine_type    = "g2-standard-32"
    spot            = true
    oauth_scopes    = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/trace.append"
    ]
  }
}
