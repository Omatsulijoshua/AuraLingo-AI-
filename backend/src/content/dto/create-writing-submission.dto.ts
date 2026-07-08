import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWritingSubmissionDto {
  @IsString()
  @IsNotEmpty()
  promptId: string;

  @IsString()
  @IsNotEmpty()
  userText: string;
}
