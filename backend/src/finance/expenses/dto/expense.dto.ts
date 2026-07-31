import { IsDateString, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  amountCents: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}