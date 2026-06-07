# Đối chiếu OpenSearch ↔ Elasticsearch

OpenSearch được AWS fork từ **Elasticsearch 7.10** (năm 2021) sau khi Elastic đổi license. Phần **lõi** (Lucene, Query DSL, mapping, analysis, aggregations, REST API) **gần như giống hệt**, nên kiến thức bạn học chuyển đổi tốt sang Elasticsearch. Dưới đây là những khác biệt cần lưu ý.

## ✅ Giống nhau (học bên này dùng được bên kia)
- Index, document, shard, replica, mapping, data types
- Query DSL: `match`, `term`, `bool`, `range`, `multi_match`, `fuzzy`...
- Analysis: analyzer, tokenizer, token filter, `_analyze` API
- Aggregations: metric, bucket, pipeline
- `_bulk`, `_reindex`, alias, snapshot, `_cat` APIs
- Hầu hết Dev Tools / console syntax

## ⚠️ Khác biệt chính

| Chủ đề | OpenSearch | Elasticsearch (7.10+ / 8.x) |
|---|---|---|
| **Client Node.js** | `@opensearch-project/opensearch` | `@elastic/elasticsearch` |
| **Mật khẩu mặc định** | `admin/admin` (2.11), bắt buộc đặt password từ 2.12 | Tự sinh password khi start (8.x) |
| **Bảo mật** | Security plugin (miễn phí, có sẵn) | X-Pack Security (free tier ở 8.x) |
| **Truy vấn SQL/PPL** | SQL plugin + **PPL** (Piped Processing Language) | SQL + **ES\|QL** (ngôn ngữ mới của ES 8.11+) |
| **Machine Learning** | ML Commons plugin | X-Pack ML (license) |
| **Index lifecycle** | **ISM** (Index State Management) | **ILM** (Index Lifecycle Management) |
| **Giao diện** | OpenSearch Dashboards | Kibana |
| **Vector search** | k-NN plugin | Bản dense_vector / kNN tích hợp |
| **Phiên bản response** | `version.distribution = "opensearch"` | không có field này |

## 📌 Lưu ý khi đọc tài liệu
- Tài liệu OpenSearch: https://opensearch.org/docs/2.11/
- Vì OpenSearch = ES 7.10, **tài liệu Elasticsearch 7.10** cũng áp dụng tốt cho phần lõi:
  https://www.elastic.co/guide/en/elasticsearch/reference/7.10/index.html
- Tránh dùng tính năng **chỉ có ở ES 8.x** (runtime fields nâng cao, ES|QL...) vì OpenSearch không có.

> Trong các bài học, chỗ nào dùng tính năng riêng của OpenSearch sẽ được ghi chú: `// ⚠️ OpenSearch-specific`.
