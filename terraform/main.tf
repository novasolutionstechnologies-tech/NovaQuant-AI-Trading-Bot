terraform {
  required_version = ">= 1.3.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Enable Required GCP APIs
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "compute.googleapis.com",
    "vpcaccess.googleapis.com",
    "cloudbuild.googleapis.com",
  ])

  service            = each.key
  disable_on_destroy = false
}

# 2. Custom VPC Network & Subnet
resource "google_compute_network" "vpc_network" {
  name                    = "novaquant-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.services]
}

resource "google_compute_subnetwork" "subnet" {
  name          = "novaquant-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# 3. Reserved Regional Static External IP Address for Exchange Whitelisting
resource "google_compute_address" "static_ip" {
  name         = "novaquant-static-ip"
  region       = var.region
  address_type = "EXTERNAL"
  depends_on   = [google_project_service.services]
}

# 4. Cloud Router & Cloud NAT for Static Egress
resource "google_compute_router" "router" {
  name    = "novaquant-router"
  region  = var.region
  network = google_compute_network.vpc_network.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "novaquant-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "MANUAL_ONLY"
  nat_ips                            = [google_compute_address.static_ip.self_link]
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.subnet.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }
}

# 5. Serverless VPC Access Connector
resource "google_vpc_access_connector" "connector" {
  name          = "novaquant-connector"
  region        = var.region
  network       = google_compute_network.vpc_network.name
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 3
  machine_type  = "e2-micro"
  depends_on    = [google_project_service.services]
}

# 6. Cloud Run v2 Service with All-Traffic VPC Egress
resource "google_cloud_run_v2_service" "backend" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC" # Critical: Routes 100% outbound traffic through Cloud NAT Static IP
    }

    containers {
      image = var.container_image != "" ? var.container_image : "gcr.io/${var.project_id}/${var.service_name}:latest"

      resources {
        limits = {
          cpu    = "1000m"
          memory = "1Gi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "STATIC_OUTBOUND_IP"
        value = google_compute_address.static_ip.address
      }

      dynamic "env" {
        for_each = var.gemini_api_key != "" ? [1] : []
        content {
          name  = "GEMINI_API_KEY"
          value = var.gemini_api_key
        }
      }

      dynamic "env" {
        for_each = var.openai_api_key != "" ? [1] : []
        content {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        }
      }
    }
  }

  depends_on = [
    google_compute_router_nat.nat,
    google_vpc_access_connector.connector,
  ]
}

# 7. Allow Public Unauthenticated Access to Cloud Run Service
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
