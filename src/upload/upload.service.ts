import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Task attachments: images plus common documents
const ATTACHMENT_TYPES: Record<string, string> = {
  ...CONTENT_TYPES,
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
};

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('aws.bucket');
    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('aws.region'),
      // Leave the checksum out of presigned links, otherwise S3 rejects the upload with BadDigest.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async generateUploadUrl(fileName: string) {
    const extension = path.extname(fileName ?? '').toLowerCase();
    const contentType = CONTENT_TYPES[extension];

    if (!contentType) {
      throw new BadRequestException('Only jpg, png, webp and gif images can be uploaded');
    }

    const key = `images/${randomUUID()}${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 300,
      signableHeaders: new Set(['content-type']),
    });

    return { uploadUrl, key };
  }

  // Same as generateUploadUrl, for task attachments. The caller must PUT with the returned contentType.
  async generateAttachmentUrl(fileName: string) {
    const extension = path.extname(fileName ?? '').toLowerCase();
    const contentType = ATTACHMENT_TYPES[extension];

    if (!contentType) {
      throw new BadRequestException('This file type is not allowed. Use an image, PDF, Office document, txt, csv or zip');
    }

    const key = `attachments/${randomUUID()}${extension}`;
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 300,
      signableHeaders: new Set(['content-type']),
    });

    return { uploadUrl, key, contentType };
  }

  // The bucket is private, so a stored image is shown through a temporary link (valid for 1 hour).
  generateViewUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  // Used to clean up an uploaded image when the signup / project creation that needed it fails.
  async deleteObject(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
