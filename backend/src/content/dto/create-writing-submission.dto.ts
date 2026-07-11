import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWritingSubmissionDto {
  @IsString()
  @IsNotEmpty()
  promptId: string;

  @IsString()
  @IsNotEmpty()
  userText: string;

  @IsString()
  customQuestionText?: string;

  @IsString()
  customTaskType?: string;

  @IsString()
  customExamType?: string;
}
