import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, QuestionType } from '@prisma/client';

class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @IsString()
  @IsOptional()
  optionLetter?: string;

  @IsNotEmpty()
  isCorrect: boolean;
}

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  correctText: string;

  @IsArray()
  @IsOptional()
  acceptableTexts?: string[];
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsString()
  @IsOptional()
  readingPassageId?: string;

  @IsString()
  @IsOptional()
  listeningAudioId?: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType: QuestionType;

  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers?: AnswerDto[];
}
