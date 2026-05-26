import { IsArray, IsIn, IsOptional, IsString } from "class-validator";

export class PersonalRuleDto {
  @IsString()
  title!: string;

  @IsIn(["alimentacao", "consumo", "estudo", "saude", "rotina", "financeiro", "outros"])
  category!: "alimentacao" | "consumo" | "estudo" | "saude" | "rotina" | "financeiro" | "outros";

  @IsString()
  conditionText!: string;

  @IsString()
  rewardText!: string;

  @IsOptional()
  @IsString()
  consequenceText?: string;

  @IsOptional()
  @IsIn(["active", "paused", "completed"])
  status?: "active" | "paused" | "completed";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedDates?: string[];
}
