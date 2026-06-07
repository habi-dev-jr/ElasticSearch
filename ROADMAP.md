# 🗺️ Lộ trình học Elasticsearch (qua OpenSearch 2.11.1)

> Đánh dấu `[x]` vào ô khi hoàn thành để theo dõi tiến độ.
> Mỗi giai đoạn nằm trong một thư mục `lessons/`. Mỗi bài gồm: **lý thuyết** → **query mẫu (Dev Tools)** → **script Node.js** → **bài tập**.

**Môi trường:** OpenSearch 2.11.1 + Dashboards (Docker) · Client: Node.js + Dev Tools
**Lưu ý:** OpenSearch là bản fork của Elasticsearch 7.10 — phần lõi giống ES. Khác biệt được ghi trong [`docs/opensearch-vs-elasticsearch.md`](docs/opensearch-vs-elasticsearch.md).

---

## 📊 Tổng quan tiến độ

| Giai đoạn | Chủ đề | Trạng thái | Tiến độ |
|:---:|---|:---:|:---:|
| 0 | Khởi động & Kiến trúc | ✅ Sẵn sàng | ☐ |
| 1 | Index & Mapping | ✅ Sẵn sàng | ☐ |
| 2 | Text Analysis | 🏗️ Khung | ☐ |
| 3 | Query DSL cơ bản | 🏗️ Khung | ☐ |
| 4 | Search nâng cao | 🏗️ Khung | ☐ |
| 5 | Aggregations | 🏗️ Khung | ☐ |
| 6 | Node.js Integration | 🏗️ Khung | ☐ |
| 7 | Vận hành & Nâng cao | 🏗️ Khung | ☐ |

---

## ✅ Giai đoạn 0 — Khởi động & Kiến trúc nền tảng
📁 [`lessons/00-khoi-dong-kien-truc`](lessons/00-khoi-dong-kien-truc)

- [ ] Khởi động cluster bằng Docker (`docker compose up -d`)
- [ ] Hiểu mô hình: **Cluster → Node → Index → Shard → Replica**
- [ ] Hiểu **Document** và mô hình lưu trữ JSON (so với bảng SQL)
- [ ] Làm quen **REST API** và **Dev Tools** trong Dashboards
- [ ] Kiểm tra sức khoẻ cluster: `_cluster/health`, `_cat/nodes`, `_cat/indices`
- [ ] Kết nối thành công bằng Node.js (`npm run ping`)

## ✅ Giai đoạn 1 — Index & Mapping
📁 [`lessons/01-index-mapping`](lessons/01-index-mapping)

- [ ] Tạo / xoá index, xem settings
- [ ] **CRUD document**: index, get, update, delete
- [ ] Phân biệt **dynamic mapping** vs **explicit mapping**
- [ ] Các kiểu dữ liệu: `text` vs `keyword`, `integer`, `date`, `boolean`, `object`, `nested`
- [ ] Nạp dữ liệu hàng loạt bằng **`_bulk`** API
- [ ] Hiểu `_id`, `_source`, versioning, optimistic concurrency control

## 🏗️ Giai đoạn 2 — Text Analysis (Phân tích văn bản)
📁 [`lessons/02-text-analysis`](lessons/02-text-analysis)

- [ ] **Inverted index** hoạt động thế nào
- [ ] Cấu trúc Analyzer: **Character filter → Tokenizer → Token filter**
- [ ] Các analyzer dựng sẵn: `standard`, `simple`, `whitespace`, `keyword`
- [ ] Dùng `_analyze` API để debug
- [ ] Custom analyzer (lowercase, stop words, synonym, stemming)
- [ ] Xử lý **tiếng Việt** (ICU analyzer / icu_tokenizer)

## 🏗️ Giai đoạn 3 — Query DSL cơ bản
📁 [`lessons/03-query-dsl-co-ban`](lessons/03-query-dsl-co-ban)

- [ ] **Query context vs Filter context** (điểm relevance vs lọc đúng/sai)
- [ ] Full-text: `match`, `match_phrase`
- [ ] Term-level: `term`, `terms`, `range`, `exists`, `prefix`, `wildcard`
- [ ] Kết hợp với **`bool`**: `must`, `should`, `must_not`, `filter`
- [ ] Sắp xếp (`sort`), phân trang (`from`/`size`), chọn field (`_source`)

## 🏗️ Giai đoạn 4 — Search nâng cao
📁 [`lessons/04-search-nang-cao`](lessons/04-search-nang-cao)

- [ ] Cơ chế tính điểm **relevance (BM25)** và `_explain`
- [ ] `multi_match` (best_fields, cross_fields, phrase) và boosting
- [ ] **Fuzzy search**, `match_phrase_prefix`, search-as-you-type
- [ ] **Autocomplete**: edge n-gram & completion suggester
- [ ] **Highlight** kết quả tìm kiếm
- [ ] Phân trang sâu: `search_after`, `scroll`, point-in-time

## 🏗️ Giai đoạn 5 — Aggregations
📁 [`lessons/05-aggregations`](lessons/05-aggregations)

- [ ] **Metric aggs**: `avg`, `sum`, `min`, `max`, `stats`, `cardinality`
- [ ] **Bucket aggs**: `terms`, `range`, `histogram`, `date_histogram`
- [ ] **Nested aggregations** (sub-aggregations)
- [ ] **Pipeline aggregations**: `bucket_sort`, `derivative`, `cumulative_sum`
- [ ] Kết hợp query + aggregation cho dashboard phân tích

## 🏗️ Giai đoạn 6 — Tích hợp Node.js
📁 [`lessons/06-nodejs-integration`](lessons/06-nodejs-integration)

- [ ] Cấu trúc service tìm kiếm tái sử dụng
- [ ] CRUD + bulk indexing có xử lý lỗi
- [ ] Xây một **API tìm kiếm sản phẩm** nhỏ (search + filter + facet)
- [ ] Pagination & xử lý kết quả trả về
- [ ] Best practices: retry, bulk helper, connection pooling

## 🏗️ Giai đoạn 7 — Vận hành & Nâng cao
📁 [`lessons/07-van-hanh-nang-cao`](lessons/07-van-hanh-nang-cao)

- [ ] **Alias** và zero-downtime reindex
- [ ] **Reindex** API và thay đổi mapping
- [ ] Index lifecycle: rollover, hot/warm (ISM trong OpenSearch)
- [ ] **Performance tuning**: shard sizing, refresh interval, mapping tối ưu
- [ ] **Snapshot & restore** (backup)
- [ ] Theo dõi cluster: `_cat` APIs, hiểu trạng thái yellow/red
- [ ] Checklist trước khi lên production

---

## 📚 Tài nguyên tham khảo
- OpenSearch Docs: https://opensearch.org/docs/2.11/
- Elasticsearch Guide: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/index.html
- Query DSL: https://opensearch.org/docs/2.11/query-dsl/
- Đối chiếu OpenSearch ↔ Elasticsearch: [`docs/opensearch-vs-elasticsearch.md`](docs/opensearch-vs-elasticsearch.md)
