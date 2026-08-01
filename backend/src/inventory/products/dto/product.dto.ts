import { IsEnum, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(60)
  sku: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsInt()
  @Min(0)
  unitPriceCents: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class AdjustStockDto {
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}