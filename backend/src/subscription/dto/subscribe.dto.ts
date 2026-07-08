import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class SubscribeDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  paymentProvider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  paymentReference: string;
}
