import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async submitLesson(userId: string, lessonId: string, payload: Record<string, unknown>) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const score = (payload.score as number) || 0;
    const totalSteps = (payload.totalSteps as number) || 0;
    const completedSteps = (payload.completedSteps as number) || 0;
    const timeSpent = (payload.timeSpentSeconds as number) || 0;
    const mistakes = (payload.mistakes as any) || [];

    const attemptCount = await this.prisma.lessonAttempt.count({
      where: { userId, lessonId },
    });

    const isPassed = score >= 60;

    const attempt = await this.prisma.lessonAttempt.create({
      data: {
        userId,
        lessonId,
        score,
        totalSteps,
        completedSteps,
        xpEarned: lesson.xpReward,
        timeSpentSeconds: timeSpent,
        isPassed,
        isCompleted: isPassed,
        attemptNumber: attemptCount + 1,
        mistakes,
        completedAt: isPassed ? new Date() : null,
      },
    });

    await this.prisma.userXpLog.create({
      data: {
        userId,
        amount: lesson.xpReward,
        source: "lesson_complete",
        referenceId: lessonId,
      },
    });

    await this.updateDailyActivity(userId, lesson.xpReward, timeSpent, isPassed);

    return {
      attempt: {
        id: attempt.id,
        score: attempt.score,
        xpEarned: attempt.xpEarned,
        isPassed: attempt.isPassed,
        attemptNumber: attempt.attemptNumber,
      },
    };
  }

  async getSummary(userId: string) {
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

    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    return {
      totalXp: xpAgg._sum.amount || 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      totalLessonsCompleted: lessonCount,
      totalReviewsCompleted: reviewCount,
    };
  }

  async getStreak(userId: string) {
    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    return {
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lastActiveDate: streak?.lastActiveDate || null,
      freezeCount: streak?.freezeCount || 0,
    };
  }

  private async updateDailyActivity(userId: string, xp: number, timeSpent: number, completedLesson: boolean) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      await this.prisma.dailyActivity.update({
        where: { id: existing.id },
        data: {
          totalXp: { increment: xp },
          totalLessonsCompleted: completedLesson ? { increment: 1 } : undefined,
          totalTimeSpentSeconds: { increment: timeSpent },
        },
      });
    } else {
      await this.prisma.dailyActivity.create({
        data: {
          userId,
          date: today,
          totalXp: xp,
          totalLessonsCompleted: completedLesson ? 1 : 0,
          totalTimeSpentSeconds: timeSpent,
          streakCount: 1,
        },
      });
    }

    await this.updateStreak(userId, today);
  }

  private async updateStreak(userId: string, today: Date) {
    const existing = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!existing) {
      await this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
        },
      });
      return;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = existing.lastActiveDate.getTime() === yesterday.getTime();
    const isSameDay = existing.lastActiveDate.getTime() === today.getTime();

    if (isSameDay) return;

    const newStreak = isConsecutive ? existing.currentStreak + 1 : 1;

    await this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(existing.longestStreak, newStreak),
        lastActiveDate: today,
      },
    });
  }
}
