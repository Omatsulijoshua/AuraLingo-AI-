import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';

export class GradeAssignmentDto {
  @IsNumber()
  @Min(0)
  @Max(9.0)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsBoolean()
  @IsOptional()
  useAi?: boolean;
}
