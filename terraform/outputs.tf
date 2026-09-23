output "cloud_run_url" {
  description = "The public URL of the deployed Cloud Run backend"
  value       = google_cloud_run_v2_service.backend.uri
}

output "static_outbound_ip" {
  description = "The dedicated static IP address to whitelist in Binance, Bybit, and Bitget"
  value       = google_compute_address.static_ip.address
}

output "vpc_connector_name" {
  description = "The name of the Serverless VPC Connector"
  value       = google_vpc_access_connector.connector.name
}

output "whitelisting_instructions" {
  description = "Exchange Whitelisting Next Steps"
  value       = "Copy ${google_compute_address.static_ip.address} into Binance API Management, Bybit IP Access Restriction, and Bitget Link IP Address."
}
