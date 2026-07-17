import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class FinanceDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsNumber()
  @Min(0.01)
  @Max(100000000)
  amount!: number;

  @IsIn(["income", "expense"])
  type!: "income" | "expense";

  @IsIn(["alimentacao", "contas", "lazer", "transporte", "saude", "casa"])
  category!: "alimentacao" | "contas" | "lazer" | "transporte" | "saude" | "casa";

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsOptional()
  @IsIn(["cartao", "conta_fixa", "dinheiro", "pix", "debito", "outros"])
  paymentKind?: "cartao" | "conta_fixa" | "dinheiro" | "pix" | "debito" | "outros";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  paymentName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  billingMonth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  responsible?: string;

  @IsOptional()
  @IsIn(["personal", "shared"])
  sharing?: "personal" | "shared";
}
