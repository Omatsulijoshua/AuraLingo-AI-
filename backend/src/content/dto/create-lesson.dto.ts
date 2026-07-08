import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;
}
