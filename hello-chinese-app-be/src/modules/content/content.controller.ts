import { Controller, Get, Param, Query } from "@nestjs/common";
import { ContentService } from "./content.service";
import { Public } from "../auth/public.decorator";

@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get("catalog")
  getCatalog() {
    return this.contentService.getCatalog();
  }

  @Public()
  @Get("lessons/:lessonId")
  getLesson(@Param("lessonId") lessonId: string) {
    return this.contentService.getLessonBundle(lessonId);
  }

  @Public()
  @Get("paths")
  getPaths() {
    return this.contentService.getPaths();
  }

  @Public()
  @Get("paths/:code")
  getPathByCode(@Param("code") code: string) {
    return this.contentService.getPathByCode(code);
  }

  @Public()
  @Get("levels/:levelId/vocabulary")
  getVocabularyByLevel(
    @Param("levelId") levelId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.contentService.getVocabularyByLevel(levelId, +(page || 1), +(limit || 50));
  }

  @Public()
  @Get("levels/:levelId/grammar")
  getGrammarByLevel(@Param("levelId") levelId: string) {
    return this.contentService.getGrammarByLevel(levelId);
  }

  @Public()
  @Get("vocabulary/search")
  searchVocabulary(@Query("q") q?: string) {
    return this.contentService.searchVocabulary(q || "");
  }
}
