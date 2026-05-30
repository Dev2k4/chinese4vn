import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

@Injectable()
export class MediaService implements OnModuleInit {
  private client!: Minio.Client;
  private bucket!: string;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Minio.Client({
      endPoint: this.config.get("MINIO_ENDPOINT", "localhost"),
      port: Number(this.config.get("MINIO_PORT", "9000")),
      useSSL: this.config.get("MINIO_USE_SSL", "false") === "true",
      accessKey: this.config.get("MINIO_ACCESS_KEY", "minio"),
      secretKey: this.config.get("MINIO_SECRET_KEY", "minio123"),
    });
    this.bucket = this.config.get("MINIO_BUCKET", "hello-chinese");
  }

  async presign(path: string, contentType: string) {
    const url = await this.client.presignedPutObject(
      this.bucket,
      path,
      60 * 60,
    );
    return { url, path, bucket: this.bucket };
  }

  async getFileUrl(path: string) {
    const exists = await this.client.statObject(this.bucket, path);
    if (!exists) return null;
    return await this.client.presignedGetObject(this.bucket, path, 60 * 60);
  }

  async uploadBuffer(path: string, buffer: Buffer, contentType: string) {
    await this.client.putObject(this.bucket, path, buffer, buffer.length, {
      "Content-Type": contentType,
    });
    return path;
  }
}
