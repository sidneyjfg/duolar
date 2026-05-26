import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ShoppingItemDto {
  @IsString()
  name!: string;

  @IsString()
  quantity!: string;

  @IsIn(["mercado", "limpeza", "farmacia", "pet", "outros"])
  category!: "mercado" | "limpeza" | "farmacia" | "pet" | "outros";

  @IsNumber()
  @Min(0)
  estimatedPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualPrice?: number;

  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @IsOptional()
  @IsIn(["pending", "cart", "purchased"])
  cartStatus?: "pending" | "cart" | "purchased";

  @IsOptional()
  @IsBoolean()
  purchased?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FinishPurchaseDto {
  @IsNumber()
  @Min(0)
  total!: number;

  @IsNumber()
  @Min(0)
  estimatedTotal!: number;
}
