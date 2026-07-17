import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class AgendaEventDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsIn(["faculdade", "trabalho", "refeicao", "familia", "lazer", "transporte", "tarefa", "outros"])
  category!: "faculdade" | "trabalho" | "refeicao" | "familia" | "lazer" | "transporte" | "tarefa" | "outros";

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  responsible?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
