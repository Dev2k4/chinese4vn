import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

function vi(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val['vi'] || val['en'] || '';
}

function mapVocab(vocab: any) {
  const translations = (vocab.translations || {}) as Record<string, string>;
  const wordClass = (vocab.wordClass || {}) as Record<string, string>;
  const notes = (vocab.notes || {}) as Record<string, string>;
  return {
    id: vocab.id,
    hanzi: vocab.hanzi,
    pinyin: vocab.pinyin,
    meaning: translations['vi'] || '',
    wordClass: wordClass['vi'] || null,
    notes: notes['vi'] || null,
    translations: vocab.translations,
    wordClassAll: vocab.wordClass,
    notesAll: vocab.notes,
    audioUrl: vocab.audioUrl,
    strokeSvg: vocab.strokeSvg,
    examples: (vocab.examples || []).map((ex: any) => ({
      ...ex,
      meaning: vi(ex.translations?.['vi'] || ex.translations),
      translations: ex.translations,
    })),
  };
}

function mapGrammar(grammar: any) {
  return {
    id: grammar.id,
    title: vi(grammar.title),
    explanation: vi(grammar.explanation),
    structure: vi(grammar.structure),
    translations: {
      title: grammar.title,
      explanation: grammar.explanation,
      structure: grammar.structure,
    },
    examples: (grammar.examples || []).map((ex: any) => ({
      ...ex,
      meaning: vi(ex.translations?.['vi'] || ex.translations),
      translations: ex.translations,
    })),
  };
}

function mapQuestion(q: any) {
  return {
    id: q.id,
    type: q.type,
    prompt: vi(q.prompt),
    subPrompt: vi(q.subPrompt),
    explanation: vi(q.explanation),
    translations: {
      prompt: q.prompt,
      subPrompt: q.subPrompt,
      explanation: q.explanation,
    },
    pinyin: q.pinyin,
    audioUrl: q.audioUrl,
    imageUrl: q.imageUrl,
    options: q.options,
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty,
    timeLimit: q.timeLimit,
    vocabularyId: q.vocabularyId,
    grammarPointId: q.grammarPointId,
  };
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog() {
    const levels = await this.prisma.courseLevel.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        framework: true,
        units: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                type: true,
                estimatedMinutes: true,
                xpReward: true,
              },
            },
          },
        },
      },
    });

    return {
      version: "v1",
      language: "zh",
      levels: levels.map((level) => ({
        id: level.id,
        level: level.level,
        name: level.name,
        description: level.description,
        totalWords: level.totalWords,
        totalGrammar: level.totalGrammar,
        totalLessons: level.totalLessons,
        units: level.units.map((unit) => ({
          id: unit.id,
          title: vi(unit.title),
          description: unit.description,
          translations: { title: unit.title },
          lessons: unit.lessons.map((lesson) => ({
            id: lesson.id,
            title: vi(lesson.title),
            description: lesson.description,
            order: lesson.order,
            type: lesson.type,
            estimatedMinutes: lesson.estimatedMinutes,
            xpReward: lesson.xpReward,
            translations: { title: lesson.title },
          })),
        })),
      })),
    };
  }

  async getLessonBundle(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        steps: { orderBy: { order: "asc" } },
        vocabItems: {
          orderBy: { order: "asc" },
          include: {
            vocab: {
              include: {
                examples: { orderBy: { order: "asc" } },
              },
            },
          },
        },
        grammarItems: {
          orderBy: { order: "asc" },
          include: { grammar: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    // Collect questionIds from all steps
    const questionIds: string[] = [];
    for (const step of lesson.steps) {
      const content = step.content as any;
      if (content?.questionId) {
        questionIds.push(content.questionId);
      }
    }

    // Fetch related questions
    const questions = questionIds.length > 0
      ? await this.prisma.question.findMany({
          where: { id: { in: questionIds } },
        })
      : [];

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Map steps with inline question data for frontend convenience
    const mappedSteps = lesson.steps.map((step) => {
      const content = step.content as any;
      const q = content?.questionId ? questionMap.get(content.questionId) : undefined;
      return {
        ...step,
        content: q
          ? { ...content, ...mapQuestion(q) }
          : content,
      };
    });

    return {
      lesson: {
        id: lesson.id,
        unitId: lesson.unitId,
        title: vi(lesson.title),
        description: lesson.description,
        order: lesson.order,
        type: lesson.type,
        estimatedMinutes: lesson.estimatedMinutes,
        xpReward: lesson.xpReward,
        translations: { title: lesson.title },
      },
      steps: mappedSteps,
      vocab: lesson.vocabItems.map((v) => ({
        ...mapVocab(v.vocab),
        isNew: v.isNew,
      })),
      grammar: lesson.grammarItems.map((g) => mapGrammar(g.grammar)),
      questions: questionIds.map((qid) => {
        const q = questionMap.get(qid);
        return q ? mapQuestion(q) : null;
      }).filter(Boolean),
    };
  }

  async getMockTest(levelId: string) {
    const level = await this.prisma.courseLevel.findUnique({
      where: { id: levelId },
    });

    if (!level) {
      throw new NotFoundException("Level not found");
    }

    const mockTest = await this.prisma.mockTest.findFirst({
      where: { levelId, isActive: true },
    });

    if (!mockTest) {
      return {
        id: `mock-${level.level}`,
        hskLevel: level.level,
        title: `HSK ${level.level} Mock Test`,
        translations: null,
        sections: [],
        duration: 0,
        totalQuestions: 0,
      };
    }

    const sections = (mockTest.sections as any[]) || [];
    const allQuestionIds = sections.flatMap((s: any) => s.questionIds || []);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: allQuestionIds } },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    return {
      id: mockTest.id,
      hskLevel: level.level,
      title: vi(mockTest.title),
      description: vi(mockTest.description),
      translations: {
        title: mockTest.title,
        description: mockTest.description,
      },
      duration: mockTest.timeLimit,
      totalQuestions: allQuestionIds.length,
      passingScore: mockTest.passingScore,
      sections: sections.map((section: any) => ({
        id: section.id,
        title: typeof section.title === 'object' ? vi(section.title) : section.title,
        type: section.type,
        questions: (section.questionIds || []).map((qid: string) => {
          const q = questionMap.get(qid);
          return q ? mapQuestion(q) : null;
        }).filter(Boolean),
      })),
    };
  }

  async getPaths() {
    const paths = await this.prisma.learningPath.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        level: { select: { id: true, level: true, name: true } },
        units: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                lesson: {
                  select: { id: true, title: true, order: true, type: true, estimatedMinutes: true },
                },
              },
            },
          },
        },
      },
    });

    return paths.map((path) => ({
      code: path.code,
      track: path.track,
      level: path.level.level,
      levelId: path.level.id,
      name: vi(path.name),
      description: vi(path.description),
      translations: { name: path.name, description: path.description },
      units: path.units.map((unit) => ({
        name: vi(unit.name),
        translations: { name: unit.name },
        lessons: unit.lessons.map((pl) => ({
          id: pl.lesson.id,
          title: vi(pl.lesson.title),
          order: pl.order,
          type: pl.lesson.type,
          estimatedMinutes: pl.lesson.estimatedMinutes,
          translations: { title: pl.lesson.title },
          isRequired: pl.isRequired,
        })),
      })),
    }));
  }

  async getPathByCode(code: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { code },
      include: {
        level: { select: { id: true, level: true, name: true } },
        units: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                lesson: {
                  select: { id: true, title: true, order: true, type: true, estimatedMinutes: true },
                },
              },
            },
          },
        },
      },
    });

    if (!path) {
      throw new NotFoundException("Learning path not found");
    }

    return {
      code: path.code,
      track: path.track,
      level: path.level.level,
      levelId: path.level.id,
      name: vi(path.name),
      description: vi(path.description),
      translations: { name: path.name, description: path.description },
      units: path.units.map((unit) => ({
        name: vi(unit.name),
        translations: { name: unit.name },
        lessons: unit.lessons.map((pl) => ({
          id: pl.lesson.id,
          title: vi(pl.lesson.title),
          order: pl.order,
          type: pl.lesson.type,
          estimatedMinutes: pl.lesson.estimatedMinutes,
          translations: { title: pl.lesson.title },
          isRequired: pl.isRequired,
        })),
      })),
    };
  }

  async getPlacementTest() {
    const questions = await this.prisma.question.findMany({
      where: { vocabularyId: { not: null } },
      take: 48,
      orderBy: { difficulty: "asc" },
    });

    return { questions: questions.map(mapQuestion) };
  }

  async getVocabularyByLevel(levelId: string, page = 1, limit = 50) {
    const level = await this.prisma.courseLevel.findUnique({ where: { id: levelId } });
    if (!level) throw new NotFoundException("Level not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: { levelId, isActive: true },
        orderBy: { order: "asc" },
        skip,
        take: limit,
        include: { examples: { orderBy: { order: "asc" } } },
      }),
      this.prisma.vocabulary.count({ where: { levelId, isActive: true } }),
    ]);

    return { level: level.level, total, page, limit, items: items.map(mapVocab) };
  }

  async getGrammarByLevel(levelId: string) {
    const level = await this.prisma.courseLevel.findUnique({ where: { id: levelId } });
    if (!level) throw new NotFoundException("Level not found");

    const items = await this.prisma.grammarPoint.findMany({
      where: { levelId, isActive: true },
      orderBy: { order: "asc" },
    });

    return { level: level.level, total: items.length, items: items.map(mapGrammar) };
  }

  async searchVocabulary(query: string) {
    if (!query || query.length < 1) return { items: [] };

    const items = await this.prisma.vocabulary.findMany({
      where: {
        isActive: true,
        OR: [
          { hanzi: { contains: query } },
          { pinyin: { contains: query.toLowerCase() } },
        ],
      },
      take: 20,
      orderBy: { difficulty: "asc" },
      include: { level: { select: { level: true } } },
    });

    return {
      items: items.map((v) => ({
        ...mapVocab(v),
        hskLevel: (v as any).level?.level || null,
      })),
    };
  }
}
