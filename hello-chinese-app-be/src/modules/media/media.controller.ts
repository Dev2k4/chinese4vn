import { Body, Controller, Post } from "@nestjs/common";
import { MediaService } from "./media.service";
import { Public } from "../auth/public.decorator";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Public()
  @Post("presign")
  presign(@Body() body: { path: string; contentType: string }) {
    return this.mediaService.presign(body.path, body.contentType);
  }
}
