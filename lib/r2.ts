import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 Client Configuration
const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET;
const publicUrl = (process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId || 'missing-account-id'}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})

export function assertR2Configured() {
  const missing = [
    !accountId && 'R2_ACCOUNT_ID',
    !accessKeyId && 'R2_ACCESS_KEY_ID',
    !secretAccessKey && 'R2_SECRET_ACCESS_KEY',
    !bucketName && 'R2_BUCKET_NAME',
    !publicUrl && 'R2_PUBLIC_URL',
  ].filter(Boolean);
  if (missing.length) throw new Error(`Cloudflare R2 is not configured: missing ${missing.join(', ')}`);
  try {
    const parsed = new URL(publicUrl);
    if (parsed.protocol !== 'https:') throw new Error();
  } catch {
    throw new Error('Cloudflare R2 is not configured: R2_PUBLIC_URL must be an HTTPS URL');
  }
}

/**
 * อัปโหลดไฟล์ไปยัง R2
 */
export async function uploadToR2(
  key: string,
  file: Buffer | Uint8Array | Blob,
  contentType?: string
) {
  assertR2Configured();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await r2Client.send(command)

  // Return public URL
  return `${publicUrl}/${key}`
}

/**
 * ดึงไฟล์จาก R2
 */
export async function getFromR2(key: string) {
  assertR2Configured();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  const response = await r2Client.send(command)
  return response.Body
}

/**
 * ลบไฟล์จาก R2
 */
export async function deleteFromR2(key: string) {
  assertR2Configured();
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * สร้าง Presigned URL สำหรับอัปโหลดโดยตรง (จาก client-side)
 */
export async function getPresignedUploadUrl(key: string, expiresIn: number = 3600, contentType?: string, contentLength?: number) {
  assertR2Configured();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  })

  return await getSignedUrl(r2Client, command, { expiresIn, signableHeaders: new Set(['content-type', 'content-length']) })
}

export async function inspectR2Upload(key: string) {
  assertR2Configured();
  const metadata = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
  const object = await r2Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key, Range: 'bytes=0-63' }))
  return { size: metadata.ContentLength ?? 0, contentType: metadata.ContentType ?? '',
    bytes: await object.Body!.transformToByteArray() }
}

export async function publishR2Upload(sourceKey: string, destinationKey: string, contentType: string) {
  assertR2Configured();
  await r2Client.send(new CopyObjectCommand({ Bucket: bucketName,
    CopySource: `${bucketName}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`,
    Key: destinationKey, ContentType: contentType, MetadataDirective: 'REPLACE' }))
  await deleteFromR2(sourceKey)
  return `${publicUrl}/${destinationKey}`
}

/**
 * สร้าง Presigned URL สำหรับดาวน์โหลด
 */
export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600) {
  assertR2Configured();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

export { r2Client, bucketName, publicUrl }
