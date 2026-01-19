import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

// Get arguments from command line
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(
    "Usage: npm run sync <product-folder-path>"
  );
  console.error("Example: npm run sync ./products/truy-tim-ngoi-vua");
  console.error("Or: npm run sync ./products/memomi");
  console.error("\nThe script will automatically:");
  console.error("  - Sync private/ folder to nestora-internal-f bucket");
  console.error("  - Sync public/ folder to nestora-public-f bucket");
  process.exit(1);
}

const productFolderPath = path.resolve(args[0]);

// Validate product folder
if (!fs.existsSync(productFolderPath)) {
  console.error(`Error: Product folder does not exist: ${productFolderPath}`);
  process.exit(1);
}

if (!fs.statSync(productFolderPath).isDirectory()) {
  console.error(`Error: Path is not a directory: ${productFolderPath}`);
  process.exit(1);
}

// Extract product ID from folder path
const productId = path.basename(productFolderPath);

// Initialize Storage client
const storage = new Storage({
  keyFilename: "./nestora-register-0fb28e95a4d1.json",
});

// Bucket names
const INTERNAL_BUCKET = "nestora-internal-f";
const PUBLIC_BUCKET = "nestora-public-f";

/**
 * Recursively sync a directory to GCS
 */
async function syncDirectory(
  localDirPath: string,
  gcsDirPath: string,
  bucket: any
): Promise<{
  successCount: number;
  errorCount: number;
  skippedCount: number;
  publicUrls: Record<string, string>;
}> {
  const publicUrls: Record<string, string> = {};
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Read all items in directory
  const items = fs.readdirSync(localDirPath);

  if (!items?.length) {
    console.log(`⏭️  Folder is empty`);
  }

  for (const item of items) {
    const localItemPath = path.join(localDirPath, item);
    const stats = fs.statSync(localItemPath);

    // Skip .DS_Store files
    if (item === ".DS_Store") {
      console.log(`⏭️  Skipping .DS_Store: ${item}`);
      continue;
    }

    // If it's a directory, recursively process it
    if (stats.isDirectory()) {
      const nestedGcsPath = gcsDirPath ? `${gcsDirPath}/${item}` : item;
      const nestedResult = await syncDirectory(
        localItemPath,
        nestedGcsPath,
        bucket
      );
      successCount += nestedResult.successCount;
      errorCount += nestedResult.errorCount;
      skippedCount += nestedResult.skippedCount;
      Object.assign(publicUrls, nestedResult.publicUrls);
      continue;
    }

    // Process file
    // Build GCS path (consistent path ensures URL never changes)
    const gcsFilePath = gcsDirPath ? `${gcsDirPath}/${item}` : item;

    try {
      // Check if file exists in GCS and compare metadata
      const gcsFile = bucket.file(gcsFilePath);
      let needsUpload = true;
      let skipReason = "";

      try {
        const [exists] = await gcsFile.exists();
        if (exists) {
          const [metadata] = await gcsFile.getMetadata();
          const localSize = stats.size;
          const localModified = new Date(stats.mtime).getTime();
          const gcsSize =
            typeof metadata.size === "string"
              ? parseInt(metadata.size, 10)
              : metadata.size || 0;
          const gcsModified = metadata.updated
            ? new Date(metadata.updated).getTime()
            : 0;

          // Compare file size and modification time
          if (localSize === gcsSize && localModified <= gcsModified) {
            needsUpload = false;
            skipReason = `(size: ${localSize} bytes, unchanged)`;
          }
        }
      } catch (error) {
        // If we can't check metadata, proceed with upload
        // (file might not exist or there's a permission issue)
      }

      if (!needsUpload) {
        console.log(`⏭️  Skipping unchanged: ${gcsFilePath} ${skipReason}`);
        // Still generate URL for unchanged files
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFilePath}`;
        publicUrls[gcsFilePath] = publicUrl;
        skippedCount++;
        continue;
      }

      console.log(`⬆️  Uploading: ${gcsFilePath}...`);

      // Upload to GCS (will override if exists)
      // Note: Using Uniform bucket-level access + IAM (not ACL)
      await bucket.upload(localItemPath, {
        destination: gcsFilePath,
        metadata: {
          cacheControl: "public, max-age=3600",
        },
      });

      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFilePath}`;
      publicUrls[gcsFilePath] = publicUrl;
      successCount++;

      console.log(`✅ ${gcsFilePath}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to upload ${gcsFilePath}:`, error);
      console.error("");
    }
  }

  return { successCount, errorCount, skippedCount, publicUrls };
}

/**
 * Sync a folder (private or public) to GCS
 */
async function syncFolder(
  localFolderPath: string,
  bucketName: string,
  gcsBasePath: string,
  folderType: "private" | "public"
): Promise<{
  successCount: number;
  errorCount: number;
  skippedCount: number;
  publicUrls: Record<string, string>;
}> {
  console.log(`\n🔄 Syncing ${folderType} folder: ${localFolderPath}`);

  const bucket = storage.bucket(bucketName);
  return await syncDirectory(localFolderPath, gcsBasePath, bucket);
}

/**
 * Sync product folder to GCS
 */
async function syncProductToGCS(): Promise<void> {
  // console.log(`\n🚀 Syncing product: ${productId}`);
  // console.log(`📂 Product folder: ${productFolderPath}\n`);

  const privateFolderPath = path.join(productFolderPath, "private");
  const publicFolderPath = path.join(productFolderPath, "public");

  let totalSuccessCount = 0;
  let totalErrorCount = 0;
  let totalSkippedCount = 0;
  const allPublicUrls: Record<string, string> = {};

  // Sync private folder to internal bucket
  if (fs.existsSync(privateFolderPath) && fs.statSync(privateFolderPath).isDirectory()) {
    const gcsPrivatePath = `products/${productId}/private`;
    const privateResult = await syncFolder(
      privateFolderPath,
      INTERNAL_BUCKET,
      gcsPrivatePath,
      "private"
    );
    totalSuccessCount += privateResult.successCount;
    totalErrorCount += privateResult.errorCount;
    totalSkippedCount += privateResult.skippedCount;
    Object.assign(allPublicUrls, privateResult.publicUrls);
  } else {
    // console.log(`⏭️  Private folder not found, skipping...`);
  }

  // Sync public folder to public bucket
  if (fs.existsSync(publicFolderPath) && fs.statSync(publicFolderPath).isDirectory()) {
    const gcsPublicPath = `products/${productId}/public`;
    const publicResult = await syncFolder(
      publicFolderPath,
      PUBLIC_BUCKET,
      gcsPublicPath,
      "public"
    );
    totalSuccessCount += publicResult.successCount;
    totalErrorCount += publicResult.errorCount;
    totalSkippedCount += publicResult.skippedCount;
    Object.assign(allPublicUrls, publicResult.publicUrls);
  } else {
    console.log(`⏭️  Public folder not found, skipping...`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log(`   ✅ Uploaded: ${totalSuccessCount}`);
  console.log(`   ⏭️  Skipped (unchanged): ${totalSkippedCount}`);
  console.log(`   ❌ Errors: ${totalErrorCount}`);
  console.log("=".repeat(60));


  if (totalErrorCount > 0) {
    process.exit(1);
  }
}

// Run sync
syncProductToGCS().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
