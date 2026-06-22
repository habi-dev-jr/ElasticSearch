# Giai đoạn 2 — Text Analysis (Phân tích văn bản)

> Mục tiêu: hiểu cơ chế ES biến text thành token để index & search, tự xây custom analyzer, debug khi search sai.

---

## 1. Inverted Index — vì sao full-text search nhanh

Khi bạn index document, ES không lưu text nguyên mà xây dựng **inverted index** — bảng ánh xạ ngược từ token sang danh sách document chứa nó.

**Ví dụ:** index 3 document:
```
doc1: "Laptop Dell XPS 13"
doc2: "Laptop Apple MacBook Pro"
doc3: "Dell Monitor UltraSharp"
```

Inverted index sinh ra:
```
"laptop"      → [doc1, doc2]
"dell"        → [doc1, doc3]
"xps"         → [doc1]
"apple"       → [doc2]
"macbook"     → [doc2]
"pro"         → [doc2]
"monitor"     → [doc3]
"ultrasharp"  → [doc3]
"13"          → [doc1]
```

Khi search `"dell laptop"`, ES tra bảng: `dell → [doc1, doc3]` ∩ `laptop → [doc1, doc2]` → **doc1** khớp cả hai → trả về ngay, không quét toàn bộ document.

---

### Chỉ `text` và `keyword` mới có inverted index

Trong tất cả data types của ES, **chỉ 2 kiểu string** được xây dựng inverted index:

| Data type | Có inverted index? | Ghi chú |
|---|---|---|
| `text` | ✅ | Qua analyzer — token bị tách, lowercase... |
| `keyword` | ✅ | Không qua analyzer — lưu nguyên chuỗi |
| `long`, `integer`, `float`… | ❌ | Dùng BKD tree (tìm theo range nhanh) |
| `date` | ❌ | Dùng BKD tree |
| `boolean` | ❌ | Dùng bitset |
| `geo_point`, `geo_shape` | ❌ | Dùng BKD tree / geo index |
| `object`, `nested` | ❌ | Các field con bên trong mới được index riêng |

> Các kiểu số/ngày/geo không cần inverted index vì chúng tìm kiếm theo range (`>, <, between`) chứ không phải khớp token — BKD tree tối ưu hơn cho bài toán đó.

---

### Cách `text` xây inverted index

`text` đi qua **analyzer pipeline** trước khi lưu vào inverted index. Mỗi token trong pipeline là 1 entry riêng.

**Ví dụ** field `name` kiểu `text`, analyzer `standard`:

```
Giá trị gốc: "Laptop Dell XPS 13"
                    ↓ analyzer (tách từ + lowercase)
Token:   ["laptop", "dell", "xps", "13"]
                    ↓
Inverted index:
  "laptop" → [doc1]
  "dell"   → [doc1]
  "xps"    → [doc1]
  "13"     → [doc1]
```

Kết quả: search `"dell"`, `"laptop"`, hay `"xps"` đều tìm ra doc1. Search `"DELL"` cũng ra vì query cũng lowercase qua cùng analyzer.

**Không thể** dùng `text` để sort hay aggregation vì inverted index chỉ lưu token đơn lẻ, không còn chuỗi gốc để so sánh thứ tự.

---

### Cách `keyword` xây inverted index

`keyword` **không qua analyzer** — lưu nguyên chuỗi gốc vào inverted index như 1 token duy nhất.

**Ví dụ** field `category` kiểu `keyword`:

```
Giá trị gốc: "Laptop Dell XPS 13"
                    ↓ không qua analyzer
Token:   ["Laptop Dell XPS 13"]   ← toàn bộ chuỗi là 1 token
                    ↓
Inverted index:
  "Laptop Dell XPS 13" → [doc1]
```

Kết quả: chỉ search đúng chính xác `"Laptop Dell XPS 13"` mới ra doc1. Search `"laptop"` hay `"dell"` → **không ra**.

`keyword` dùng được cho sort và aggregation vì chuỗi gốc còn nguyên vẹn.

---

### So sánh trực tiếp cùng 1 giá trị

```
Giá trị: "Laptop Dell XPS 13"

┌──────────────────────────────────────────────────────┐
│ Kiểu text (qua standard analyzer)                    │
│                                                      │
│ Inverted index:                                      │
│   "laptop"  → [doc1]                                 │
│   "dell"    → [doc1]                                 │
│   "xps"     → [doc1]                                 │
│   "13"      → [doc1]                                 │
│                                                      │
│ Search "dell"           → ✅ ra                      │
│ Search "laptop xps"     → ✅ ra                      │
│ Search "Laptop Dell XPS 13" → ✅ ra (sau lowercase)  │
│ Sort / Aggregation      → ❌ không được              │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Kiểu keyword (không qua analyzer)                    │
│                                                      │
│ Inverted index:                                      │
│   "Laptop Dell XPS 13" → [doc1]                     │
│                                                      │
│ Search "dell"               → ❌ không ra            │
│ Search "laptop xps"         → ❌ không ra            │
│ Search "Laptop Dell XPS 13" → ✅ ra (khớp chính xác)│
│ Sort / Aggregation          → ✅ được                │
└──────────────────────────────────────────────────────┘
```

> Đây là lý do thực tế hay dùng **multi-field**: `name` kiểu `text` để full-text search, `name.keyword` kiểu `keyword` để sort/aggregate — cùng 1 giá trị, 2 inverted index khác nhau.

---

## 2. Pipeline Analyzer — 3 bước xử lý

Mỗi khi index text hoặc parse query, ES chạy qua pipeline:

```
Input text: "Laptop Dell <b>XPS</b> 13 (2024)!"
                ↓
[1] Character Filter   →  xử lý ký tự thô: bỏ HTML, thay &amp; → &, chuẩn hoá unicode…
                ↓
"Laptop Dell XPS 13 2024"
                ↓
[2] Tokenizer          →  tách thành mảng token theo rule
                ↓
["Laptop", "Dell", "XPS", "13", "2024"]
                ↓
[3] Token Filter       →  biến đổi từng token: lowercase, bỏ stop words, stemming, synonym…
                ↓
["laptop", "dell", "xps", "13", "2024"]   ← lưu vào inverted index
```

> Quan trọng: **query cũng đi qua cùng pipeline** → "Laptop" trong query → "laptop" → khớp với "laptop" trong index.

---

## 3. Analyzer dựng sẵn

### So sánh nhanh

| Analyzer | Tokenizer | Lowercase? | Bỏ số? | Ví dụ output của `"XPS-13 là Tốt!"` |
|---|---|---|---|---|
| `standard` | Unicode word boundary | ✅ | ❌ | `["xps", "13", "là", "tốt"]` |
| `simple` | Tách theo non-letter | ✅ | ✅ bỏ số | `["xps", "là", "tốt"]` |
| `whitespace` | Khoảng trắng | ❌ | ❌ | `["XPS-13", "là", "Tốt!"]` |
| `keyword` | Không tách | ❌ | ❌ | `["XPS-13 là Tốt!"]` |
| `english` | Standard + stemmer EN | ✅ | ❌ | `["xp", "13", "là", "tốt"]` (stem) |

### Query mẫu — kiểm tra từng analyzer

```json
# standard: tách unicode, lowercase, giữ số
GET _analyze
{
  "analyzer": "standard",
  "text": "XPS-13 là Tốt!"
}

# simple: tách theo non-letter, bỏ số
GET _analyze
{
  "analyzer": "simple",
  "text": "XPS-13 là Tốt!"
}

# whitespace: chỉ tách khoảng trắng, giữ nguyên case & dấu câu
GET _analyze
{
  "analyzer": "whitespace",
  "text": "XPS-13 là Tốt!"
}

# keyword: không tách, giữ nguyên toàn chuỗi
GET _analyze
{
  "analyzer": "keyword",
  "text": "XPS-13 là Tốt!"
}
```

---

## 4. Debug bằng `_analyze` API

`_analyze` là công cụ debug số 1 — dùng khi search không ra kết quả mong muốn. Ý tưởng cốt lõi: **token lúc index phải khớp token lúc search** — nếu search không ra, chạy `_analyze` trên cả 2 vế để so sánh.

---

### 4.1 Dùng built-in analyzer

Cách đơn giản nhất — chỉ định tên analyzer và text cần kiểm tra:

```json
GET _analyze
{
  "analyzer": "standard",
  "text": "Laptop Dell XPS 13 (2024) — Mỏng Nhẹ!"
}
```

**Response trả về:**
```json
{
  "tokens": [
    { "token": "laptop",  "start_offset": 0,  "end_offset": 6,  "type": "<ALPHANUM>", "position": 0 },
    { "token": "dell",    "start_offset": 7,  "end_offset": 11, "type": "<ALPHANUM>", "position": 1 },
    { "token": "xps",     "start_offset": 12, "end_offset": 15, "type": "<ALPHANUM>", "position": 2 },
    { "token": "13",      "start_offset": 16, "end_offset": 18, "type": "<NUM>",      "position": 3 },
    { "token": "2024",    "start_offset": 20, "end_offset": 24, "type": "<NUM>",      "position": 4 },
    { "token": "mỏng",    "start_offset": 27, "end_offset": 31, "type": "<ALPHANUM>", "position": 5 },
    { "token": "nhẹ",     "start_offset": 32, "end_offset": 35, "type": "<ALPHANUM>", "position": 6 }
  ]
}
```

Các field trong mỗi token:
| Field | Ý nghĩa |
|---|---|
| `token` | Giá trị token sau khi qua toàn bộ pipeline — đây là thứ được lưu vào inverted index |
| `start_offset` / `end_offset` | Vị trí byte của token trong text gốc — dùng để highlight kết quả |
| `type` | Loại token: `<ALPHANUM>` (chữ/số), `<NUM>` (số), `<HANGUL>`... |
| `position` | Thứ tự token — dùng cho phrase query (`match_phrase`) kiểm tra vị trí tương đối |

---

### 4.2 Dùng analyzer của 1 index cụ thể

Khi index đã có custom analyzer, chạy `_analyze` trực tiếp trên index đó thay vì khai báo lại:

```json
GET /products/_analyze
{
  "analyzer": "my_custom_analyzer",
  "text": "máy tính xách tay dell"
}
```

Hữu ích để kiểm tra synonym, stop words, hay bất kỳ config nào đã khai báo trong `settings.analysis` của index đó mà không cần copy lại.

---

### 4.3 Dùng field cụ thể

Thay vì chỉ định tên analyzer, chỉ định **tên field** — ES tự lấy analyzer mà field đó đang dùng:

```json
GET /products/_analyze
{
  "field": "description",
  "text": "Laptop Dell XPS 13"
}
```

Đây là cách **chính xác nhất** để debug vì nó tái hiện đúng 100% những gì xảy ra lúc index document vào field đó. Nếu field dùng `search_analyzer` khác, bạn cần test cả 2:

```json
# Giả lập lúc INDEX — dùng analyzer của field
GET /products/_analyze
{
  "field": "description",
  "text": "Laptop Dell XPS 13"
}

# Giả lập lúc SEARCH — dùng search_analyzer (nếu có khai báo riêng)
GET /products/_analyze
{
  "analyzer": "standard",
  "text": "Laptop Dell XPS 13"
}
```

So sánh output 2 query này: nếu token không khớp → đó là nguyên nhân search không ra kết quả.

---

### 4.4 Tự ráp pipeline để test nhanh

Không cần tạo index hay khai báo analyzer — ráp tạm một pipeline ngay trong request:

```json
GET _analyze
{
  "tokenizer": "standard",
  "filter": ["lowercase", "stop"],
  "text": "The Quick Brown Fox Jumps Over The Lazy Dog"
}
```

Output: `["quick", "brown", "fox", "jumps", "lazy", "dog"]` — "the", "over" bị stop filter loại.

Bạn có thể ráp cả `char_filter`:

```json
GET _analyze
{
  "char_filter": ["html_strip"],
  "tokenizer": "standard",
  "filter": ["lowercase"],
  "text": "<p>Laptop <b>Dell</b> XPS 13</p>"
}
```

Output: `["laptop", "dell", "xps", "13"]` — HTML tags bị bỏ trước khi tokenize.

---

### 4.5 Workflow debug thực tế

Kịch bản: bạn index sản phẩm "Máy Tính Xách Tay Dell" nhưng search "laptop dell" không ra. Quy trình debug:

**Bước 1 — Xem field đang dùng analyzer nào:**
```json
GET /products/_mapping
```
Tìm field `name` → xem `"analyzer"` là gì, ví dụ `"vi_analyzer"`.

**Bước 2 — Giả lập lúc index:**
```json
GET /products/_analyze
{
  "field": "name",
  "text": "Máy Tính Xách Tay Dell"
}
```
→ Token sinh ra: `["máy", "tính", "xách", "tay", "dell"]`

**Bước 3 — Giả lập lúc search:**
```json
GET /products/_analyze
{
  "field": "name",
  "text": "laptop dell"
}
```
→ Token sinh ra: `["laptop", "dell"]`

**Bước 4 — So sánh:** `"laptop"` không có trong index (chỉ có `"máy"`, `"tính"`, `"xách"`, `"tay"`) → **nguyên nhân**: thiếu synonym `laptop = máy tính xách tay`.

**Bước 5 — Fix:** thêm synonym filter vào `vi_analyzer`, reindex lại → search ra đúng.

---

### 4.6 Các lỗi phổ biến phát hiện qua `_analyze`

| Triệu chứng | Nguyên nhân thường gặp | Cách kiểm tra |
|---|---|---|
| Search "Dell" không ra, "dell" thì ra | Field không có `lowercase` filter | `_analyze` → xem token có lowercase không |
| Search từ đầy đủ ra, search một phần không ra | Thiếu `ngram` / `edge_ngram` | `_analyze` → token có sinh prefix không |
| Search "laptop" không ra "máy tính xách tay" | Thiếu synonym filter | `_analyze` → token synonym có xuất hiện không |
| Search cụm từ đúng thứ tự không ra | `position` bị lệch do filter | `_analyze` → xem `position` từng token |
| Search "running" không ra "run" | Thiếu stemmer | `_analyze` → token có bị stem không |

---

## 5. Custom Analyzer

Khai báo trong `settings.analysis` khi tạo index.

### Cấu trúc

```json
PUT /my_index
{
  "settings": {
    "analysis": {
      "char_filter": {
        "html_strip_filter": {
          "type": "html_strip"
        }
      },
      "tokenizer": {
        "my_tokenizer": {
          "type": "standard"
        }
      },
      "filter": {
        "my_stop": {
          "type": "stop",
          "stopwords": ["và", "của", "là", "the", "a", "an"]
        },
        "my_synonym": {
          "type": "synonym",
          "synonyms": [
            "laptop, máy tính xách tay",
            "điện thoại, phone, smartphone"
          ]
        },
        "my_stemmer": {
          "type": "stemmer",
          "language": "english"
        }
      },
      "analyzer": {
        "my_custom_analyzer": {
          "type": "custom",
          "char_filter": ["html_strip_filter"],
          "tokenizer": "my_tokenizer",
          "filter": ["lowercase", "my_stop", "my_synonym"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "description": {
        "type": "text",
        "analyzer": "my_custom_analyzer"
      }
    }
  }
}
```

### Các Token Filter phổ biến

| Filter | Tác dụng | Ví dụ |
|---|---|---|
| `lowercase` | Chuyển về chữ thường | `"DELL"` → `"dell"` |
| `uppercase` | Chuyển về chữ hoa | `"dell"` → `"DELL"` |
| `stop` | Bỏ stop words | `"the laptop"` → `["laptop"]` |
| `synonym` | Mở rộng / thay thế đồng nghĩa | `"laptop"` → `["laptop", "máy tính xách tay"]` |
| `stemmer` | Đưa về gốc từ (tiếng Anh) | `"running"` → `"run"` |
| `asciifolding` | Bỏ dấu Latin | `"café"` → `"cafe"` |
| `ngram` | Sinh n-gram | `"dell"` → `["d","de","del","dell"]` |
| `edge_ngram` | Sinh n-gram từ đầu chuỗi | `"dell"` → `["d","de","del","dell"]` (dùng cho autocomplete) |
| `trim` | Bỏ khoảng trắng đầu cuối | `" dell "` → `"dell"` |
| `unique` | Bỏ token trùng trong cùng field | `["dell","dell","xps"]` → `["dell","xps"]` |
| `reverse` | Đảo ngược token | `"dell"` → `"lled"` |
| `length` | Lọc token theo độ dài | bỏ token < 2 ký tự |
| `truncate` | Cắt token quá dài | giới hạn tối đa N ký tự |

### Các Character Filter phổ biến

| Filter | Tác dụng |
|---|---|
| `html_strip` | Bỏ HTML tags: `<b>Dell</b>` → `Dell` |
| `mapping` | Thay thế ký tự theo bảng map: `©` → `copyright` |
| `pattern_replace` | Thay thế theo regex |

---

## 6. `search_analyzer` — analyzer riêng cho query

Mặc định, ES dùng cùng 1 analyzer cho lúc **index** và lúc **search**. Nhưng bạn có thể tách ra:

```json
"description": {
  "type": "text",
  "analyzer": "my_custom_analyzer",
  "search_analyzer": "standard"
}
```

Khi nào cần? Ví dụ: index với `edge_ngram` (sinh nhiều token prefix cho autocomplete), nhưng search chỉ cần `standard` — nếu search cũng qua `edge_ngram` thì query sẽ bị tách vụn không đúng.

---

## 7. Xử lý tiếng Việt — ICU Analyzer

Analyzer `standard` xử lý tiếng Việt ở mức cơ bản (tách được từ do tiếng Việt dùng khoảng trắng phân cách âm tiết), nhưng không normalize dấu tốt.

### Cài plugin ICU

```bash
# Nếu dùng Elasticsearch tự cài
bin/elasticsearch-plugin install analysis-icu

# Nếu dùng Docker
docker exec -it elasticsearch \
  bin/elasticsearch-plugin install analysis-icu
# Sau đó restart container
```

### Dùng `icu_analyzer`

```json
GET _analyze
{
  "analyzer": "icu_analyzer",
  "text": "Máy tính xách tay Dell XPS 13"
}
```

### Custom analyzer tiếng Việt thực tế

```json
PUT /products_vi
{
  "settings": {
    "analysis": {
      "filter": {
        "vi_stop": {
          "type": "stop",
          "stopwords": ["và", "của", "là", "có", "trong", "được", "cho", "với", "các", "những"]
        },
        "vi_synonym": {
          "type": "synonym",
          "synonyms": [
            "laptop, máy tính xách tay, notebook",
            "điện thoại, phone, smartphone, di động",
            "tai nghe, headphone, earphone"
          ]
        }
      },
      "analyzer": {
        "vi_analyzer": {
          "type": "custom",
          "tokenizer": "icu_tokenizer",
          "filter": ["icu_normalizer", "vi_stop", "vi_synonym", "lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "vi_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      }
    }
  }
}
```

---

## 8. Tổng hợp luồng hoạt động

```
                ┌─────────────────────────────────┐
    INDEX       │  text → char_filter → tokenizer  │
    time        │       → token_filter → tokens    │
                │       → inverted index            │
                └─────────────────────────────────┘
                             ↕ khớp token
                ┌─────────────────────────────────┐
    SEARCH      │  query → search_analyzer         │
    time        │        → tokens → lookup index   │
                └─────────────────────────────────┘
```

**Quy tắc vàng:** token lúc search phải khớp token lúc index → nếu index lowercase thì search cũng phải lowercase → dùng cùng analyzer (hoặc analyzer tương thích).

---

## ✅ Checklist hoàn thành

- [ ] Giải thích được inverted index là gì và tại sao nhanh
- [ ] Phân biệt 4 analyzer dựng sẵn: `standard`, `simple`, `whitespace`, `keyword`
- [ ] Dùng `_analyze` API debug token của 1 đoạn text
- [ ] Tạo index với custom analyzer có lowercase + stop words
- [ ] Thêm synonym filter và kiểm tra search "laptop" ra được "máy tính xách tay"
- [ ] Hiểu khi nào cần `search_analyzer` riêng

## 📝 Bài tập

1. Dùng `_analyze` API với `standard` và `simple` cho câu `"Sản phẩm Dell XPS-13 2024"` — so sánh output.
2. Tạo index `products_v2` với custom analyzer: lowercase + stop words tiếng Việt + synonym `"laptop = máy tính xách tay"`.
3. Index 2 document: một dùng từ "laptop", một dùng "máy tính xách tay" → search `"laptop"` → kiểm tra cả 2 có ra không.
4. Thêm `edge_ngram` filter vào analyzer, index từ "dell" → dùng `_analyze` xem các prefix token sinh ra (dùng cho autocomplete).
5. Xem mapping của index vừa tạo: `GET /products_v2/_settings` và `GET /products_v2/_mapping`.

---

➡️ Tiếp theo: [Giai đoạn 3 — Query DSL cơ bản](../03-query-dsl-co-ban/README.md)
