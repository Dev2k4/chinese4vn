import { IsString, IsIn, IsNumber, Min, Max, IsOptional } from "class-validator";

const tracks = ["new", "exp", "review"] as const;

export class OnboardingDto {
  @IsString()
  @IsIn(["new", "exp", "review"])
  track!: string;

  @IsNumber()
  @Min(1)
  @Max(9)
  targetLevel!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  targetMinutesPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  targetWordsPerDay?: number;
}
