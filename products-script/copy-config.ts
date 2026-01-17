#!/usr/bin/env node

/**
 * Script to copy products-config.ts to functions directory
 * This can be run independently or as part of build process
 */

import { copyFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceConfigPath = join(__dirname, "./products-config.ts");
const destConfigPath = resolve(
  __dirname,
  "../functions/src/utils/constants.ts"
);

try {
  if (!existsSync(sourceConfigPath)) {
    console.error(`❌ products-config.ts không tìm thấy: ${sourceConfigPath}`);
    process.exit(1);
  }

  // Đảm bảo thư mục đích tồn tại
  const destDir = dirname(destConfigPath);
  if (!existsSync(destDir)) {
    console.log(`📁 Tạo thư mục: ${destDir}`);
    mkdirSync(destDir, { recursive: true });
  }

  // Copy file
  copyFileSync(sourceConfigPath, destConfigPath);
  console.log(`✅ Đã copy products-config.ts vào: ${destConfigPath}`);
} catch (error) {
  console.error(`❌ Lỗi khi copy products-config:`, (error as Error).message);
  process.exit(1);
}
