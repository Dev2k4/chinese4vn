import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { MediaService } from "./media.service";
import { Public } from "../auth/public.decorator";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Public()
  @Post("presign")
  async presign(@Body() body: { path: string; contentType: string }) {
    return this.mediaService.presign(body.path, body.contentType);
  }

  @Public()
  @Get("url/:path")
  async getUrl(@Param("path") path: string) {
    return this.mediaService.getFileUrl(path);
  }
}
