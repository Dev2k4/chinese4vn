import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { OnboardingDto } from "./dto/onboarding.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser("id") userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch("me/settings")
  updateSettings(
    @CurrentUser("id") userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.usersService.updateSettings(userId, body);
  }

  @Post("onboarding")
  completeOnboarding(
    @CurrentUser("id") userId: string,
    @Body() dto: OnboardingDto,
  ) {
    return this.usersService.completeOnboarding(userId, dto);
  }
}
