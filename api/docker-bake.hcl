group "default" {
  targets = ["gateway"]
}

target "gateway" {
  dockerfile = "Dockerfile_cross"
  tags= ["samuel19982/gateway:latest"]
  platforms = ["linux/amd64", "linux/arm64", "linux/arm/v7"]
}