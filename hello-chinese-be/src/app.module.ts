import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { ContentModule } from "./modules/content/content.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { PrismaModule } from "./prisma/prisma.module";
import { JwtAuthGuard } from "./modules/auth/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ContentModule,
    UsersModule,
    ProgressModule,
    ReviewsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
