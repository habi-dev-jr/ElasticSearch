# Giai đoạn 0 — Khởi động & Kiến trúc nền tảng

> Mục tiêu: bật được cluster, hiểu các khái niệm cốt lõi và biết cách "nói chuyện" với Elasticsearch.

## 1. Elasticsearch / OpenSearch là gì?

Là một **search & analytics engine** phân tán, xây trên thư viện **Apache Lucene**. Thay vì lưu dữ liệu trong bảng và quét tuần tự như SQL, nó xây **inverted index** (chỉ mục ngược) giúp tìm kiếm full-text cực nhanh trên hàng triệu document.

Dùng để: tìm kiếm (e-commerce, docs), phân tích log (ELK), observability, dashboard thời gian thực.

## 2. Mô hình kiến trúc (rất quan trọng)

```
Cluster (cả hệ thống)
 └── Node (1 tiến trình Elasticsearch chạy trên 1 máy)
      └── Index (giống "database/table" — tập hợp document cùng loại)
           └── Shard (mảnh chia nhỏ của index, là 1 Lucene index độc lập)
                └── Document (1 bản ghi JSON — đơn vị nhỏ nhất)
```

| Khái niệm | Giải thích ngắn | Ví dụ |
|---|---|---|
| **Cluster** | Tập hợp các node làm việc cùng nhau | `es-learn-cluster` |
| **Node** | Một instance Elasticsearch | `es-learn-node` |
| **Index** | Nhóm document cùng loại | `products`, `logs-2024` |
| **Document** | Một bản ghi JSON, có `_id` duy nhất | 1 sản phẩm |
| **Shard (primary)** | Index được chia thành N mảnh để phân tán & mở rộng | 1 index = 1 shard (mặc định OpenSearch 2.x) |
| **Replica** | Bản sao của shard để chịu lỗi & tăng tốc đọc | 1 replica |

> 📌 **So với SQL:** Index ≈ Table, Document ≈ Row, Field ≈ Column. Nhưng dữ liệu là JSON, schema linh hoạt (mapping), và tối ưu cho tìm kiếm chứ không phải transaction.

**Vì sao chia shard?** Một index quá lớn không vừa 1 máy → chia nhỏ thành shard, rải lên nhiều node → mở rộng ngang (horizontal scale). Replica là bản sao: node chết vẫn còn dữ liệu.

> ⚠️ Cluster học của chúng ta chỉ có **1 node** (`discovery.type=single-node`). Khi bạn tạo một index **yêu cầu replica** (vd `number_of_replicas: 1`), replica đó không thể gán lên node khác → index/cluster chuyển sang **yellow** (bình thường khi học, không phải lỗi). Index hệ thống của OpenSearch tự đặt replica = 0 nên ban đầu cluster vẫn **green**.

## 3. Giao tiếp qua REST API

Mọi thao tác đều là HTTP request tới cluster. Cú pháp chung:
```
<HTTP_METHOD> /<index>/<endpoint>
{ "json": "body" }
```
- `GET` để đọc, `PUT`/`POST` để tạo/ghi, `DELETE` để xoá.
- Trong **Dev Tools** (Dashboards) bạn gõ gọn không cần `https://localhost:9200`.

## 4. Bài thực hành

### Bước 1 — Bật cluster
```bash
docker compose up -d
docker compose ps        # phải thấy 2 container "running"
```

### Bước 2 — Mở Dev Tools
http://localhost:5601 → đăng nhập `admin/admin` → ☰ Management → **Dev Tools**.
Copy nội dung file [`queries.txt`](queries.txt) vào và chạy từng lệnh (Ctrl/Cmd + Enter).

### Bước 3 — Hoặc dùng curl
```bash
curl -k -u admin:admin https://localhost:9200/_cluster/health?pretty
```

### Bước 4 — Kết nối Node.js
```bash
npm install
npm run ping
```

## ✅ Checklist hoàn thành
- [ ] 2 container chạy OK
- [ ] Chạy được query trong Dev Tools
- [ ] Hiểu được output của `_cluster/health` và `_cat/indices`
- [ ] `npm run ping` báo kết nối thành công
- [ ] Giải thích được: shard vs replica, vì sao cluster yellow

## 📝 Bài tập
1. Chạy `GET _cat/nodes?v` — có mấy node? tên gì?
2. Vì sao `status` của cluster là `yellow`? (gợi ý: replica)
3. Thử `GET _cat/indices?v` — hiện có index hệ thống nào (bắt đầu bằng `.`)?

➡️ Tiếp theo: [Giai đoạn 1 — Index & Mapping](../01-index-mapping/README.md)
