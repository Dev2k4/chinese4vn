import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        nativeLanguage: true,
        targetLanguage: true,
        onboardingCompleted: true,
        createdAt: true,
        streak: true,
        enrollments: {
          where: { status: "active" },
          include: {
            level: { select: { id: true, level: true, name: true } },
            path: { select: { id: true, code: true, track: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const xpAgg = await this.prisma.userXpLog.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const lessonCount = await this.prisma.lessonAttempt.count({
      where: { userId, isCompleted: true },
    });

    const reviewCount = await this.prisma.srsReviewLog.count({
      where: { userId },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        nativeLanguage: user.nativeLanguage,
        targetLanguage: user.targetLanguage,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
      progress: {
        totalXp: xpAgg._sum.amount || 0,
        currentStreak: user.streak?.currentStreak || 0,
        longestStreak: user.streak?.longestStreak || 0,
        totalLessonsCompleted: lessonCount,
        totalReviewsCompleted: reviewCount,
      },
      settings: user.onboardingCompleted
        ? {
            learningPath: user.enrollments?.[0]?.path?.code || "new-1",
            targetMinutesPerDay: 15,
            targetWordsPerDay: 5,
            startDate: user.createdAt.toISOString(),
          }
        : null,
    };
  }

  async updateSettings(userId: string, settings: Record<string, unknown>) {
    if (settings.onboardingCompleted !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: settings.onboardingCompleted as boolean },
      });
    }

    return { message: "settings_updated" };
  }

  async completeOnboarding(userId: string, dto: { track: string; targetLevel: number }) {
    // Find CourseLevel matching target HSK level
    const level = await this.prisma.courseLevel.findFirst({
      where: { level: dto.targetLevel, isActive: true },
    });
    if (!level) throw new NotFoundException(`HSK ${dto.targetLevel} level not found`);

    // Find learning path
    const code = `${dto.track}-${dto.targetLevel}`;
    const path = await this.prisma.learningPath.findUnique({ where: { code } });
    if (!path) throw new NotFoundException(`Path ${code} not found`);

    // Upsert enrollment (in case user already has one)
    await this.prisma.userEnrollment.upsert({
      where: { userId_levelId: { userId, levelId: level.id } },
      update: { pathId: path.id, status: "active" },
      create: { userId, levelId: level.id, pathId: path.id, status: "active" },
    });

    // Mark onboarding as completed
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return { message: "onboarding_completed" };
  }
}
