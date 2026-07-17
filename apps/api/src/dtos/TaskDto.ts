import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class TaskDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsIn(["simples", "medio", "pesado"])
  weight!: "simples" | "medio" | "pesado";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  mentalEffort?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  domesticImpact?: number;

  @IsOptional()
  @IsIn(["low", "medium", "high"])
  priority?: "low" | "medium" | "high";

  @IsIn(["none", "daily", "weekly", "monthly"])
  recurrence!: "none" | "daily" | "weekly" | "monthly";

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsIn(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], { each: true })
  scheduledDays?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(366)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  @IsString({ each: true })
  completedDates?: string[];

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  agendaTime?: string;

  @IsString()
  @MaxLength(80)
  responsible!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
