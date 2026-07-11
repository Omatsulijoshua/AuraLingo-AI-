import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserStatusDto {
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
