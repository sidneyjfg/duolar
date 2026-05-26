import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class TaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
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
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsIn(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], { each: true })
  scheduledDays?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedDates?: string[];

  @IsString()
  responsible!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
