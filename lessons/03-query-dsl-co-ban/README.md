# Giai đoạn 3 — Query DSL cơ bản

> 🏗️ Khung bài học. Nội dung chi tiết + query mẫu sẽ được bổ sung khi bạn học tới đây.
> Cần dữ liệu mẫu: chạy `npm run seed:products` trước.

## Sẽ học
- **Query context vs Filter context** (tính điểm relevance vs chỉ lọc đúng/sai — filter được cache, nhanh hơn)
- Full-text: `match`, `match_phrase`
- Term-level: `term`, `terms`, `range`, `exists`, `prefix`, `wildcard`
- Tổ hợp với **`bool`**: `must` (AND, tính điểm), `should` (OR), `must_not` (NOT), `filter` (lọc, không tính điểm)
- `sort`, phân trang `from`/`size`, chọn field `_source`

## Thử nhanh trong Dev Tools
```
GET /products/_search
{
  "query": {
    "bool": {
      "must":   [ { "match": { "name": "laptop" } } ],
      "filter": [ { "range": { "price": { "lte": 35000000 } } } ]
    }
  }
}
```

## ✅ Checklist: xem [ROADMAP.md](../../ROADMAP.md#-giai-đoạn-3--query-dsl-cơ-bản)

➡️ Tiếp theo: [Giai đoạn 4 — Search nâng cao](../04-search-nang-cao/README.md)
