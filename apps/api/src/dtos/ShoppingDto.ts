import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ShoppingItemDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(80)
  quantity!: string;

  @IsIn(["mercado", "limpeza", "farmacia", "pet", "outros"])
  category!: "mercado" | "limpeza" | "farmacia" | "pet" | "outros";

  @IsNumber()
  @Min(0)
  @Max(1000000)
  estimatedPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
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
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShoppingItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  quantity?: string;

  @IsOptional()
  @IsIn(["mercado", "limpeza", "farmacia", "pet", "outros"])
  category?: "mercado" | "limpeza" | "farmacia" | "pet" | "outros";

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  estimatedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
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
  @MaxLength(1000)
  notes?: string;
}

export class FinishPurchaseDto {
  @IsNumber()
  @Min(0)
  @Max(1000000)
  total!: number;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  estimatedTotal!: number;
}
