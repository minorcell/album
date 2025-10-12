import { randomUUID } from "crypto";
import sharp from "sharp";
import { TosClient, TosServerCode, TosServerError } from "@volcengine/tos-sdk";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class ConfigurationError extends Error {}

interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  bucket: string;
  uploadPrefix: string;
  thumbnailPrefix: string;
  publicBaseUrl: string;
}

let cachedConfig: StorageConfig | null = null;
let cachedClient: TosClient | null = null;

export class UploadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "UploadError";
    this.statusCode = statusCode;
  }
}

export async function persistImage(file: File) {
  const config = getConfig();
  const client = getClient();

  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError("仅支持 JPG/PNG/GIF/WebP 图片");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("文件大小超出限制 (10MB)");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const originalName = file.name;
  const extension = getExtensionFromFile(file);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const objectKey = buildObjectKey(filename, config);

  await client.putObject({
    bucket: config.bucket,
    key: objectKey,
    body: buffer,
    contentType: file.type,
  });

  const { data: thumbnailBuffer, info: thumbnailInfo } = await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  const thumbnailKey = buildThumbnailKey(filename, config);
  const thumbnailMime = mapSharpFormatToMime(thumbnailInfo.format) ?? file.type;

  await client.putObject({
    bucket: config.bucket,
    key: thumbnailKey,
    body: thumbnailBuffer,
    contentType: thumbnailMime,
  });

  return {
    filename,
    originalName,
  };
}

export async function deleteImageAssets(filename: string) {
  const config = getConfig();
  const client = getClient();

  const keys = [buildObjectKey(filename, config), buildThumbnailKey(filename, config)];

  await Promise.all(
    keys.map(async (key) => {
      try {
        await client.deleteObject({ bucket: config.bucket, key });
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }
      }
    }),
  );
}

export async function getOriginalBuffer(filename: string) {
  return getObjectBuffer(buildObjectKey(filename, getConfig()));
}

export function getPublicObjectUrl(filename: string) {
  const config = getConfig();
  return joinUrl(config.publicBaseUrl, buildObjectKey(filename, config));
}

export function getPublicThumbnailUrl(filename: string) {
  const config = getConfig();
  return joinUrl(config.publicBaseUrl, buildThumbnailKey(filename, config));
}

function getConfig(): StorageConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const accessKeyId = process.env.TOS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.TOS_SECRET_ACCESS_KEY;
  const region = process.env.TOS_REGION;
  const endpoint = process.env.TOS_ENDPOINT;
  const bucket = process.env.TOS_BUCKET;

  if (!accessKeyId || !secretAccessKey || !region || !endpoint || !bucket) {
    throw new ConfigurationError("TOS 存储配置缺失，请检查 AccessKey、SecretKey、Region、Endpoint 与 Bucket 设置");
  }

  const uploadPrefix = sanitizePrefix(
    process.env.TOS_UPLOAD_PREFIX ?? process.env.NEXT_PUBLIC_TOS_UPLOAD_PREFIX ?? "uploads/",
  );

  const thumbnailPrefix = sanitizePrefix(
    process.env.TOS_THUMBNAIL_PREFIX ?? process.env.NEXT_PUBLIC_TOS_THUMBNAIL_PREFIX ?? `${uploadPrefix}thumbnails/`,
  );

  const publicBaseUrl = sanitizeBaseUrl(
    process.env.NEXT_PUBLIC_TOS_BASE_URL ?? process.env.TOS_PUBLIC_BASE_URL ?? "",
  );

  if (!publicBaseUrl) {
    throw new ConfigurationError("未配置 NEXT_PUBLIC_TOS_BASE_URL 或 TOS_PUBLIC_BASE_URL，用于生成图片外链");
  }

  cachedConfig = {
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
    bucket,
    uploadPrefix,
    thumbnailPrefix,
    publicBaseUrl,
  };

  return cachedConfig;
}

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getConfig();

  cachedClient = new TosClient({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.secretAccessKey,
    region: config.region,
    endpoint: config.endpoint,
    secure: true,
  });

  return cachedClient;
}

async function getObjectBuffer(key: string) {
  const config = getConfig();
  const client = getClient();

  const response = await client.getObjectV2({
    bucket: config.bucket,
    key,
    dataType: "buffer",
  });

  return response.data.content;
}

function buildObjectKey(filename: string, config: StorageConfig) {
  return `${config.uploadPrefix}${filename}`;
}

function buildThumbnailKey(filename: string, config: StorageConfig) {
  return `${config.thumbnailPrefix}thumb-${filename}`;
}

function sanitizePrefix(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withoutLeading = trimmed.replace(/^\/+/, "");
  return withoutLeading.endsWith("/") ? withoutLeading : `${withoutLeading}/`;
}

function sanitizeBaseUrl(input: string) {
  const trimmed = input.trim();
  return trimmed.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${base}/${normalizedPath}`;
}

function mapSharpFormatToMime(format?: string) {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "heif":
      return "image/heif";
    default:
      return undefined;
  }
}

function getExtensionFromFile(file: File) {
  if (file.name) {
    const match = /\.([^.]+)$/u.exec(file.name);
    if (match?.[1]) {
      return `.${match[1].toLowerCase()}`;
    }
  }
  return getExtensionFromMime(file.type);
}

function getExtensionFromMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export function isNotFoundError(error: unknown) {
  return error instanceof TosServerError && error.code === TosServerCode.NoSuchKey;
}
