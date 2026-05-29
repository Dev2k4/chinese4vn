import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("due")
  getDue(
    @CurrentUser("id") userId: string,
    @Query("limit") limit?: string,
  ) {
    return this.reviewsService.getDue(userId, limit ? parseInt(limit) : 20);
  }

  @Post("submit")
  submit(
    @CurrentUser("id") userId: string,
    @Body() body: { itemId: string; quality: number; timeSpentSeconds?: number },
  ) {
    return this.reviewsService.submit(userId, body);
  }
}
