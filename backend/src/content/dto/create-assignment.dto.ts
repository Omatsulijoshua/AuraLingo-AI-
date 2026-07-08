import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
