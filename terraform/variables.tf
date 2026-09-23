variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources (e.g. asia-southeast1, us-central1)"
  type        = string
  default     = "asia-southeast1"
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "novaquant-backend"
}

variable "container_image" {
  description = "The container image URI (e.g., gcr.io/PROJECT_ID/novaquant-backend:latest)"
  type        = string
  default     = ""
}

variable "gemini_api_key" {
  description = "Google Gemini AI API key for dual-engine consensus"
  type        = string
  default     = ""
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key (optional)"
  type        = string
  default     = ""
  sensitive   = true
}
