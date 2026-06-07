# 🔍 Học Elasticsearch từ cơ bản đến nâng cao

Dự án thực hành học **Elasticsearch** thông qua **OpenSearch 2.11.1** (bản fork của Elasticsearch 7.10) chạy bằng Docker.

👉 **Lộ trình & tiến độ: xem [`ROADMAP.md`](ROADMAP.md)**

## 🚀 Khởi động nhanh

### 1. Bật cluster (OpenSearch + Dashboards)
```bash
docker compose up -d
docker compose ps          # kiểm tra 2 container đang chạy
```
Lần đầu chờ ~30–60s để cluster sẵn sàng.

### 2. Kiểm tra cluster
```bash
# Qua REST API (chấp nhận self-signed cert bằng -k)
curl -k -u admin:admin https://localhost:9200
curl -k -u admin:admin https://localhost:9200/_cluster/health?pretty
```

### 3. Mở Dev Tools (giao diện chạy query)
- Mở trình duyệt: **http://localhost:5601**
- Đăng nhập: `admin` / `admin`
- Vào menu ☰ → **Management → Dev Tools**
- Đây là nơi bạn copy/paste các query mẫu trong từng bài học.

### 4. Kết nối bằng Node.js
```bash
npm install
npm run ping               # in ra thông tin cluster nếu kết nối OK
```

## 📁 Cấu trúc dự án
```
ROADMAP.md       → Lộ trình 8 giai đoạn + checklist tiến độ
docker-compose.yml → Cấu hình OpenSearch + Dashboards
.env             → Thông tin kết nối (admin/admin)
client/          → Module kết nối & script ping
lessons/         → 8 giai đoạn học, mỗi bài có lý thuyết + query + script Node
datasets/        → Dữ liệu mẫu để thực hành
docs/            → Đối chiếu OpenSearch vs Elasticsearch
```

## 🔧 Lệnh hữu ích
```bash
docker compose up -d       # bật
docker compose down        # tắt (giữ data)
docker compose down -v     # tắt + xoá toàn bộ data
docker compose logs -f opensearch   # xem log
```

## ⚠️ Lưu ý
- Cấu hình SSL/mật khẩu ở đây chỉ dành cho **môi trường học**, không dùng cho production.
- Nội dung dạy phần lõi chuẩn Elasticsearch; chỗ nào OpenSearch khác ES sẽ được đánh dấu rõ.
