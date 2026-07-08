import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, ExamType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(ExamType)
  @IsOptional()
  targetExam?: ExamType;
}
