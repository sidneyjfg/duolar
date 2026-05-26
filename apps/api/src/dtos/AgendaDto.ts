import { IsBoolean, IsIn, IsOptional, IsString, Matches } from "class-validator";

export class AgendaEventDto {
  @IsString()
  title!: string;

  @IsIn(["faculdade", "trabalho", "refeicao", "familia", "lazer", "transporte", "tarefa", "outros"])
  category!: "faculdade" | "trabalho" | "refeicao" | "familia" | "lazer" | "transporte" | "tarefa" | "outros";

  @IsString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

  @IsOptional()
  @IsString()
  responsible?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
