import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class PersonalRuleDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsIn(["alimentacao", "consumo", "estudo", "saude", "rotina", "financeiro", "outros"])
  category!: "alimentacao" | "consumo" | "estudo" | "saude" | "rotina" | "financeiro" | "outros";

  @IsString()
  @MaxLength(500)
  conditionText!: string;

  @IsString()
  @MaxLength(500)
  rewardText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  consequenceText?: string;

  @IsOptional()
  @IsIn(["active", "paused", "completed"])
  status?: "active" | "paused" | "completed";

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(366)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  @IsString({ each: true })
  completedDates?: string[];
}
