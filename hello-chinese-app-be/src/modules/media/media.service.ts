import { Injectable } from "@nestjs/common";

@Injectable()
export class MediaService {
  presign(path: string, contentType: string) {
    return { message: "not_implemented", path, contentType };
  }
}
