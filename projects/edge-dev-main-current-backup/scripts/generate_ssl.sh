#!/bin/bash
# SSL Certificate Generation for Edge.dev
# Generated on 2025-12-01 17:14:05 UTC

SSL_DIR="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/ssl"
CERT_DIR="$SSL_DIR/certs"
PRIVATE_DIR="$SSL_DIR/private"

# Create directories
mkdir -p "$CERT_DIR"
mkdir -p "$PRIVATE_DIR"

# Generate private key
openssl genrsa -out "$PRIVATE_DIR/edge-dev.key" 4096

# Generate certificate signing request
openssl req -new -key "$PRIVATE_DIR/edge-dev.key" \
    -out "$SSL_DIR/edge-dev.csr" \
    -subj "/C=US/ST=CA/L=San Francisco/O=Edge.dev/OU=Technology/CN=edge-dev.local"

# Generate self-signed certificate (1 year)
openssl x509 -req -days 365 \
    -in "$SSL_DIR/edge-dev.csr" \
    -signkey "$PRIVATE_DIR/edge-dev.key" \
    -out "$CERT_DIR/edge-dev.crt"

# Generate DH parameters for perfect forward secrecy
openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048

# Set secure permissions
chmod 600 "$PRIVATE_DIR/edge-dev.key"
chmod 644 "$CERT_DIR/edge-dev.crt"
chmod 644 "$SSL_DIR/dhparam.pem"

echo "SSL certificates generated successfully!"
echo "Certificate: $CERT_DIR/edge-dev.crt"
echo "Private key: $PRIVATE_DIR/edge-dev.key"
echo "DH parameters: $SSL_DIR/dhparam.pem"
