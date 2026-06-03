import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

function vi(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val['vi'] || val['en'] || '';
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDue(userId: string, limit = 20) {
    const now = new Date();

    const items = await this.prisma.srsItem.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        stage: { not: "mastered" },
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
      include: {
        vocabulary: {
          select: {
            id: true,
            hanzi: true,
            pinyin: true,
            pinyinTone: true,
            translations: true,
            wordClass: true,
            audioUrl: true,
          },
        },
      },
    });

    return {
      items: items.map((item) => {
        const translations = (item.vocabulary?.translations || {}) as Record<string, string>;
        const wordClass = (item.vocabulary?.wordClass || {}) as Record<string, string>;
        return {
          id: item.id,
          srsType: item.srsType,
          stage: item.stage,
          interval: item.interval,
          easeFactor: item.easeFactor,
          repetitions: item.repetitions,
          vocabulary: {
            id: item.vocabulary?.id,
            hanzi: item.vocabulary?.hanzi,
            pinyin: item.vocabulary?.pinyin,
            pinyinTone: item.vocabulary?.pinyinTone,
            meaning: translations['vi'] || '',
            wordClass: wordClass['vi'] || null,
            translations: item.vocabulary?.translations,
            audioUrl: item.vocabulary?.audioUrl,
          },
        };
      }),
      totalDue: items.length,
    };
  }

  async submit(userId: string, payload: { itemId: string; quality: number; timeSpentSeconds?: number }) {
    const item = await this.prisma.srsItem.findFirst({
      where: { id: payload.itemId, userId },
    });

    if (!item) {
      return { error: "Item not found" };
    }

    const quality = Math.max(0, Math.min(5, payload.quality));
    const { newInterval, newEaseFactor, newRepetitions, newStage } = this.calculateSm2(
      item.interval,
      item.easeFactor,
      item.repetitions,
      quality,
    );

    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + newInterval);

    const isCorrect = quality >= 3;

    await this.prisma.srsItem.update({
      where: { id: item.id },
      data: {
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
        lastQuality: quality,
        nextReviewAt: nextReview,
        stage: newStage,
        totalReviews: { increment: 1 },
        correctReviews: isCorrect ? { increment: 1 } : undefined,
        lapsedCount: isCorrect ? undefined : { increment: 1 },
        avgResponseTime: payload.timeSpentSeconds || undefined,
        lastReviewedAt: now,
      },
    });

    await this.prisma.srsReviewLog.create({
      data: {
        userId,
        srsItemId: item.id,
        quality,
        timeSpentSeconds: payload.timeSpentSeconds || 0,
        previousInterval: item.interval,
        previousEaseFactor: item.easeFactor,
        previousRepetitions: item.repetitions,
        isCorrect,
        source: "review_session",
      },
    });

    const xpEarned = isCorrect ? Math.max(1, quality - 1) : 0;

    if (xpEarned > 0) {
      await this.prisma.userXpLog.create({
        data: {
          userId,
          amount: xpEarned,
          source: "review",
          referenceId: item.id,
        },
      });
    }

    return {
      item: {
        id: item.id,
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
        stage: newStage,
        nextReviewAt: nextReview,
      },
      xpEarned,
    };
  }

  private calculateSm2(
    previousInterval: number,
    previousEaseFactor: number,
    previousRepetitions: number,
    quality: number,
  ): { newInterval: number; newEaseFactor: number; newRepetitions: number; newStage: "new" | "learning" | "review" | "relearning" | "mastered" } {
    if (quality < 3) {
      return {
        newInterval: 1,
        newEaseFactor: Math.max(1.3, previousEaseFactor - 0.2),
        newRepetitions: 0,
        newStage: "relearning",
      };
    }

    const newEaseFactor = Math.max(
      1.3,
      previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    let newInterval: number;
    let newRepetitions: number;

    if (previousRepetitions === 0) {
      newInterval = 1;
      newRepetitions = 1;
    } else if (previousRepetitions === 1) {
      newInterval = 6;
      newRepetitions = 2;
    } else {
      newInterval = Math.round(previousInterval * newEaseFactor);
      newRepetitions = previousRepetitions + 1;
    }

    const newStage = newRepetitions >= 5 ? "review" : "learning";

    return { newInterval, newEaseFactor, newRepetitions, newStage };
  }
}
