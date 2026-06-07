# Giai đoạn 7 — Vận hành & Nâng cao

> 🏗️ Khung bài học. Nội dung chi tiết + query mẫu sẽ được bổ sung khi bạn học tới đây.

## Sẽ học
- **Alias**: trỏ tên ổn định vào index thật → reindex không downtime
- **Reindex** API: đổi mapping, gộp/tách index
- Index lifecycle: rollover, hot/warm — **ISM** (OpenSearch) ≈ ILM (Elasticsearch)
- **Performance tuning**: shard sizing, `refresh_interval`, tối ưu mapping, `doc_values`
- **Snapshot & restore** (backup/khôi phục)
- Theo dõi cluster: `_cat/*`, hiểu trạng thái **yellow/red**, pending tasks
- Checklist trước khi lên production

## Thử nhanh trong Dev Tools
```
# Tạo alias trỏ vào products
POST _aliases
{ "actions": [ { "add": { "index": "products", "alias": "products_live" } } ] }

# Giờ search qua alias
GET /products_live/_search
```

> ⚠️ **OpenSearch-specific**: quản lý vòng đời index dùng **ISM** (Index State Management), khác tên với **ILM** của Elasticsearch nhưng ý tưởng tương tự.

## ✅ Checklist: xem [ROADMAP.md](../../ROADMAP.md#-giai-đoạn-7--vận-hành--nâng-cao)

🎉 Hoàn thành lộ trình! Quay lại [ROADMAP.md](../../ROADMAP.md) đánh dấu tiến độ.
