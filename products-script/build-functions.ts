#!/usr/bin/env node

/**
 * Build script to build applications and copy to products-script/products/{productId}/private/build.html
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import readline from "readline";
import { PRODUCTS_CONFIG } from "./products-config.ts";

interface Product {
  id: string;
  name: string;
  buildDir: string;
}

interface PackageJson {
  version?: string;
}

interface DataJson {
  version?: string;
  [key: string]: unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map PRODUCTS_CONFIG to PRODUCTS with resolved buildDir paths
const PRODUCTS: Product[] = PRODUCTS_CONFIG.map((product) => ({
  id: product.id,
  name: product.name,
  buildDir: resolve(__dirname, product.buildDir),
}));

const BUILD_FOLDER_NAME = "dist";
const BUILD_FILE_NAME = "index.html";
const DEST_FOLDER_NAME = "private";
const DEST_FILE_NAME = "build.html";

/**
 * Prompt user to select a product
 */
function selectProduct(): Promise<Product> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n📦 Danh sách sản phẩm:");
    PRODUCTS.forEach((product, index) => {
      console.log(`  ${index + 1}. (${product.id})`);
    });

    rl.question("Chọn sản phẩm muốn build (nhập số): ", (answer) => {
      rl.close();
      const choice = parseInt(answer, 10);

      if (choice >= 1 && choice <= PRODUCTS.length) {
        resolve(PRODUCTS[choice - 1]);
      } else {
        console.error("❌ Lựa chọn không hợp lệ!");
        reject(new Error("Invalid product selection"));
        process.exit(1);
      }
    });
  });
}

/**
 * Copy products-config.ts to functions directory
 */
function copyProductsConfigToFunctions(): boolean {
  try {
    const sourceConfigPath = join(__dirname, "./products-config.ts");
    const destConfigPath = resolve(
      __dirname,
      "../nestora/functions/src/utils/products-config.ts"
    );

    if (!existsSync(sourceConfigPath)) {
      console.log(`   ⚠️  products-config.ts không tìm thấy: ${sourceConfigPath}`);
      return false;
    }

    // Đảm bảo thư mục đích tồn tại
    const destDir = dirname(destConfigPath);
    if (!existsSync(destDir)) {
      console.log(`   📁 Tạo thư mục: ${destDir}`);
      mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    copyFileSync(sourceConfigPath, destConfigPath);
    console.log(`   ✅ Đã copy products-config.ts vào: ${destConfigPath}`);

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Lỗi khi copy products-config: ${errorMessage}`);
    return false;
  }
}

/**
 * Update version in product data.json from package.json
 */
function updateProductVersion(product: Product): boolean {
  try {
    // Đọc version từ package.json trong buildDir
    const packageJsonPath = join(product.buildDir, "package.json");
    if (!existsSync(packageJsonPath)) {
      console.log(`   ⚠️  package.json không tìm thấy: ${packageJsonPath}`);
      return false;
    }

    const packageJson: PackageJson = JSON.parse(
      readFileSync(packageJsonPath, "utf-8")
    );
    const version = packageJson.version;

    if (!version) {
      console.log(`   ⚠️  Không tìm thấy version trong package.json`);
      return false;
    }

    // Đọc và cập nhật data.json
    const dataJsonPath = join(
      __dirname,
      "./products",
      product.id,
      "public",
      "data.json"
    );

    if (!existsSync(dataJsonPath)) {
      console.log(`   ⚠️  data.json không tìm thấy: ${dataJsonPath}`);
      return false;
    }

    const dataJson: DataJson = JSON.parse(readFileSync(dataJsonPath, "utf-8"));
    dataJson.version = version;

    // Lưu lại file data.json
    writeFileSync(dataJsonPath, JSON.stringify(dataJson, null, 2), "utf-8");
    console.log(`   ✅ Đã cập nhật version: ${version} vào data.json`);

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Lỗi khi cập nhật version: ${errorMessage}`);
    return false;
  }
}

/**
 * Build a single product
 */
function buildProduct(product: Product): boolean {
  console.log(`\n🔨 Đang build: ${product.id}...`);
  console.log(`   Thư mục build: ${product.buildDir}`);

  try {
    // Kiểm tra thư mục build có tồn tại không
    if (!existsSync(product.buildDir)) {
      throw new Error(`Thư mục build không tồn tại: ${product.buildDir}`);
    }

    // Chạy build command
    // console.log("   Đang chạy npm run build...");
    execSync("npm run build", {
      cwd: product.buildDir,
      stdio: "inherit",
    });

    // Đường dẫn file sau khi build
    const builtFilePath = join(
      product.buildDir,
      BUILD_FOLDER_NAME,
      BUILD_FILE_NAME
    );

    // Kiểm tra file đã build có tồn tại không
    if (!existsSync(builtFilePath)) {
      throw new Error(`File build không tìm thấy: ${builtFilePath}`);
    }

    const destDir = join(__dirname, "./products", product.id, DEST_FOLDER_NAME);

    // Đảm bảo thư mục đích tồn tại
    if (!existsSync(destDir)) {
      console.log(`   📁 Tạo thư mục: ${destDir}`);
      mkdirSync(destDir, { recursive: true });
    }

    // Copy file vào thư mục đích
    const destFilePath = join(destDir, DEST_FILE_NAME);
    copyFileSync(builtFilePath, destFilePath);
    console.log(`   ✅ Đã copy file vào: ${destFilePath}`);

    // Cập nhật version từ package.json vào data.json
    console.log("   📝 Đang cập nhật version...");
    updateProductVersion(product);

    console.log(`\n✅ Hoàn thành build: ${product.id}\n`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Lỗi khi build ${product.id}: ${errorMessage}`);
    return false;
  }
}

/**
 * Upload to Google Cloud Storage
 * Upload build.html files to GCS bucket nestora-internal-f
 */
async function uploadToGCS(product: Product): Promise<boolean> {
  const productsScriptDir = resolve(__dirname, "./products", product.id);
  const gcsSyncScript = resolve(__dirname, "./gcs-sync.ts");

  console.log("\n☁️  Đang upload lên Google Cloud Storage...");
  console.log(`   Script: ${gcsSyncScript}`);

  try {
    // Kiểm tra script có tồn tại không
    if (!existsSync(gcsSyncScript)) {
      throw new Error(`Script gcs-sync.ts không tìm thấy: ${gcsSyncScript}`);
    }

    // Chạy gcs-sync script
    // console.log("   Đang chạy ", `ts-node ${gcsSyncScript} ${productsScriptDir}`);
    execSync(`ts-node ${gcsSyncScript} ${productsScriptDir}`, {
      stdio: "inherit",
    });

    console.log("\n✅ Upload thành công!\n");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Lỗi khi upload:", errorMessage);
    return false;
  }
}

/**
 * Ask user if they want to upload to GCS
 */
function askUploadGCS(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "\n☁️  Sau khi build xong, bạn có muốn upload lên Google Cloud Storage? (y/n): ",
      (answer) => {
        rl.close();
        const normalized = answer.toLowerCase().trim();
        resolve(
          normalized === "y" || normalized === "yes" || normalized === "có"
        );
      }
    );
  });
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log("🚀 Build Script cho Nestora\n");

  // Copy products-config.ts vào functions ngay từ đầu
  console.log("📋 Đang copy products-config vào functions...");
  copyProductsConfigToFunctions();

  const selected = await selectProduct();

  const shouldUploadGCS = await askUploadGCS();

  let buildSuccess = false;

  buildSuccess = buildProduct(selected);

  // Nếu build thành công, thực hiện deploy và upload nếu được chọn
  if (buildSuccess) {
    if (shouldUploadGCS) {
      await uploadToGCS(selected);
    } else {
      console.log("\n⏭️  Bỏ qua upload GCS.");
    }
  }
}

// Chạy script
main().catch((error) => {
  console.error("❌ Lỗi:", error);
  process.exit(1);
});
