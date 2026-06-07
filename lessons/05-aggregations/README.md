# Giai đoạn 5 — Aggregations

> 🏗️ Khung bài học. Nội dung chi tiết + query mẫu sẽ được bổ sung khi bạn học tới đây.

## Sẽ học
- **Metric aggs**: `avg`, `sum`, `min`, `max`, `stats`, `cardinality` (đếm distinct)
- **Bucket aggs**: `terms`, `range`, `histogram`, `date_histogram`
- **Nested aggregations** (sub-aggregations — agg trong agg)
- **Pipeline aggregations**: `bucket_sort`, `derivative`, `cumulative_sum`
- Kết hợp `query` + `aggs` để làm dashboard

## Thử nhanh trong Dev Tools
```
GET /products/_search
{
  "size": 0,
  "aggs": {
    "theo_category": {
      "terms": { "field": "category" },
      "aggs": { "gia_trung_binh": { "avg": { "field": "price" } } }
    }
  }
}
```
> `"size": 0` để chỉ lấy kết quả thống kê, bỏ qua danh sách document.

## ✅ Checklist: xem [ROADMAP.md](../../ROADMAP.md#-giai-đoạn-5--aggregations)

➡️ Tiếp theo: [Giai đoạn 6 — Tích hợp Node.js](../06-nodejs-integration/README.md)
