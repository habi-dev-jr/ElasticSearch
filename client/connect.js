// Module kết nối dùng chung cho toàn bộ bài học Node.js.
// Import: import { client } from "../client/connect.js";
import { Client } from "@opensearch-project/opensearch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Nạp biến môi trường từ file .env ở thư mục gốc dự án
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

export const client = new Client({
  node: process.env.OPENSEARCH_NODE || "https://localhost:9200",
  auth: {
    username: process.env.OPENSEARCH_USERNAME || "admin",
    password: process.env.OPENSEARCH_PASSWORD || "admin",
  },
  ssl: {
    // OpenSearch dùng self-signed cert -> tắt verify trong môi trường học.
    // KHÔNG dùng cấu hình này ở production.
    rejectUnauthorized:
      process.env.OPENSEARCH_SSL_REJECT_UNAUTHORIZED === "true",
  },
});
