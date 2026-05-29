#!/bin/bash
# Script setup database cho Chinese4VN
# Chạy lần lượt các lệnh sau:

echo "=== Bước 1: Tạo PostgreSQL user và database ==="
sudo -u postgres psql <<EOF
CREATE ROLE eov2 WITH LOGIN CREATEDB SUPERUSER;
EOF

echo "=== Bước 2: Tạo database ==="
createdb hello_chinese

echo "=== Bước 3: Cập nhật .env ==="
cat > .env <<ENVEOF
PORT=4000
DATABASE_URL=postgresql://eov2@localhost:5432/hello_chinese
JWT_SECRET=chinese4vn_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
MINIO_BUCKET=hello-chinese
ENVEOF

echo "=== Bước 4: Chạy Prisma migration ==="
npx prisma migrate dev --name init

echo "=== Bước 5: Generate Prisma Client ==="
npx prisma generate

echo "=== Done! ==="
