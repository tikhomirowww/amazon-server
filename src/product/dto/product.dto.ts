import { Prisma } from '@prisma/client';
import { ArrayMinSize, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductDto implements Prisma.ProductUpdateInput {
  @IsString()
  name: string | Prisma.StringFieldUpdateOperationsInput;

  @IsNumber()
  price: number | Prisma.IntFieldUpdateOperationsInput;

  @IsOptional()
  @IsString()
  description?: string | Prisma.StringFieldUpdateOperationsInput;

  @IsString({ each: true })
  @ArrayMinSize(1)
  images?: Prisma.ProductUpdateimagesInput | string[];

  @IsNumber()
  categoryId: number;
}
