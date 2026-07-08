import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty()
  submissionText: string;
}
