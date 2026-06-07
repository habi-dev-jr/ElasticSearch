# Giai đoạn 2 — Text Analysis (Phân tích văn bản)

> 🏗️ Khung bài học. Nội dung chi tiết + query mẫu sẽ được bổ sung khi bạn học tới đây.

## Sẽ học
- **Inverted index**: vì sao full-text search nhanh
- Pipeline Analyzer: **Character filter → Tokenizer → Token filter**
- Analyzer dựng sẵn: `standard`, `simple`, `whitespace`, `keyword`
- Debug bằng `_analyze` API
- Custom analyzer: lowercase, stop words, synonym, stemming
- Xử lý **tiếng Việt** (ICU analyzer)

## Thử nhanh trong Dev Tools
```
# Xem một câu được tách thành token thế nào
GET _analyze
{
  "analyzer": "standard",
  "text": "Laptop Dell XPS 13 (2024) — Mỏng Nhẹ!"
}
```

## ✅ Checklist: xem [ROADMAP.md](../../ROADMAP.md#-giai-đoạn-2--text-analysis-phân-tích-văn-bản)

➡️ Tiếp theo: [Giai đoạn 3 — Query DSL cơ bản](../03-query-dsl-co-ban/README.md)
