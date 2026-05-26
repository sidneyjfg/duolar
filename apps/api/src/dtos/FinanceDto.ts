import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class FinanceDto {
  @IsString()
  title!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(["income", "expense"])
  type!: "income" | "expense";

  @IsIn(["alimentacao", "contas", "lazer", "transporte", "saude", "casa"])
  category!: "alimentacao" | "contas" | "lazer" | "transporte" | "saude" | "casa";

  @IsString()
  date!: string;

  @IsOptional()
  @IsIn(["cartao", "conta_fixa", "dinheiro", "pix", "debito", "outros"])
  paymentKind?: "cartao" | "conta_fixa" | "dinheiro" | "pix" | "debito" | "outros";

  @IsOptional()
  @IsString()
  paymentName?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  billingMonth?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
