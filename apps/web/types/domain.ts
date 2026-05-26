export type User = { id: string; name: string; email: string; responsibleNames?: string[] };

export type Task = {
  id: string;
  title: string;
  description?: string;
  responsible: string;
  weight: "simples" | "medio" | "pesado";
  mentalEffort: number;
  domesticImpact: number;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  scheduledDays?: Array<"sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday">;
  completedDates?: string[];
  completed: boolean;
};

export type TaskDaySummary = {
  date: string;
  totals: { due: number; done: number; pending: number };
  due: Task[];
  done: Task[];
  pending: Task[];
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  category: "mercado" | "limpeza" | "farmacia" | "pet" | "outros";
  estimatedPrice: number;
  actualPrice: number;
  checked: boolean;
  cartStatus: "pending" | "cart" | "purchased";
  purchased: boolean;
  notes?: string;
};

export type Finance = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: "alimentacao" | "contas" | "lazer" | "transporte" | "saude" | "casa";
  date: string;
  paymentKind?: "cartao" | "conta_fixa" | "dinheiro" | "pix" | "debito" | "outros";
  paymentName?: string;
  dueDate?: string;
  billingMonth?: string;
  notes?: string;
};

export type AgendaEvent = {
  id: string;
  title: string;
  category: "faculdade" | "trabalho" | "refeicao" | "familia" | "lazer" | "transporte" | "tarefa" | "outros";
  date: string;
  startTime: string;
  endTime?: string;
  responsible: string;
  location?: string;
  notes?: string;
  completed: boolean;
};

export type GoogleCalendarConnection = {
  id: string;
  responsible: string;
  googleEmail: string;
  calendarId: string;
  syncStatus?: "synced" | "pending" | "failed";
  totalEvents?: number;
  syncedEvents?: number;
  failedEvents?: number;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonalRule = {
  id: string;
  title: string;
  category: "alimentacao" | "consumo" | "estudo" | "saude" | "rotina" | "financeiro" | "outros";
  conditionText: string;
  rewardText: string;
  consequenceText?: string;
  status: "active" | "paused" | "completed";
  completedDates?: string[];
};
