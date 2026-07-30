import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  @MaxLength(120)
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryCents?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsDateString() dateOfJoining?: string;
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsInt() @Min(0) salaryCents?: number;
}