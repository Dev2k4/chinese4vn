import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post("lessons/:lessonId")
  submitLesson(
    @CurrentUser("id") userId: string,
    @Param("lessonId") lessonId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.progressService.submitLesson(userId, lessonId, body);
  }

  @Get("summary")
  getSummary(@CurrentUser("id") userId: string) {
    return this.progressService.getSummary(userId);
  }

  @Get("streak")
  getStreak(@CurrentUser("id") userId: string) {
    return this.progressService.getStreak(userId);
  }
}
