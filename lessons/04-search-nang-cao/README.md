# Giai đoạn 4 — Search nâng cao

> 🏗️ Khung bài học. Nội dung chi tiết + query mẫu sẽ được bổ sung khi bạn học tới đây.

## Sẽ học
- Cơ chế tính điểm **relevance (BM25)**; debug bằng `_explain`
- `multi_match` (best_fields, cross_fields, phrase) và **boosting** field (`^2`)
- **Fuzzy search** (chịu lỗi gõ sai), `match_phrase_prefix`
- **Autocomplete**: edge n-gram & completion suggester
- **Highlight** đoạn khớp trong kết quả
- Phân trang sâu: `search_after`, `scroll`, point-in-time (PIT)

## Thử nhanh trong Dev Tools
```
GET /products/_search
{
  "query": { "multi_match": { "query": "macbook", "fields": ["name^2", "tags"], "fuzziness": "AUTO" } },
  "highlight": { "fields": { "name": {} } }
}
```

## ✅ Checklist: xem [ROADMAP.md](../../ROADMAP.md#-giai-đoạn-4--search-nâng-cao)

➡️ Tiếp theo: [Giai đoạn 5 — Aggregations](../05-aggregations/README.md)
