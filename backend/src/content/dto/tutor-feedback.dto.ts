import { IsNotEmpty, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';

export class TutorFeedbackDto {
  @IsNumber()
  @Min(0)
  @Max(9.0)
  bandScore: number;

  @IsString()
  @IsNotEmpty()
  feedbackText: string;

  @IsEnum(['WRITING', 'SPEAKING'])
  @IsNotEmpty()
  submissionType: 'WRITING' | 'SPEAKING';
}
