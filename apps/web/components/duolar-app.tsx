"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, CreditCard, Gem, List, Plus, ReceiptText, ShoppingBasket, Target, Trash2, Unplug, Users, Volume2, Wand2, X, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { brl, scoreTask } from "@/lib/utils";
import { AgendaEvent, Finance, GoogleCalendarConnection, PersonalRule, ShoppingItem, Task, TaskDaySummary } from "@/types/domain";
import { useAuthStore } from "@/store/auth-store";
import { useExperienceStore } from "@/store/experience-store";
import { AppShell } from "./app-shell";
import { Badge, Button, Card, IconButton, Input, Progress, Select } from "./ui";

const weightLabel = { simples: "Simples", medio: "Médio", pesado: "Pesado" } as const;
const weightTone = { simples: "emerald", medio: "amber", pesado: "rose" } as const;
const weekDayOptions = [
  ["sunday", "Dom"],
  ["monday", "Seg"],
  ["tuesday", "Ter"],
  ["wednesday", "Qua"],
  ["thursday", "Qui"],
  ["friday", "Sex"],
  ["saturday", "Sáb"]
] as const;
type WeekDay = (typeof weekDayOptions)[number][0];
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const weekDayIndex: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};
const indexWeekDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
type ShoppingPayload = Omit<ShoppingItem, "id">;
type FinancePayload = Omit<Finance, "id">;
type AgendaPayload = Omit<AgendaEvent, "id">;
type PersonalRulePayload = Omit<PersonalRule, "id">;
type TaskCreatePayload = Omit<Task, "id" | "completed"> & { agendaTime: string };
type FinishPurchasePayload = { total: number; estimatedTotal: number };
type ProfilePayload = { responsibleNames: string[] };
const emptyTasks: Task[] = [];
const emptyShopping: ShoppingItem[] = [];
const emptyFinances: Finance[] = [];
const emptyAgenda: AgendaEvent[] = [];
const emptyGoogleConnections: GoogleCalendarConnection[] = [];
const emptyRules: PersonalRule[] = [];
const googleCalendarEnabled = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED === "true";
const responsiblePalette = [
  "border-l-clay bg-clay/10",
  "border-l-emerald-400 bg-emerald-500/10",
  "border-l-amber-400 bg-amber-500/10",
  "border-l-rose-400 bg-rose-500/10",
  "border-l-cyan-400 bg-cyan-500/10",
  "border-l-fuchsia-400 bg-fuchsia-500/10",
  "border-l-sky-400 bg-sky-500/10",
  "border-l-lime-400 bg-lime-500/10"
];
const responsibleEventPalette = [
  "border-clay bg-clay/15 text-clay",
  "border-emerald-400 bg-emerald-500/15 text-emerald-100",
  "border-amber-400 bg-amber-500/15 text-amber-100",
  "border-rose-400 bg-rose-500/15 text-rose-100",
  "border-cyan-400 bg-cyan-500/15 text-cyan-100",
  "border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-100",
  "border-sky-400 bg-sky-500/15 text-sky-100",
  "border-lime-400 bg-lime-500/15 text-lime-100"
];

function responsibleAccent(name?: string) {
  const key = normalizeResponsible(name);
  const index = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0) % responsiblePalette.length;
  return responsiblePalette[index];
}

function parseMoney(value: FormDataEntryValue | string | number | null | undefined) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  const number = Number(normalized || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, number);
}

function responsibleEventAccent(name?: string) {
  const key = normalizeResponsible(name);
  const index = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0) % responsibleEventPalette.length;
  return responsibleEventPalette[index];
}

function normalizeResponsible(name?: string) {
  return (name || "Casa").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function uniqueNames(names: string[]) {
  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
}

function addMonthsToIso(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1 + months, day || 1);
  return isoFromLocalDate(next);
}

function addDaysToIso(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1, day + days);
  return isoFromLocalDate(next);
}

function isoFromLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(month: string) {
  if (!month) return "Sem mês";
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, monthIndex - 1, 1));
}

function monthKey(value?: string) {
  return value?.slice(0, 7) || "";
}

function financeBaseMonth(item: Finance) {
  return item.billingMonth || monthKey(item.date);
}

function isRecurringFixedFinance(item: Finance) {
  return item.type === "expense" && item.paymentKind === "conta_fixa";
}

function financeOccursInMonth(item: Finance, month: string) {
  const baseMonth = financeBaseMonth(item);
  if (!baseMonth) return false;
  if (isRecurringFixedFinance(item)) return baseMonth <= month;
  return baseMonth === month;
}

function financeDueDateForMonth(item: Finance, month: string) {
  if (!isRecurringFixedFinance(item)) return item.dueDate;
  const day = Number((item.dueDate || item.date || `${month}-01`).slice(8, 10)) || 1;
  const [year, monthIndex] = month.split("-").map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function formatDate(date?: string) {
  if (!date) return "sem vencimento";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(value?: string) {
  if (!value) return "sem sincronização";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function dayShortLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(`${date}T00:00:00`));
}

function calendarDatesForMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const cursor = new Date(firstDay);
  cursor.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + index);
    return isoFromLocalDate(date);
  });
}

function taskIsDueOn(task: Task, date: string) {
  if (task.dueDate === date) return true;

  const target = new Date(`${date}T00:00:00`);
  const weekDay = indexWeekDay[target.getDay()];
  const scheduledDays = task.scheduledDays ?? [];

  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly") return scheduledDays.includes(weekDay as WeekDay);
  if (task.recurrence === "monthly" && task.dueDate) return Number(task.dueDate.slice(8, 10)) === target.getDate();
  return false;
}

function taskEventId(taskId: string, date: string) {
  return `task:${taskId}:${date}`;
}

function taskIdFromGeneratedEvent(event: Pick<AgendaEvent, "notes">) {
  return event.notes?.match(/taskId:([^;]+)/)?.[1];
}

function isVirtualTaskEvent(event: Pick<AgendaEvent, "id">) {
  return event.id.startsWith("task:");
}

function taskIdFromVirtualEvent(event: Pick<AgendaEvent, "id">) {
  return event.id.split(":")[1];
}

function taskEventsForDates(tasks: Task[], dates: string[]): AgendaEvent[] {
  const uniqueDates = Array.from(new Set(dates));
  return tasks.flatMap((task) =>
    uniqueDates
      .filter((date) => taskIsDueOn(task, date))
      .map((date) => ({
        id: taskEventId(task.id, date),
        title: task.title,
        category: "tarefa" as const,
        date,
        startTime: task.agendaTime ?? "09:00",
        responsible: task.responsible,
        location: task.responsible,
        notes: `taskId:${task.id}; origem:tarefa-domestica`,
        completed: (task.completedDates ?? []).includes(date)
      }))
  );
}

function mergeAgendaWithTaskEvents(events: AgendaEvent[], taskEvents: AgendaEvent[]) {
  const taskEventKeys = new Set(taskEvents.map((event) => `${taskIdFromGeneratedEvent(event)}:${event.date}`));
  const manualEvents = events.filter((event) => {
    const taskId = taskIdFromGeneratedEvent(event);
    if (!taskId) return true;
    return !taskEventKeys.has(`${taskId}:${event.date}`);
  });
  return [...manualEvents, ...taskEvents].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

export function DuoLarApp() {
  const [section, setSection] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(today);
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const responsibleOptions = uniqueNames(user?.responsibleNames?.length ? user.responsibleNames : [user?.name ?? "Casa"]);
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await api.get<Task[]>("/tasks")).data
  });
  const dayQuery = useQuery({
    queryKey: ["tasks", "day", selectedDate],
    queryFn: async () => (await api.get<TaskDaySummary>("/tasks/day", { params: { date: selectedDate } })).data
  });
  const shoppingQuery = useQuery({
    queryKey: ["shopping"],
    queryFn: async () => (await api.get<ShoppingItem[]>("/shopping")).data
  });
  const financesQuery = useQuery({
    queryKey: ["finances"],
    queryFn: async () => (await api.get<Finance[]>("/finances")).data
  });
  const agendaQuery = useQuery({
    queryKey: ["agenda", selectedDate],
    queryFn: async () => (await api.get<AgendaEvent[]>("/agenda", { params: { date: selectedDate } })).data
  });
  const agendaCalendarQuery = useQuery({
    queryKey: ["agenda", "calendar"],
    queryFn: async () => (await api.get<AgendaEvent[]>("/agenda")).data
  });
  const googleCalendarConnectionsQuery = useQuery({
    queryKey: ["google-calendar-connections"],
    queryFn: async () => (await api.get<GoogleCalendarConnection[]>("/integrations/google-calendar")).data,
    enabled: googleCalendarEnabled
  });
  const rulesQuery = useQuery({
    queryKey: ["personal-rules"],
    queryFn: async () => (await api.get<PersonalRule[]>("/personal-rules")).data
  });
  const tasks = tasksQuery.data ?? emptyTasks;
  const shopping = shoppingQuery.data ?? emptyShopping;
  const finances = financesQuery.data ?? emptyFinances;
  const agenda = agendaQuery.data ?? emptyAgenda;
  const agendaCalendar = agendaCalendarQuery.data ?? emptyAgenda;
  const googleCalendarConnections = googleCalendarConnectionsQuery.data ?? emptyGoogleConnections;
  const rules = rulesQuery.data ?? emptyRules;
  const refreshTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };
  const refreshShopping = () => {
    queryClient.invalidateQueries({ queryKey: ["shopping"] });
  };
  const refreshFinances = () => {
    queryClient.invalidateQueries({ queryKey: ["finances"] });
  };
  const refreshAgenda = () => {
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };
  const refreshGoogleCalendarConnections = () => {
    queryClient.invalidateQueries({ queryKey: ["google-calendar-connections"] });
  };
  const refreshRules = () => {
    queryClient.invalidateQueries({ queryKey: ["personal-rules"] });
  };
  const createTask = useMutation({
    mutationFn: async (payload: TaskCreatePayload) => {
      return (await api.post<Task>("/tasks", payload)).data;
    },
    onSuccess: () => {
      refreshTasks();
      refreshAgenda();
      toast.success("Tarefa criada e visível na agenda");
    },
    onError: () => toast.error("Não foi possível criar a tarefa")
  });
  const updateTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => (await api.patch<Task>(`/tasks/${id}`, patch)).data,
    onSuccess: refreshTasks,
    onError: () => toast.error("Não foi possível atualizar a tarefa")
  });
  const completeTask = useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date: string; completed: boolean }) =>
      (await api.patch<Task>(`/tasks/${id}/complete`, { date, completed })).data,
    onSuccess: refreshTasks,
    onError: () => toast.error("Não foi possível registrar o dia da tarefa")
  });
  const deleteTask = useMutation({
    mutationFn: async (task: Task) => {
      const events = (await api.get<AgendaEvent[]>("/agenda")).data;
      const taskEvents = events.filter((event) => {
        const sameGeneratedTask = event.notes?.includes(`taskId:${task.id}`);
        const sameLegacyTask = event.category === "tarefa" && event.title === task.title && normalizeResponsible(event.location) === normalizeResponsible(task.responsible);
        return sameGeneratedTask || sameLegacyTask;
      });
      await Promise.all(taskEvents.map((event) => api.delete(`/agenda/${event.id}`)));
      return (await api.delete(`/tasks/${task.id}`)).data;
    },
    onSuccess: () => {
      refreshTasks();
      refreshAgenda();
      toast.success("Tarefa excluída");
    },
    onError: () => toast.error("Não foi possível excluir a tarefa")
  });
  const createShoppingItem = useMutation({
    mutationFn: async (payload: ShoppingPayload) => (await api.post<ShoppingItem>("/shopping", payload)).data,
    onSuccess: () => {
      refreshShopping();
      toast.success("Item adicionado");
    },
    onError: () => toast.error("Não foi possível adicionar o item")
  });
  const updateShoppingItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ShoppingItem> }) => (await api.patch<ShoppingItem>(`/shopping/${id}`, patch)).data,
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["shopping"] });
      const previous = queryClient.getQueryData<ShoppingItem[]>(["shopping"]);
      queryClient.setQueryData<ShoppingItem[]>(["shopping"], (current = []) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["shopping"], context.previous);
      toast.error("Não foi possível atualizar o item");
    },
    onSuccess: refreshShopping,
  });
  const finishPurchase = useMutation({
    mutationFn: async (payload: FinishPurchasePayload) => (await api.post("/shopping/finish", payload)).data,
    onSuccess: () => {
      refreshShopping();
      toast.success("Compra finalizada");
    },
    onError: () => toast.error("Não foi possível finalizar a compra")
  });
  const deleteShoppingItem = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/shopping/${id}`)).data,
    onSuccess: refreshShopping,
    onError: () => toast.error("Não foi possível excluir o item")
  });
  const createFinance = useMutation({
    mutationFn: async (payload: FinancePayload) => (await api.post<Finance>("/finances", payload)).data,
    onSuccess: () => {
      refreshFinances();
      toast.success("Registro salvo");
    },
    onError: () => toast.error("Não foi possível salvar o registro")
  });
  const deleteFinance = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/finances/${id}`)).data,
    onSuccess: refreshFinances,
    onError: () => toast.error("Não foi possível excluir o registro")
  });
  const createAgendaEvent = useMutation({
    mutationFn: async (payload: AgendaPayload) => (await api.post<AgendaEvent>("/agenda", payload)).data,
    onSuccess: () => {
      refreshAgenda();
      toast.success("Agenda atualizada");
    },
    onError: () => toast.error("Não foi possível criar o evento")
  });
  const updateAgendaEvent = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AgendaEvent> }) => (await api.patch<AgendaEvent>(`/agenda/${id}`, patch)).data,
    onSuccess: refreshAgenda,
    onError: () => toast.error("Não foi possível atualizar o evento")
  });
  const deleteAgendaEvent = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/agenda/${id}`)).data,
    onSuccess: refreshAgenda,
    onError: () => toast.error("Não foi possível excluir o evento")
  });
  const updateProfile = useMutation({
    mutationFn: async (payload: ProfilePayload) => (await api.patch("/auth/me", payload)).data,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Responsáveis atualizados");
    },
    onError: () => toast.error("Não foi possível salvar os responsáveis")
  });
  const connectGoogleCalendar = useMutation({
    mutationFn: async (responsible: string) => (await api.get<{ url: string }>("/integrations/google-calendar/connect", { params: { responsible } })).data,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: () => toast.error("Não foi possível iniciar a conexão com Google")
  });
  const disconnectGoogleCalendar = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/integrations/google-calendar/${id}`)).data,
    onSuccess: () => {
      refreshGoogleCalendarConnections();
      toast.success("Google Calendar desconectado");
    },
    onError: () => toast.error("Não foi possível desconectar o Google Calendar")
  });
  const createRule = useMutation({
    mutationFn: async (payload: PersonalRulePayload) => (await api.post<PersonalRule>("/personal-rules", payload)).data,
    onSuccess: () => {
      refreshRules();
      toast.success("Regra criada");
    },
    onError: () => toast.error("Não foi possível criar a regra")
  });
  const updateRule = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PersonalRule> }) => (await api.patch<PersonalRule>(`/personal-rules/${id}`, patch)).data,
    onSuccess: refreshRules,
    onError: () => toast.error("Não foi possível atualizar a regra")
  });
  const checkInRule = useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date: string; completed: boolean }) =>
      (await api.patch<PersonalRule>(`/personal-rules/${id}/check-in`, { date, completed })).data,
    onSuccess: refreshRules,
    onError: () => toast.error("Não foi possível registrar a regra")
  });
  const deleteRule = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/personal-rules/${id}`)).data,
    onSuccess: refreshRules,
    onError: () => toast.error("Não foi possível excluir a regra")
  });

  const taskScore = tasks.reduce((sum, task) => sum + scoreTask(task), 0);
  const completedScore = tasks.filter((task) => task.completed).reduce((sum, task) => sum + scoreTask(task), 0);
  const distribution = useMemo(() => {
    const totals = tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.responsible] = (acc[task.responsible] ?? 0) + scoreTask(task);
      return acc;
    }, {});
    return Object.entries(totals).map(([name, value]) => ({ name, value, percentage: Math.round((value / Math.max(taskScore, 1)) * 100) }));
  }, [tasks, taskScore]);
  const shoppingTotal = shopping.reduce((sum, item) => sum + Number(item.actualPrice || item.estimatedPrice), 0);
  const estimatedTotal = shopping.reduce((sum, item) => sum + Number(item.estimatedPrice), 0);
  const income = finances.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = finances.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const backendHasError = [
    tasksQuery,
    dayQuery,
    shoppingQuery,
    financesQuery,
    agendaQuery,
    agendaCalendarQuery,
    googleCalendarConnectionsQuery,
    rulesQuery
  ].some((query) => query.isError);
  const activationItems = [
    {
      title: "Definir responsáveis",
      detail: "A casa deixa de depender de uma pessoa só.",
      done: responsibleOptions.length > 1,
      action: "Ajustar",
      section: "settings",
      icon: Users
    },
    {
      title: "Criar a primeira tarefa",
      detail: "O dashboard ganha rotina real para acompanhar.",
      done: tasks.length > 0,
      action: "Criar tarefa",
      section: "tasks",
      icon: Target
    },
    {
      title: "Adicionar um compromisso",
      detail: "Agenda e tarefa passam a conversar no mesmo fluxo.",
      done: agendaCalendar.length > 0,
      action: "Abrir agenda",
      section: "agenda",
      icon: CalendarDays
    },
    {
      title: "Registrar um item de compra",
      detail: "O modo mercado já começa com uma lista útil.",
      done: shopping.length > 0,
      action: "Adicionar item",
      section: "shopping",
      icon: ShoppingBasket
    }
  ];

  return (
    <AppShell section={section} setSection={setSection}>
      {section === "dashboard" && (
        <div className="space-y-6">
          {backendHasError && <BackendNotice />}
          <ActivationPanel items={activationItems} onSelect={setSection} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            <Metric title="Tarefas pendentes" value={tasks.filter((task) => !task.completed).length.toString()} detail="Rotina do dia" />
            <Metric title="Progresso doméstico" value={`${Math.round((completedScore / Math.max(taskScore, 1)) * 100)}%`} detail="Peso concluído" />
            <Metric title="Gastos da semana" value={brl(expense)} detail="Mercado e casa" />
            <Metric title="Lista rápida" value={`${shopping.length} itens`} detail={brl(estimatedTotal)} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Resumo do dia</h2>
                  <p className="text-sm text-stone-500">Prioridades, equilíbrio e compras em tempo real.</p>
                </div>
                <Button onClick={() => setSection("market")}>Modo Mercado</Button>
              </div>
              <div className="space-y-3">
                {tasks.slice(0, 4).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    date={selectedDate}
                    onToggle={() => completeTask.mutate({ id: task.id, date: selectedDate, completed: !(task.completedDates ?? []).includes(selectedDate) })}
                  />
                ))}
                {!tasks.length && (
                  <EmptyAction
                    title="Nenhuma tarefa cadastrada"
                    detail="Crie uma primeira tarefa para ver progresso, carga mental e agenda funcionando juntos."
                    action="Criar primeira tarefa"
                    onClick={() => setSection("tasks")}
                  />
                )}
              </div>
            </Card>
            <Insights distribution={distribution} expense={expense} income={income} />
          </div>
          <PlanPrompt onOpen={() => setSection("plan")} />
        </div>
      )}
      {section === "day" && (
        <DayView
          date={selectedDate}
          setDate={setSelectedDate}
          summary={dayQuery.data}
          loading={dayQuery.isLoading}
          onToggle={(task, completed) => completeTask.mutate({ id: task.id, date: selectedDate, completed })}
        />
      )}
      {section === "agenda" && (
        <AgendaView
          date={selectedDate}
          setDate={setSelectedDate}
          events={agenda}
          calendarEvents={agendaCalendar}
          tasks={tasks}
          googleConnections={googleCalendarConnections}
          responsibleOptions={responsibleOptions}
          loading={agendaQuery.isLoading}
          calendarLoading={agendaCalendarQuery.isLoading}
          googleConnectionsLoading={googleCalendarConnectionsQuery.isLoading}
          onCreate={(payload) => createAgendaEvent.mutate(payload)}
          onUpdate={(id, patch) => updateAgendaEvent.mutate({ id, patch })}
          onDelete={(id) => deleteAgendaEvent.mutate(id)}
          onToggleTask={(taskId, taskDate, completed) => completeTask.mutate({ id: taskId, date: taskDate, completed })}
          onConnectGoogleCalendar={(responsible) => connectGoogleCalendar.mutate(responsible)}
          onDisconnectGoogleCalendar={(id) => disconnectGoogleCalendar.mutate(id)}
        />
      )}
      {section === "tasks" && (
        <Tasks
          tasks={tasks}
          responsibleOptions={responsibleOptions}
          loading={tasksQuery.isLoading}
          onCreate={(payload) => createTask.mutate(payload)}
          onDelete={(task) => deleteTask.mutate(task)}
          onComplete={(task) => completeTask.mutate({ id: task.id, date: selectedDate, completed: !(task.completedDates ?? []).includes(selectedDate) })}
          onUpdate={(id, patch) => updateTask.mutate({ id, patch })}
        />
      )}
      {section === "shopping" && (
        <Shopping
          shopping={shopping}
          loading={shoppingQuery.isLoading}
          onCreate={(payload) => createShoppingItem.mutate(payload)}
          onUpdate={(id, patch) => updateShoppingItem.mutate({ id, patch })}
          onDelete={(id) => deleteShoppingItem.mutate(id)}
        />
      )}
      {section === "market" && (
        <MarketMode
          shopping={shopping}
          onCreate={(payload) => createShoppingItem.mutate(payload)}
          onUpdate={(id, patch) => updateShoppingItem.mutate({ id, patch })}
          onFinish={(payload) => finishPurchase.mutate(payload)}
        />
      )}
      {section === "finance" && (
        <FinanceView
          finances={finances}
          responsibleOptions={responsibleOptions}
          onCreate={(payload) => createFinance.mutate(payload)}
          onDelete={(id) => deleteFinance.mutate(id)}
        />
      )}
      {section === "plan" && <PlanView />}
      {section === "growth" && (
        <PersonalGrowthView
          date={selectedDate}
          setDate={setSelectedDate}
          rules={rules}
          loading={rulesQuery.isLoading}
          onCreate={(payload) => createRule.mutate(payload)}
          onUpdate={(id, patch) => updateRule.mutate({ id, patch })}
          onCheckIn={(id, completed) => checkInRule.mutate({ id, date: selectedDate, completed })}
          onDelete={(id) => deleteRule.mutate(id)}
        />
      )}
      {section === "mental" && <DistributionView distribution={distribution} />}
      {section === "settings" && (
        <SettingsView
          responsibleOptions={responsibleOptions}
          onSave={(responsibleNames) => updateProfile.mutate({ responsibleNames })}
        />
      )}
    </AppShell>
  );
}

function BackendNotice() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Alguns dados não foram carregados.</p>
      <p className="mt-1 text-amber-800">Confira se a API está ativa e se o banco está atualizado antes de continuar a rotina.</p>
    </div>
  );
}

function PlanPrompt({ onOpen }: { onOpen: () => void }) {
  return (
    <Card className="duo-enter border-clay/25 bg-[#fff7e8]">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-clay/10 px-3 py-1 text-xs font-semibold text-clay">
            <Gem size={14} /> Estrutura de receita pronta
          </div>
          <h2 className="text-2xl font-semibold">Plano Pro aparece quando a casa já viu valor.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            O upgrade é apresentado depois que existem tarefas, agenda e histórico: perda de organização pesa mais do que uma lista fria de recursos.
          </p>
        </div>
        <Button onClick={onOpen}>
          Ver planos
          <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function PlanView() {
  const plans = [
    {
      name: "Casa Base",
      price: "R$ 19",
      role: "Decoy de entrada",
      description: "Para testar a rotina com limites visíveis.",
      features: ["1 casa", "2 responsáveis", "30 tarefas ativas", "Sem histórico mensal completo"],
      cta: "Continuar no Base",
      muted: true
    },
    {
      name: "Casa Pro",
      price: "R$ 29",
      role: "Mais escolhido",
      description: "O plano alvo para casais que querem manter acordos e histórico.",
      features: ["Responsáveis ilimitados", "Histórico completo", "Google Calendar por pessoa", "Insights de carga mental"],
      cta: "Ativar Pro",
      highlighted: true
    },
    {
      name: "Casa Família",
      price: "R$ 59",
      role: "Âncora de valor",
      description: "Para casas maiores, familiares e rotinas compartilhadas com apoio.",
      features: ["Múltiplas casas", "Rotinas por grupo", "Prioridade no suporte", "Revisão mensal de organização"],
      cta: "Falar sobre Família"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-[#fff7e8]">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
            <Gem size={14} /> Good-Better-Best
          </div>
          <h2 className="text-3xl font-semibold">Monetização sem empurrar plano cedo demais.</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            A comparação coloca o Pro no centro, com Base limitado e Família como âncora. O CTA deve aparecer depois da primeira rotina configurada.
          </p>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.highlighted ? "border-clay bg-[#fff2df] shadow-premium" : plan.muted ? "opacity-85" : ""}`}>
            {plan.highlighted && <span className="absolute right-4 top-4 rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white">{plan.role}</span>}
            {!plan.highlighted && <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">{plan.role}</span>}
            <h3 className="mt-5 text-2xl font-semibold">{plan.name}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">{plan.description}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-semibold">{plan.price}</span>
              <span className="pb-1 text-sm text-stone-500">/mês</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-stone-700">
              {plan.features.map((feature, index) => (
                <li key={feature} className={index === 0 || index === plan.features.length - 1 ? "font-semibold text-ink" : ""}>
                  <Check className="mr-2 inline text-moss" size={15} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={plan.highlighted ? "primary" : "ghost"}>
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyAction({ title, detail, action, onClick }: { title: string; detail: string; action: string; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-[#fffaf0] p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-500">{detail}</p>
      <Button className="mt-4" onClick={onClick}>
        {action}
        <ArrowRight size={16} />
      </Button>
    </div>
  );
}

function ActivationPanel({
  items,
  onSelect
}: {
  items: Array<{ title: string; detail: string; done: boolean; action: string; section: string; icon: typeof Target }>;
  onSelect: (section: string) => void;
}) {
  const completed = items.filter((item) => item.done).length;
  const progress = completed === items.length ? 100 : Math.max(20, Math.round((completed / items.length) * 100));
  const nextItem = items.find((item) => !item.done);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
            <Check size={14} /> {completed}/{items.length} passos concluídos
          </div>
          <h2 className="text-2xl font-semibold">Coloque a casa em funcionamento</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Complete os primeiros acordos para transformar o painel em rotina útil, não em uma tela vazia.
          </p>
        </div>
        {nextItem ? (
          <Button onClick={() => onSelect(nextItem.section)}>
            {nextItem.action}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Badge tone="emerald">Casa configurada</Badge>
        )}
      </div>
      <div className="mt-5">
        <Progress value={progress} tone="bg-moss" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onSelect(item.section)}
            className={`rounded-lg border p-4 text-left transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.99] ${
              item.done ? "border-emerald-400/30 bg-emerald-500/10" : "border-line bg-[#fffaf0] hover:border-clay"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <item.icon className={item.done ? "text-moss" : "text-clay"} size={18} />
              <span className={`grid h-6 w-6 place-items-center rounded-full ${item.done ? "bg-emerald-500 text-white" : "bg-[#efe2cf] text-stone-500"}`}>
                {item.done ? <Check size={14} /> : null}
              </span>
            </div>
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">{item.detail}</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

function SettingsView({ responsibleOptions, onSave }: { responsibleOptions: string[]; onSave: (responsibleNames: string[]) => void }) {
  const [count, setCount] = useState(Math.max(responsibleOptions.length, 1));
  const [names, setNames] = useState(() => {
    const initial = responsibleOptions.length ? responsibleOptions : ["Responsável 1"];
    return [...initial, "Responsável 2", "Responsável 3", "Responsável 4", "Responsável 5", "Responsável 6"].slice(0, 6);
  });
  const { animationsEnabled, soundEnabled, setAnimationsEnabled, setSoundEnabled } = useExperienceStore();

  function updateName(index: number, value: string) {
    setNames((current) => current.map((name, itemIndex) => (itemIndex === index ? value : name)));
  }

  function saveResponsibleNames(form: FormData) {
    const selectedCount = Number(form.get("responsibleCount") || count);
    const nextNames = Array.from({ length: selectedCount }, (_, index) => String(form.get(`responsibleName${index}`) || ""));
    onSave(uniqueNames(nextNames));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <Wand2 className="text-clay" />
          <div>
            <h2 className="text-xl font-semibold">Experiência</h2>
            <p className="text-sm text-stone-500">Preferências locais para entrada, cadastro e feedback de erro.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <PreferenceToggle
            icon={Wand2}
            title="Animações de entrada"
            detail="Porta, chave e entrada suave no sistema."
            checked={animationsEnabled}
            onChange={setAnimationsEnabled}
          />
          <PreferenceToggle
            icon={Volume2}
            title="Sons da interface"
            detail="Som curto para abertura e tentativa sem sucesso."
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
        </div>
      </Card>
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <Users className="text-clay" />
          <div>
            <h2 className="text-xl font-semibold">Responsáveis da casa</h2>
            <p className="text-sm text-stone-500">Esses nomes aparecem nas tarefas, agenda e conexão do Google Calendar.</p>
          </div>
        </div>
        <form action={saveResponsibleNames} className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-stone-500">Quantidade de responsáveis</p>
            <Select name="responsibleCount" value={count} onChange={(event) => setCount(Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: count }, (_, index) => (
              <Input
                key={index}
                name={`responsibleName${index}`}
                value={names[index] ?? ""}
                onChange={(event) => updateName(index, event.target.value)}
                placeholder={`Responsável ${index + 1}`}
              />
            ))}
          </div>
          <Button type="submit"><Check size={16} /> Salvar responsáveis</Button>
        </form>
      </Card>
    </div>
  );
}

function PreferenceToggle({
  icon: Icon,
  title,
  detail,
  checked,
  onChange
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-lg border border-line bg-[#fffaf0] p-4 text-left transition-[border-color,background-color,transform] duration-150 ease-out hover:border-clay active:scale-[0.99]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#efe2cf] text-clay">
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-stone-500">{detail}</span>
        </span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${checked ? "bg-clay" : "bg-stone-300"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card className="p-3 sm:p-5">
      <p className="truncate text-xs text-stone-500 sm:text-sm">{title}</p>
      <p className="mt-2 truncate text-2xl font-semibold sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-1 truncate text-xs text-stone-500 sm:mt-2 sm:text-sm">{detail}</p>
    </Card>
  );
}

function Insights({ distribution, expense, income }: { distribution: Array<{ name: string; percentage: number }>; expense: number; income: number }) {
  const overloaded = distribution.find((item) => item.percentage >= 65);
  const insights = [
    overloaded ? `${overloaded.name} está com ${overloaded.percentage}% das tarefas ponderadas` : "As tarefas estão equilibradas",
    expense > income * 0.25 ? "Os gastos aumentaram em relação ao limite saudável" : "Resumo financeiro estável",
    overloaded ? "Redistribuir tarefas pode ajudar" : "Distribuição saudável para a semana"
  ];
  return (
    <Card>
      <h2 className="text-xl font-semibold">Insights inteligentes</h2>
      <div className="mt-5 space-y-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-600">{insight}</div>
        ))}
      </div>
    </Card>
  );
}

function TaskRow({ task, date, onToggle }: { task: Task; date?: string; onToggle: () => void }) {
  const doneOnDate = date ? (task.completedDates ?? []).includes(date) : task.completed;
  return (
    <motion.div layout className={`flex items-center gap-3 rounded-lg border border-l-4 border-line p-3 ${responsibleAccent(task.responsible)}`}>
      <button onClick={onToggle} className={`grid h-9 w-9 place-items-center rounded-xl ${doneOnDate ? "bg-emerald-500 text-white" : "bg-[#efe2cf] text-stone-500"}`}>
        <Check size={17} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={doneOnDate ? "truncate text-stone-500 line-through" : "truncate font-medium"}>{task.title}</p>
        <p className="truncate text-xs text-stone-500">{task.responsible} • grau {weightLabel[task.weight]} • {task.recurrence === "daily" ? "diária" : task.recurrence === "weekly" ? "semanal" : task.recurrence === "monthly" ? "mensal" : "sem repetição"}</p>
      </div>
      <Badge tone={weightTone[task.weight]}>{weightLabel[task.weight]}</Badge>
    </motion.div>
  );
}

function Tasks({
  tasks,
  responsibleOptions,
  loading,
  onCreate,
  onDelete,
  onComplete,
  onUpdate
}: {
  tasks: Task[];
  responsibleOptions: string[];
  loading: boolean;
  onCreate: (task: TaskCreatePayload) => void;
  onDelete: (task: Task) => void;
  onComplete: (task: Task) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
}) {
  const [recurrence, setRecurrence] = useState<Task["recurrence"]>("daily");
  function addTask(form: FormData) {
    const title = String(form.get("title") ?? "").trim();
    if (!title) return;
    const selectedRecurrence = String(form.get("recurrence") || "daily") as Task["recurrence"];
    const selectedDays = form.getAll("scheduledDays") as WeekDay[];
    const todayWeekDay = indexWeekDay[new Date(`${today}T00:00:00`).getDay()] as WeekDay;
    const scheduledDays = selectedRecurrence === "daily" ? [] : selectedRecurrence === "weekly" ? selectedDays.length ? selectedDays : [todayWeekDay] : [];
    const dueDate = selectedRecurrence === "none" || selectedRecurrence === "monthly" ? today : undefined;
    onCreate({
      title,
      description: String(form.get("description") || "").trim(),
      responsible: String(form.get("responsible") || "Casa"),
      weight: String(form.get("weight") || "simples") as Task["weight"],
      mentalEffort: 1,
      domesticImpact: 1,
      recurrence: selectedRecurrence,
      priority: "medium",
      dueDate,
      scheduledDays,
      completedDates: [],
      agendaTime: String(form.get("agendaTime") || "09:00")
    });
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h2 className="text-xl font-semibold">Nova tarefa</h2>
        <form action={addTask} className="mt-5 space-y-3">
          <Input name="title" placeholder="Título" />
          <Input name="description" placeholder="Descrição" />
          <Select name="responsible" defaultValue={responsibleOptions[0] ?? "Casa"}>
            {responsibleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select name="weight" defaultValue="simples" title="Grau da tarefa">
              <option value="simples">Simples</option>
              <option value="medio">Médio</option>
              <option value="pesado">Pesado</option>
            </Select>
            <Select name="recurrence" value={recurrence} onChange={(event) => setRecurrence(event.target.value as Task["recurrence"])}>
              <option value="none">Sem repetição</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </Select>
            <Input name="agendaTime" type="time" defaultValue="09:00" title="Horário para criar na agenda" />
          </div>
          {recurrence === "daily" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Vai aparecer automaticamente todos os dias.
            </p>
          )}
          {recurrence === "weekly" && (
            <div className="space-y-2">
              <p className="text-sm text-stone-500">Escolha os dias. Se não marcar nenhum, uso o dia de hoje.</p>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekDayOptions.map(([value, label]) => (
                  <label key={value} className="grid h-10 cursor-pointer place-items-center rounded-lg border border-line bg-[#fffaf0] text-[11px] text-stone-600 transition-colors duration-150 ease-out active:scale-[0.98] has-[:checked]:border-clay has-[:checked]:bg-clay sm:text-xs">
                    <input className="sr-only" type="checkbox" name="scheduledDays" value={value} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {recurrence === "monthly" && (
            <p className="rounded-lg border border-line bg-[#fffaf0] px-3 py-2 text-sm text-stone-500">
              Vai repetir todo mês no dia {Number(today.slice(8, 10))}.
            </p>
          )}
          {recurrence === "none" && (
            <p className="rounded-lg border border-line bg-[#fffaf0] px-3 py-2 text-sm text-stone-500">
              Vai entrar apenas na rotina de hoje.
            </p>
          )}
          <Button className="w-full"><Plus size={16} /> Criar</Button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Tarefas domésticas</h2>
        <div className="mt-5 space-y-3">
          {loading && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Carregando tarefas do backend...</p>}
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="flex-1">
                <TaskRow task={task} date={today} onToggle={() => onComplete(task)} />
                <div className="mt-2 grid gap-2 md:grid-cols-[1fr_120px]">
                  <Input
                    defaultValue={(task.scheduledDays ?? []).join(", ")}
                    placeholder="Dias cadastrados"
                    disabled
                  />
                  <Select defaultValue={task.weight} onChange={(event) => onUpdate(task.id, { weight: event.target.value as Task["weight"] })}>
                    <option value="simples">Simples</option>
                    <option value="medio">Médio</option>
                    <option value="pesado">Pesado</option>
                  </Select>
                </div>
              </div>
              <IconButton icon={Trash2} label="Excluir" onClick={() => onDelete(task)} />
            </div>
          ))}
          {!loading && !tasks.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Crie a primeira tarefa para gravar no backend.</p>}
        </div>
      </Card>
    </div>
  );
}

function DayView({
  date,
  setDate,
  summary,
  loading,
  onToggle
}: {
  date: string;
  setDate: (date: string) => void;
  summary?: TaskDaySummary;
  loading: boolean;
  onToggle: (task: Task, completed: boolean) => void;
}) {
  const pending = summary?.pending ?? [];
  const done = summary?.done ?? [];
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-clay" />
            <div>
              <h2 className="text-2xl font-semibold">Rotina do dia</h2>
              <p className="text-sm text-stone-500">Tarefas previstas, concluídas e pendentes pela data selecionada.</p>
            </div>
          </div>
          <Input className="md:max-w-52" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 md:gap-3">
          <Metric title="Previstas" value={String(summary?.totals.due ?? 0)} detail="deveriam ser feitas" />
          <Metric title="Feitas" value={String(summary?.totals.done ?? 0)} detail="registradas no dia" />
          <Metric title="Pendentes" value={String(summary?.totals.pending ?? 0)} detail="não foram feitas" />
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-semibold">Deveriam ser feitas</h3>
          <div className="mt-5 space-y-3">
            {loading && <p className="text-sm text-stone-500">Carregando...</p>}
            {pending.map((task) => (
              <TaskRow key={task.id} task={task} date={date} onToggle={() => onToggle(task, true)} />
            ))}
            {!loading && !pending.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nenhuma pendência nesta data.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold">Feitas no dia</h3>
          <div className="mt-5 space-y-3">
            {done.map((task) => (
              <TaskRow key={task.id} task={task} date={date} onToggle={() => onToggle(task, false)} />
            ))}
            {!loading && !done.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nada marcado como feito nesta data.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AgendaView({
  date,
  setDate,
  events,
  calendarEvents,
  tasks,
  googleConnections,
  responsibleOptions,
  loading,
  calendarLoading,
  googleConnectionsLoading,
  onCreate,
  onUpdate,
  onDelete,
  onToggleTask,
  onConnectGoogleCalendar,
  onDisconnectGoogleCalendar
}: {
  date: string;
  setDate: (date: string) => void;
  events: AgendaEvent[];
  calendarEvents: AgendaEvent[];
  tasks: Task[];
  googleConnections: GoogleCalendarConnection[];
  responsibleOptions: string[];
  loading: boolean;
  calendarLoading: boolean;
  googleConnectionsLoading: boolean;
  onCreate: (payload: AgendaPayload) => void;
  onUpdate: (id: string, patch: Partial<AgendaEvent>) => void;
  onDelete: (id: string) => void;
  onToggleTask: (taskId: string, date: string, completed: boolean) => void;
  onConnectGoogleCalendar: (responsible: string) => void;
  onDisconnectGoogleCalendar: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"day" | "month">("day");
  const [creating, setCreating] = useState(false);
  const [selectedGoogleResponsible, setSelectedGoogleResponsible] = useState(responsibleOptions[0] ?? "");
  const selectedMonth = date.slice(0, 7);

  function addEvent(form: FormData) {
    const title = String(form.get("title") ?? "");
    const startTime = String(form.get("startTime") ?? "");
    if (!title || !startTime) return;
    onCreate({
      title,
      category: String(form.get("category") || "outros") as AgendaEvent["category"],
      date: String(form.get("date") || date),
      startTime,
      endTime: String(form.get("endTime") || "") || undefined,
      responsible: String(form.get("responsible") || "Casa"),
      location: String(form.get("location") || ""),
      notes: String(form.get("notes") || ""),
      completed: false
    });
    setCreating(false);
  }

  function connectGoogleCalendar(form: FormData) {
    if (!googleCalendarEnabled) return;
    const responsible = String(form.get("googleResponsible") || "").trim();
    if (!responsible) return;
    onConnectGoogleCalendar(responsible);
  }

  const selectedGoogleConnection = useMemo(() => {
    return googleConnections.find((connection) => normalizeResponsible(connection.responsible) === normalizeResponsible(selectedGoogleResponsible));
  }, [googleConnections, selectedGoogleResponsible]);
  const selectedGoogleStatus = selectedGoogleConnection?.syncStatus ?? "disconnected";
  const selectedGoogleStatusTone = selectedGoogleStatus === "synced" ? "emerald" : selectedGoogleStatus === "failed" ? "rose" : selectedGoogleStatus === "pending" ? "amber" : "slate";
  const selectedGoogleStatusLabel =
    selectedGoogleStatus === "synced"
      ? "Sincronizado"
      : selectedGoogleStatus === "failed"
        ? "Falha na sincronização"
        : selectedGoogleStatus === "pending"
          ? "Sincronização pendente"
          : "Não conectado";

  const calendarDates = useMemo(() => calendarDatesForMonth(selectedMonth), [selectedMonth]);
  const taskDayEvents = useMemo(() => taskEventsForDates(tasks, [date]), [tasks, date]);
  const taskCalendarEvents = useMemo(() => taskEventsForDates(tasks, calendarDates), [tasks, calendarDates]);
  const dayEvents = useMemo(() => mergeAgendaWithTaskEvents(events, taskDayEvents), [events, taskDayEvents]);
  const fullCalendarEvents = useMemo(() => mergeAgendaWithTaskEvents(calendarEvents, taskCalendarEvents), [calendarEvents, taskCalendarEvents]);

  const completed = dayEvents.filter((event) => event.completed).length;
  const monthEvents = useMemo(
    () => fullCalendarEvents.filter((event) => event.date.startsWith(selectedMonth)),
    [fullCalendarEvents, selectedMonth]
  );
  const monthCompleted = monthEvents.filter((event) => event.completed).length;
  const eventsByDate = useMemo(() => {
    return fullCalendarEvents.reduce<Record<string, AgendaEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [fullCalendarEvents]);
  const agendaAccentByResponsible = useMemo(() => {
    const map = new Map<string, string>();
    fullCalendarEvents.forEach((event) => {
      const responsible = normalizeResponsible(event.responsible);
      if (!map.has(responsible)) {
        map.set(responsible, responsiblePalette[map.size % responsiblePalette.length]);
      }
    });
    return map;
  }, [fullCalendarEvents]);
  const monthEventsByResponsible = useMemo(() => {
    return monthEvents.reduce<Array<{ responsible: string; events: AgendaEvent[] }>>((groups, event) => {
      const responsible = event.responsible || "Casa";
      const group = groups.find((item) => normalizeResponsible(item.responsible) === normalizeResponsible(responsible));
      if (group) group.events.push(event);
      else groups.push({ responsible, events: [event] });
      return groups;
    }, []).map((group) => ({ ...group, events: group.events.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)) }));
  }, [monthEvents]);

  return (
    <div className="space-y-4">
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#fffaf0]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg border border-line bg-[#fffaf0] p-5 shadow-premium">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">Novo compromisso</h2>
                <p className="text-sm text-stone-500">Crie na agenda interna e sincronize com o Google do responsável conectado.</p>
              </div>
              <IconButton icon={X} label="Fechar" onClick={() => setCreating(false)} />
            </div>
            <form action={addEvent} className="space-y-3">
              <Input name="title" placeholder="Faculdade, trabalho, almoço, cinema..." autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <Input name="date" type="date" defaultValue={date} />
                <Select name="category" defaultValue="outros">
                  <option value="faculdade">Faculdade</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="refeicao">Refeição</option>
                  <option value="familia">Família</option>
                  <option value="lazer">Lazer</option>
                  <option value="transporte">Transporte</option>
                  <option value="tarefa">Tarefa</option>
                  <option value="outros">Outros</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input name="startTime" type="time" />
                <Input name="endTime" type="time" />
              </div>
              <Select name="responsible" defaultValue="Casa">
                <option value="Casa">Casa</option>
                {responsibleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </Select>
              <Input name="location" placeholder="Local ou linha do ônibus" />
              <Input name="notes" placeholder="Observações" />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
                <Button type="submit"><Plus size={16} /> Adicionar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <CalendarClock className="text-clay" />
            <div>
              <h2 className="text-xl font-semibold">Agenda</h2>
              <p className="text-sm text-stone-500">Dia, mês completo e sincronização por responsável.</p>
            </div>
          </div>
            <div className="grid grid-cols-[40px_1fr_40px] gap-2 sm:flex sm:flex-wrap sm:items-center">
              <IconButton icon={ChevronLeft} label={viewMode === "month" ? "Mês anterior" : "Dia anterior"} onClick={() => setDate(viewMode === "month" ? addMonthsToIso(date, -1) : addDaysToIso(date, -1))} />
            <Input className="min-w-0 sm:w-40" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <IconButton icon={ChevronRight} label={viewMode === "month" ? "Próximo mês" : "Próximo dia"} onClick={() => setDate(viewMode === "month" ? addMonthsToIso(date, 1) : addDaysToIso(date, 1))} />
            <Button className="col-span-1" variant={viewMode === "day" ? "primary" : "ghost"} onClick={() => setViewMode("day")}><List size={16} /> Dia</Button>
            <Button className="col-span-1" variant={viewMode === "month" ? "primary" : "ghost"} onClick={() => setViewMode("month")}><CalendarDays size={16} /> Mês</Button>
            <Button className="col-span-1" onClick={() => setCreating(true)}><Plus size={16} /> Novo</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck size={18} className="text-emerald-300" />
            <h3 className="text-sm font-semibold">Google Calendar</h3>
          </div>
          {!googleCalendarEnabled ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Google Calendar indisponível por revisão de segurança.
            </div>
          ) : null}
          <form action={connectGoogleCalendar} className="grid gap-2">
            <Select name="googleResponsible" value={selectedGoogleResponsible} onChange={(event) => setSelectedGoogleResponsible(event.target.value)} disabled={!googleCalendarEnabled}>
              {responsibleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
            <div className="rounded-lg border border-line bg-[#fffaf0] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{selectedGoogleResponsible || "Responsável"}</p>
                <Badge tone={selectedGoogleStatusTone}>{selectedGoogleStatusLabel}</Badge>
              </div>
              {selectedGoogleConnection ? (
                <div className="space-y-1 text-xs text-stone-500">
                  <p className="truncate">{selectedGoogleConnection.googleEmail}</p>
                  <p>{selectedGoogleConnection.syncedEvents ?? 0}/{selectedGoogleConnection.totalEvents ?? 0} eventos sincronizados</p>
                  <p>Última sincronização: {formatDateTime(selectedGoogleConnection.lastSyncAt)}</p>
                  {selectedGoogleConnection.lastError ? <p className="text-rose-300">Erro: {selectedGoogleConnection.lastError}</p> : null}
                </div>
              ) : (
                <p className="text-xs text-stone-500">{googleCalendarEnabled ? "Este responsável ainda não tem uma conta Google conectada." : "Conexão bloqueada enquanto a integração estiver em revisão."}</p>
              )}
            </div>
            <Button type="submit" variant={selectedGoogleConnection ? "ghost" : "primary"} disabled={!googleCalendarEnabled}><CalendarCheck size={16} /> {selectedGoogleConnection ? "Reconectar responsável" : "Conectar responsável"}</Button>
          </form>
          <div className="mt-4 space-y-2">
            {responsibleOptions.map((responsible) => {
              const connection = googleConnections.find((item) => normalizeResponsible(item.responsible) === normalizeResponsible(responsible));
              const status = connection?.syncStatus ?? "disconnected";
              const tone = status === "synced" ? "emerald" : status === "failed" ? "rose" : status === "pending" ? "amber" : "slate";
              const label = status === "synced" ? "Ok" : status === "failed" ? "Falhou" : status === "pending" ? "Pendente" : "Não conectado";
              return (
              <div key={responsible} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-[#fffaf0] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{responsible}</p>
                  <p className="truncate text-xs text-stone-500">{connection ? connection.googleEmail : "sem conta conectada"}</p>
                  {connection ? <p className="text-xs text-stone-500">{connection.syncedEvents ?? 0}/{connection.totalEvents ?? 0} eventos</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  {connection && googleCalendarEnabled ? <IconButton icon={Unplug} label="Desconectar Google Calendar" onClick={() => onDisconnectGoogleCalendar(connection.id)} /> : null}
                </div>
              </div>
              );
            })}
            {googleCalendarEnabled && googleConnectionsLoading && <p className="text-xs text-stone-500">Carregando conexões...</p>}
          </div>
        </Card>

        <Card>
        <div className="mb-5 flex flex-col gap-4">
          <div>
            <div>
              <h3 className="text-xl font-semibold">{viewMode === "month" ? monthLabel(selectedMonth) : dayShortLabel(date)}</h3>
              <p className="text-sm text-stone-500">{viewMode === "month" ? "Visão completa do mês selecionado." : "Compromissos do dia selecionado."}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Metric title="Compromissos" value={String(viewMode === "month" ? monthEvents.length : dayEvents.length)} detail={viewMode === "month" ? monthLabel(selectedMonth) : date} />
            <Metric title="Concluídos" value={String(viewMode === "month" ? monthCompleted : completed)} detail="marcados" />
            <Metric title="Pendentes" value={String(viewMode === "month" ? monthEvents.length - monthCompleted : dayEvents.length - completed)} detail="ainda abertos" />
          </div>
        </div>
        {viewMode === "month" ? (
          <div className="duo-scrollbar overflow-x-auto pb-2">
            <div className="min-w-[720px] sm:min-w-0">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-stone-500">
              {weekDayOptions.map(([, label]) => <span key={label}>{label}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDates.map((day) => {
                const dayEvents = (eventsByDate[day] ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isSelected = day === date;
                const isOutsideMonth = day.slice(0, 7) !== selectedMonth;
                const doneCount = dayEvents.filter((event) => event.completed).length;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDate(day)}
                    className={`min-h-36 rounded-lg border p-2 text-left transition hover:border-clay hover:bg-[#efe2cf] ${isSelected ? "border-clay bg-clay/15" : "border-line bg-[#fffaf0]"} ${isOutsideMonth ? "opacity-45" : ""}`}
                  >
                    <span className="text-sm font-semibold text-stone-700">{Number(day.slice(8, 10))}</span>
                    <span className="mt-1 block text-xs text-stone-500">{dayEvents.length ? `${dayEvents.length} itens` : "livre"}</span>
                    <div className="mt-2 max-h-24 space-y-1 overflow-y-auto pr-1">
                      {dayEvents.map((event) => (
                        <span key={event.id} className={`block truncate rounded-lg border-l-2 px-2 py-1 text-xs ${responsibleEventAccent(event.responsible)} ${event.completed ? "opacity-55 line-through" : ""}`}>
                          {event.startTime} {event.title}
                        </span>
                      ))}
                      {doneCount > 0 && <span className="block text-xs text-emerald-300">{doneCount} concluído{doneCount > 1 ? "s" : ""}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {monthEventsByResponsible.map((group) => (
                <div key={group.responsible} className={`rounded-lg border border-l-4 border-line p-3 ${responsibleAccent(group.responsible)}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-semibold">{group.responsible}</p>
                    <Badge>{group.events.length} itens</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.events.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setDate(event.date)}
                        className={`grid w-full gap-2 rounded-xl border-l-2 px-3 py-2 text-left text-sm md:grid-cols-[72px_1fr] ${responsibleEventAccent(event.responsible)}`}
                      >
                        <span className="text-xs text-stone-600">{event.date.slice(8, 10)}/{event.date.slice(5, 7)} {event.startTime}</span>
                        <span className="truncate">{event.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!monthEvents.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nenhum compromisso neste mês.</p>}
            </div>
            </div>
            {calendarLoading && <p className="mt-3 rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Carregando calendário do backend...</p>}
          </div>
        ) : (
        <div className="space-y-3">
          {loading && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Carregando agenda do backend...</p>}
          {dayEvents.map((event) => {
            const responsibleKey = normalizeResponsible(event.responsible);
            const virtualTask = isVirtualTaskEvent(event);
            const taskId = virtualTask ? taskIdFromVirtualEvent(event) : undefined;
            return (
            <div key={event.id} className={`grid gap-3 rounded-lg border border-l-4 border-line p-3 md:grid-cols-[96px_1fr_92px_44px] md:items-center ${agendaAccentByResponsible.get(responsibleKey) ?? responsibleAccent(responsibleKey)}`}>
              <div className="text-sm font-semibold text-clay">
                {event.startTime}
                {event.endTime ? <span className="block text-xs font-normal text-stone-500">{event.endTime}</span> : null}
              </div>
              <div className="min-w-0">
                <p className={event.completed ? "truncate text-stone-500 line-through" : "truncate font-medium"}>{event.title}</p>
                <p className="truncate text-xs text-stone-500">{event.category} • {event.responsible || "Casa"} • {event.location || "sem local"}</p>
              </div>
              <Button
                className="w-full md:w-auto"
                variant={event.completed ? "ghost" : "primary"}
                onClick={() => {
                  if (virtualTask && taskId) onToggleTask(taskId, event.date, !event.completed);
                  else onUpdate(event.id, { completed: !event.completed });
                }}
              >
                {event.completed ? "Reabrir" : "Feito"}
              </Button>
              {!virtualTask && event.category !== "tarefa" ? (
                <IconButton icon={Trash2} label="Excluir evento" onClick={() => onDelete(event.id)} />
              ) : (
                <span className="h-10 w-10" />
              )}
            </div>
            );
          })}
          {!loading && !dayEvents.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nenhum compromisso cadastrado para este dia.</p>}
        </div>
        )}
      </Card>
    </div>
    </div>
  );
}

function PersonalGrowthView({
  date,
  setDate,
  rules,
  loading,
  onCreate,
  onUpdate,
  onCheckIn,
  onDelete
}: {
  date: string;
  setDate: (date: string) => void;
  rules: PersonalRule[];
  loading: boolean;
  onCreate: (payload: PersonalRulePayload) => void;
  onUpdate: (id: string, patch: Partial<PersonalRule>) => void;
  onCheckIn: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  function addRule(form: FormData) {
    const title = String(form.get("title") ?? "");
    const conditionText = String(form.get("conditionText") ?? "");
    const rewardText = String(form.get("rewardText") ?? "");
    if (!title || !conditionText || !rewardText) return;
    onCreate({
      title,
      category: String(form.get("category") || "rotina") as PersonalRule["category"],
      conditionText,
      rewardText,
      consequenceText: String(form.get("consequenceText") || ""),
      status: "active",
      completedDates: []
    });
  }

  const activeRules = rules.filter((rule) => rule.status === "active");
  const doneToday = rules.filter((rule) => (rule.completedDates ?? []).includes(date));
  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <Target className="text-emerald-300" />
          <div>
            <h2 className="text-xl font-semibold">Desenvolvimento pessoal</h2>
            <p className="text-sm text-stone-500">Regras simples de decisão para rotina, consumo e disciplina.</p>
          </div>
        </div>
        <form action={addRule} className="space-y-3">
          <Input name="title" placeholder="Ex.: Doce só depois do almoço" />
          <Select name="category" defaultValue="alimentacao">
            <option value="alimentacao">Alimentação</option>
            <option value="consumo">Consumo</option>
            <option value="estudo">Estudo</option>
            <option value="saude">Saúde</option>
            <option value="rotina">Rotina</option>
            <option value="financeiro">Financeiro</option>
            <option value="outros">Outros</option>
          </Select>
          <Input name="conditionText" placeholder="Condição: almoçar antes, levar marmita..." />
          <Input name="rewardText" placeholder="Pode: comprar doce, cinema, lazer..." />
          <Input name="consequenceText" placeholder="Se não cumprir: não pedir delivery, guardar dinheiro..." />
          <Button className="w-full"><Plus size={16} /> Criar regra</Button>
        </form>
      </Card>
      <Card>
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_180px]">
          <Metric title="Regras ativas" value={String(activeRules.length)} detail="em andamento" />
          <Metric title="Cumpridas no dia" value={String(doneToday.length)} detail={date} />
          <Metric title="Total" value={String(rules.length)} detail="registradas" />
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="space-y-3">
          {loading && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Carregando regras do backend...</p>}
          {rules.map((rule) => {
            const done = (rule.completedDates ?? []).includes(date);
            return (
              <div key={rule.id} className="rounded-lg border border-line bg-[#fffaf0] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={done ? "truncate font-medium text-emerald-300" : "truncate font-medium"}>{rule.title}</p>
                    <p className="mt-1 text-sm text-stone-500">Se {rule.conditionText}, então {rule.rewardText}.</p>
                    {rule.consequenceText && <p className="mt-1 text-xs text-stone-500">Sem cumprir: {rule.consequenceText}</p>}
                  </div>
                  <Badge tone={done ? "emerald" : rule.status === "paused" ? "amber" : "indigo"}>{done ? "feito hoje" : rule.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={done ? "ghost" : "primary"} onClick={() => onCheckIn(rule.id, !done)}>
                    {done ? "Desmarcar hoje" : "Cumpri hoje"}
                  </Button>
                  <Button variant="ghost" onClick={() => onUpdate(rule.id, { status: rule.status === "paused" ? "active" : "paused" })}>
                    {rule.status === "paused" ? "Ativar" : "Pausar"}
                  </Button>
                  <IconButton icon={Trash2} label="Excluir regra" onClick={() => onDelete(rule.id)} />
                </div>
              </div>
            );
          })}
          {!loading && !rules.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nenhuma regra de desenvolvimento cadastrada.</p>}
        </div>
      </Card>
    </div>
  );
}

function Shopping({
  shopping,
  loading,
  onCreate,
  onUpdate,
  onDelete
}: {
  shopping: ShoppingItem[];
  loading: boolean;
  onCreate: (payload: ShoppingPayload) => void;
  onUpdate: (id: string, patch: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
}) {
  function addItem(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const estimatedPrice = parseMoney(form.get("estimatedPrice"));
    onCreate({
      name,
      quantity: String(form.get("quantity") || "1 un").trim(),
      category: String(form.get("category") || "mercado") as ShoppingItem["category"],
      estimatedPrice,
      actualPrice: 0,
      checked: false,
      cartStatus: "pending",
      purchased: false,
      notes: String(form.get("notes") || "").trim()
    });
  }
  const pendingItems = shopping.filter((item) => item.cartStatus !== "purchased");
  const purchasedItems = shopping.filter((item) => item.cartStatus === "purchased");
  const estimatedTotal = pendingItems.reduce((sum, item) => sum + Number(item.estimatedPrice || 0), 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <h2 className="text-xl font-semibold">Adicionar item</h2>
        <form action={addItem} className="mt-5 space-y-3">
          <Input name="name" placeholder="Item" />
          <Input name="quantity" placeholder="Quantidade" />
          <Select name="category"><option value="mercado">Mercado</option><option value="limpeza">Limpeza</option><option value="farmacia">Farmácia</option><option value="pet">Pet</option><option value="outros">Outros</option></Select>
          <Input name="estimatedPrice" type="number" step="0.01" placeholder="Estimativa" />
          <Input name="notes" placeholder="Observações" />
          <Button className="w-full"><Plus size={16} /> Adicionar</Button>
        </form>
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Lista de compras</h2>
            <p className="mt-1 text-sm text-stone-500">Planeje antes de sair e use o modo mercado no celular.</p>
          </div>
          <Badge tone="amber">{brl(estimatedTotal)}</Badge>
        </div>
        <div className="mt-5 space-y-3">
          {loading && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Carregando compras do backend...</p>}
          {pendingItems.map((item) => <ShoppingRow key={item.id} item={item} onUpdate={(patch) => onUpdate(item.id, patch)} onDelete={() => onDelete(item.id)} />)}
          {purchasedItems.length > 0 && (
            <div className="pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Comprados</p>
              <div className="space-y-2">
                {purchasedItems.map((item) => <ShoppingRow key={item.id} item={item} onUpdate={(patch) => onUpdate(item.id, patch)} onDelete={() => onDelete(item.id)} />)}
              </div>
            </div>
          )}
          {!loading && !shopping.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nenhum item cadastrado no backend.</p>}
        </div>
      </Card>
    </div>
  );
}

function ShoppingRow({ item, onUpdate, onDelete }: { item: ShoppingItem; onUpdate: (patch: Partial<ShoppingItem>) => void; onDelete: () => void }) {
  const purchased = item.cartStatus === "purchased";
  return (
    <div className={`grid gap-3 rounded-lg border border-line bg-[#fffaf0] p-3 transition-[background-color,border-color] duration-150 ease-out md:grid-cols-[1fr_132px_44px] md:items-center ${purchased ? "opacity-70" : ""}`}>
      <div className="min-w-0">
        <p className={purchased ? "truncate font-medium text-stone-500 line-through" : "truncate font-medium"}>{item.name}</p>
        <p className="text-xs text-stone-500">{item.quantity} • {item.category} • estimado {brl(item.estimatedPrice)}</p>
      </div>
      <Input
        value={item.actualPrice || ""}
        inputMode="decimal"
        type="number"
        step="0.01"
        placeholder="Preço"
        disabled={purchased}
        onChange={(event) => {
          const actualPrice = parseMoney(event.target.value);
          onUpdate({ actualPrice, checked: actualPrice > 0, cartStatus: actualPrice > 0 ? "cart" : "pending" });
        }}
      />
      <IconButton icon={Trash2} label="Excluir item" onClick={onDelete} />
    </div>
  );
}

function MarketMode({
  shopping,
  onCreate,
  onUpdate,
  onFinish
}: {
  shopping: ShoppingItem[];
  onCreate: (payload: ShoppingPayload) => void;
  onUpdate: (id: string, patch: Partial<ShoppingItem>) => void;
  onFinish: (payload: FinishPurchasePayload) => void;
}) {
  const activeItems = shopping.filter((item) => item.cartStatus !== "purchased");
  const cartItems = activeItems.filter((item) => item.cartStatus === "cart" || Number(item.actualPrice) > 0);
  const pendingItems = activeItems.filter((item) => item.cartStatus !== "cart" && Number(item.actualPrice || 0) <= 0);
  const purchasedItems = shopping.filter((item) => item.cartStatus === "purchased");
  const total = cartItems.reduce((sum, item) => sum + Number(item.actualPrice || 0), 0);
  const estimated = activeItems.reduce((sum, item) => sum + Number(item.estimatedPrice || 0), 0);
  const pendingEstimate = pendingItems.reduce((sum, item) => sum + Number(item.estimatedPrice || 0), 0);
  const progress = activeItems.length ? Math.round((cartItems.length / activeItems.length) * 100) : 0;

  function quickAdd(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const price = parseMoney(form.get("price"));
    onCreate({
      name,
      quantity: "1 un",
      category: "mercado",
      estimatedPrice: price,
      actualPrice: price,
      checked: Boolean(price),
      cartStatus: price ? "cart" : "pending",
      purchased: false,
      notes: ""
    });
  }

  function updateActualPrice(item: ShoppingItem, value: string) {
    const actualPrice = parseMoney(value);
    onUpdate(item.id, { actualPrice, checked: actualPrice > 0, cartStatus: actualPrice > 0 ? "cart" : "pending" });
  }

  return (
    <div className="mx-auto max-w-3xl pb-[calc(12.5rem+env(safe-area-inset-bottom))]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Modo Mercado</h2>
          <p className="text-sm text-stone-500">Marque, digite o preço e acompanhe o total enquanto compra.</p>
        </div>
        <Badge tone="emerald">{progress}%</Badge>
      </div>
      <Card className="mb-4 bg-[#fff7e8]">
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div><p className="text-stone-500">No carrinho</p><p className="mt-1 text-xl font-semibold">{brl(total)}</p></div>
          <div><p className="text-stone-500">Falta pegar</p><p className="mt-1 text-xl font-semibold">{pendingItems.length}</p></div>
          <div><p className="text-stone-500">Previsto</p><p className="mt-1 text-xl font-semibold">{brl(estimated)}</p></div>
        </div>
        <div className="mt-4"><Progress value={progress} tone="bg-moss" /></div>
      </Card>
      <div className="space-y-5">
        <MarketSection title="Comprar agora" count={pendingItems.length}>
          {pendingItems.map((item) => (
            <MarketItem key={item.id} item={item} tone="pending" onPriceChange={(value) => updateActualPrice(item, value)} onQuickCart={() => updateActualPrice(item, String(item.estimatedPrice || ""))} />
          ))}
        </MarketSection>
        <MarketSection title="No carrinho" count={cartItems.length}>
          {cartItems.map((item) => (
            <MarketItem key={item.id} item={item} tone="cart" onPriceChange={(value) => updateActualPrice(item, value)} onQuickCart={() => updateActualPrice(item, "")} />
          ))}
        </MarketSection>
        {purchasedItems.length > 0 && (
          <MarketSection title="Comprados antes" count={purchasedItems.length}>
            {purchasedItems.map((item) => (
              <MarketItem key={item.id} item={item} tone="purchased" onPriceChange={() => null} onQuickCart={() => null} />
            ))}
          </MarketSection>
        )}
        {!shopping.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">A lista do backend está vazia.</p>}
      </div>
      <form action={quickAdd} className="fixed inset-x-2 bottom-[calc(6.4rem+env(safe-area-inset-bottom))] z-20 mx-auto grid max-w-3xl grid-cols-[1fr_96px_48px] gap-2 rounded-lg border border-line bg-[#fffaf0]/90 p-2 backdrop-blur-xl sm:inset-x-4 sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:grid-cols-[1fr_112px_48px]">
        <Input name="name" placeholder="Adicionar item" />
        <Input name="price" inputMode="decimal" type="number" step="0.01" placeholder="Valor" />
        <button className="grid h-11 place-items-center rounded-lg bg-clay text-white transition-transform duration-150 ease-out active:scale-[0.97]"><Plus size={18} /></button>
      </form>
      <div className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-3xl rounded-lg border border-[#7c3f2e] bg-clay p-3 text-white shadow-premium sm:inset-x-4 sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:p-4">
        <div className="grid grid-cols-4 gap-2 text-center text-[11px] sm:gap-3 sm:text-sm">
          <div><p className="text-white/70">Subtotal</p><p className="font-semibold">{brl(total)}</p></div>
          <div><p className="text-white/70">Itens</p><p className="font-semibold">{cartItems.length}/{activeItems.length}</p></div>
          <div><p className="text-white/70">Falta</p><p className="font-semibold">{brl(pendingEstimate)}</p></div>
          <div><p className="text-white/70">Dif.</p><p className="font-semibold">{brl(total - estimated)}</p></div>
        </div>
        <Button className="mt-3 w-full bg-white text-clay hover:bg-white/90" disabled={!cartItems.length} onClick={() => onFinish({ total, estimatedTotal: estimated })}>
          <Check size={16} /> Finalizar compra
        </Button>
      </div>
    </div>
  );
}

function MarketSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
        <Badge tone="slate">{count}</Badge>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MarketItem({
  item,
  tone,
  onPriceChange,
  onQuickCart
}: {
  item: ShoppingItem;
  tone: "pending" | "cart" | "purchased";
  onPriceChange: (value: string) => void;
  onQuickCart: () => void;
}) {
  const purchased = tone === "purchased";
  return (
    <motion.div
      layout
      className={`rounded-lg border p-4 transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.995] ${
        tone === "cart" ? "border-emerald-300 bg-emerald-50" : purchased ? "border-line bg-stone-100 opacity-70" : "border-line bg-[#fffaf0]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" disabled={purchased} onClick={onQuickCart}>
          <p className={purchased ? "truncate text-lg font-semibold text-stone-500 line-through" : "truncate text-lg font-semibold"}>{item.name}</p>
          <p className="mt-1 text-sm text-stone-500">{item.quantity} • {item.category} • estimado {brl(item.estimatedPrice)}</p>
        </button>
        <Badge tone={tone === "cart" ? "emerald" : purchased ? "slate" : "amber"}>{tone === "cart" ? "no carrinho" : purchased ? "finalizado" : "pegar"}</Badge>
      </div>
      <Input
        inputMode="decimal"
        type="number"
        step="0.01"
        value={item.actualPrice || ""}
        placeholder="Preço pago"
        disabled={purchased}
        onChange={(event) => onPriceChange(event.target.value)}
      />
    </motion.div>
  );
}

function FinanceView({
  finances,
  responsibleOptions,
  onCreate,
  onDelete
}: {
  finances: Finance[];
  responsibleOptions: string[];
  onCreate: (payload: FinancePayload) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [entryKind, setEntryKind] = useState<"daily_expense" | "variable_bill" | "next_bill" | "salary">("daily_expense");
  const [splitMode, setSplitMode] = useState<"proportional" | "equal">("proportional");
  const [sharingChoice, setSharingChoice] = useState<NonNullable<Finance["sharing"]>>("personal");
  const participants = responsibleOptions.length ? responsibleOptions : ["Casa"];
  const effectiveSharing = splitMode === "equal" && entryKind !== "salary" ? "shared" : sharingChoice;
  const needsResponsible = entryKind === "salary" || effectiveSharing === "personal";
  const defaultDueDate = addMonthsToIso(purchaseDate, 1);
  const defaultBillingMonth = defaultDueDate.slice(0, 7);
  const nextMonth = addMonthsToIso(`${selectedMonth}-01`, 1).slice(0, 7);
  const monthFinances = finances.filter((item) => financeOccursInMonth(item, selectedMonth));
  const nextMonthFinances = finances.filter((item) => financeOccursInMonth(item, nextMonth));
  const income = monthFinances.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = monthFinances.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const sharedExpense = monthFinances.filter((item) => item.type === "expense" && item.sharing !== "personal").reduce((sum, item) => sum + Number(item.amount), 0);
  const sharedFixedExpense = monthFinances.filter((item) => item.type === "expense" && item.sharing !== "personal" && item.paymentKind === "conta_fixa").reduce((sum, item) => sum + Number(item.amount), 0);
  const sharedVariableExpense = Math.max(0, sharedExpense - sharedFixedExpense);
  const divisionBaseExpense = splitMode === "proportional" ? sharedFixedExpense : sharedExpense;
  const personalExpense = monthFinances.filter((item) => item.type === "expense" && item.sharing === "personal").reduce((sum, item) => sum + Number(item.amount), 0);
  const nextBills = nextMonthFinances.filter((item) => item.type === "expense" && item.paymentKind === "conta_fixa");
  const nextVariableBills = nextMonthFinances.filter((item) => item.type === "expense" && item.paymentKind !== "conta_fixa");
  const nextBillsTotal = nextBills.reduce((sum, item) => sum + Number(item.amount), 0);
  const nextVariableBillsTotal = nextVariableBills.reduce((sum, item) => sum + Number(item.amount), 0);
  const nextPlannedTotal = nextBillsTotal + nextVariableBillsTotal;
  const salaryByResponsible = participants.reduce<Record<string, number>>((acc, name) => {
    acc[name] = monthFinances
      .filter((item) => item.type === "income" && normalizeResponsible(item.responsible || participants[0]) === normalizeResponsible(name))
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return acc;
  }, {});
  const personalByResponsible = participants.reduce<Record<string, number>>((acc, name) => {
    acc[name] = monthFinances
      .filter((item) => item.type === "expense" && item.sharing === "personal" && normalizeResponsible(item.responsible || participants[0]) === normalizeResponsible(name))
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return acc;
  }, {});
  const totalSalary = Object.values(salaryByResponsible).reduce((sum, value) => sum + value, 0);
  const divisionRows = participants.map((name) => {
    const salary = salaryByResponsible[name] ?? 0;
    const ratio = totalSalary > 0 ? salary / totalSalary : 1 / participants.length;
    const sharedShare = splitMode === "proportional" ? sharedFixedExpense * ratio : sharedExpense / participants.length;
    const personal = personalByResponsible[name] ?? 0;
    const remaining = salary - sharedShare - personal;
    return { name, salary, ratio, sharedShare, personal, remaining };
  });
  const paymentKindLabel: Record<NonNullable<Finance["paymentKind"]>, string> = {
    cartao: "Cartão",
    conta_fixa: "Conta fixa",
    dinheiro: "Dinheiro",
    pix: "Pix",
    debito: "Débito",
    outros: "Outros"
  };
  function shiftSelectedMonth(months: number) {
    setSelectedMonth(addMonthsToIso(`${selectedMonth}-01`, months).slice(0, 7));
  }
  function addFinance(form: FormData) {
    const title = String(form.get("title") ?? "");
    const amount = parseMoney(form.get("amount"));
    if (!title || amount <= 0) return;
    const kind = String(form.get("entryKind") || entryKind) as typeof entryKind;
    const type: Finance["type"] = kind === "salary" ? "income" : "expense";
    const date = String(form.get("date") || today);
    const isNextMonthCharge = kind === "next_bill" || kind === "variable_bill";
    const dueDate = String(form.get("dueDate") || (isNextMonthCharge ? addMonthsToIso(date, 1) : date));
    const billingMonth = String(form.get("billingMonth") || (isNextMonthCharge ? dueDate.slice(0, 7) : date.slice(0, 7)));
    const paymentName = String(form.get("paymentName") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    const sharing = (kind === "salary" ? "personal" : splitMode === "equal" ? "shared" : String(form.get("sharing") || sharingChoice)) as Finance["sharing"];
    const responsible = sharing === "personal" || kind === "salary" ? String(form.get("responsible") || participants[0] || "Casa").trim() : "";
    onCreate({
      title,
      amount,
      type,
      category: kind === "salary" ? "casa" : String(form.get("category")) as Finance["category"],
      date,
      paymentKind: kind === "salary" ? "outros" : String(form.get("paymentKind") || (kind === "next_bill" ? "conta_fixa" : kind === "variable_bill" ? "cartao" : "pix")) as Finance["paymentKind"],
      paymentName: paymentName || undefined,
      dueDate,
      billingMonth,
      notes: notes || undefined,
      responsible,
      sharing
    });
    setSelectedMonth(billingMonth);
  }
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold capitalize">{monthLabel(selectedMonth)}</h2>
            <p className="text-sm text-stone-500">Salários separados, contas compartilhadas e gastos pessoais no mesmo mês.</p>
          </div>
          <div className="grid grid-cols-[40px_1fr_40px] gap-2">
            <Button type="button" variant="ghost" className="px-0" onClick={() => shiftSelectedMonth(-1)}><ChevronLeft size={18} /></Button>
            <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            <Button type="button" variant="ghost" className="px-0" onClick={() => shiftSelectedMonth(1)}><ChevronRight size={18} /></Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Salários", brl(income), "entradas do mês"],
            ["Fixas da casa", brl(sharedFixedExpense), splitMode === "proportional" ? "divididas por renda" : "somadas na divisão"],
            ["Gastos pessoais", brl(personalExpense), "fora da divisão"],
            ["Variáveis", brl(sharedVariableExpense), `compartilhadas no mês`],
            ["Próximo mês", brl(nextPlannedTotal), `${nextBills.length} fixas • ${nextVariableBills.length} variáveis`]
          ].map(([title, value, detail]) => (
            <div key={title} className="rounded-lg border border-line bg-[#fffaf0] p-4">
              <p className="text-sm text-stone-500">{title}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
              <p className="mt-2 text-sm text-stone-500">{detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-clay" />
              <div>
                <h2 className="text-xl font-semibold">Divisão das contas</h2>
                <p className="text-sm text-stone-500">Compare a divisão proporcional com a divisão única sem duplicar lançamentos.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 rounded-lg bg-[#efe2cf] p-1 text-sm font-semibold">
              <button
                type="button"
                className={`rounded-md px-3 py-2 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] ${splitMode === "proportional" ? "bg-white text-ink shadow-sm" : "text-stone-600"}`}
                onClick={() => setSplitMode("proportional")}
              >
                Proporcional
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-2 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] ${splitMode === "equal" ? "bg-white text-ink shadow-sm" : "text-stone-600"}`}
                onClick={() => {
                  setSplitMode("equal");
                  setSharingChoice("shared");
                }}
              >
                Única
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-600">
              <p className="font-semibold text-ink">Como lançar salários</p>
              <p className="mt-2 leading-5">Use o tipo <strong>Salário</strong> para cada responsável. Esses valores alimentam a proporção da divisão.</p>
            </div>
            <div className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-600">
              <p className="font-semibold text-ink">Divisão proporcional</p>
              <p className="mt-2 leading-5">Calcula a porcentagem de cada salário sobre a renda total e aplica essa porcentagem nas contas fixas compartilhadas da casa.</p>
            </div>
            <div className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-600">
              <p className="font-semibold text-ink">Fixas e parcelas</p>
              <p className="mt-2 leading-5">Conta fixa repete todo mês a partir do mês cobrado. Parcelas ainda precisam ser lançadas separadas.</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-600">
            {splitMode === "proportional"
              ? "Na divisão proporcional, a renda define quanto cada pessoa assume das contas fixas compartilhadas. Variáveis ficam separadas para conferência."
              : "Na divisão única/somada, todas as contas compartilhadas viram um total único dividido igualmente."}
          </div>
          <div className="mt-5 space-y-3">
            {divisionRows.map((row) => {
              const percentage = divisionBaseExpense > 0 ? Math.round((row.sharedShare / divisionBaseExpense) * 100) : 0;
              return (
                <div key={row.name} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-sm text-stone-500">Salário {brl(row.salary)} • pessoais {brl(row.personal)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-semibold">{brl(row.sharedShare)}</p>
                      <p className="text-xs text-stone-500">{percentage}% das contas da casa</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={percentage} tone={row.remaining < 0 ? "bg-rose-400" : "bg-clay"} />
                  </div>
                  <p className={row.remaining < 0 ? "mt-3 text-sm text-rose-500" : "mt-3 text-sm text-emerald-600"}>
                    Sobra estimada: {brl(row.remaining)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ReceiptText className="text-clay" />
            <div>
              <h2 className="text-xl font-semibold">Novo lançamento</h2>
              <p className="text-sm text-stone-500">Escolha o tipo primeiro para o restante do formulário ficar previsível.</p>
            </div>
          </div>
          <form action={addFinance} className="mt-5 space-y-3">
            <input type="hidden" name="entryKind" value={entryKind} />
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["daily_expense", "Gasto diário", "Mercado, farmácia, lanche"],
                ["variable_bill", "Variável no cartão", "Compra que cai no mês seguinte"],
                ["next_bill", "Conta fixa futura", "Aluguel, luz, internet"],
                ["salary", "Salário", "Entrada por pessoa"]
              ].map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const nextKind = value as typeof entryKind;
                    setEntryKind(nextKind);
                    setSharingChoice(nextKind === "daily_expense" || nextKind === "salary" ? "personal" : "shared");
                  }}
                  className={`rounded-lg border p-3 text-left transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.98] ${entryKind === value ? "border-clay bg-clay/10" : "border-line bg-[#fffaf0]"}`}
                >
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs text-stone-500">{hint}</span>
                </button>
              ))}
            </div>
            <Input name="title" placeholder={entryKind === "salary" ? "Salário, freelance, renda extra" : "Nome do gasto ou conta"} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="amount" inputMode="decimal" type="number" step="0.01" placeholder="Valor" />
              {needsResponsible ? (
                <Select name="responsible" defaultValue={participants[0]}>
                  {participants.map((name) => <option key={name} value={name}>{name}</option>)}
                </Select>
              ) : (
                <div className="flex h-11 items-center rounded-lg border border-line bg-[#fffaf0] px-4 text-sm text-stone-600">
                  Compartilhado: entra na divisão, sem responsável fixo
                </div>
              )}
            </div>
            {entryKind !== "salary" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select name="paymentKind" defaultValue={entryKind === "next_bill" ? "conta_fixa" : entryKind === "variable_bill" ? "cartao" : "pix"}>
                    <option value="cartao">Cartão</option>
                    <option value="conta_fixa">Conta fixa</option>
                    <option value="pix">Pix</option>
                    <option value="debito">Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="outros">Outros</option>
                  </Select>
                  <Input name="paymentName" placeholder="Cartão, banco ou conta: Nubank, luz..." />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select name="category" defaultValue={entryKind === "next_bill" ? "contas" : "alimentacao"}>
                    <option value="alimentacao">Alimentação</option>
                    <option value="contas">Contas</option>
                    <option value="lazer">Lazer</option>
                    <option value="transporte">Transporte</option>
                    <option value="saude">Saúde</option>
                    <option value="casa">Casa</option>
                  </Select>
                  <Select
                    name="sharing"
                    value={effectiveSharing}
                    disabled={splitMode === "equal"}
                    onChange={(event) => setSharingChoice(event.target.value as NonNullable<Finance["sharing"]>)}
                  >
                    <option value="personal">Pessoal</option>
                    <option value="shared">Compartilhado</option>
                  </Select>
                </div>
              </>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-stone-500">{entryKind === "salary" ? "Data que recebeu" : "Data da compra ou conta"}</p>
                <Input name="date" type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-stone-500">Vencimento</p>
                <Input key={`due-${purchaseDate}-${entryKind}`} name="dueDate" type="date" defaultValue={entryKind === "next_bill" || entryKind === "variable_bill" ? defaultDueDate : purchaseDate} />
              </div>
              <div>
                <p className="mb-1 text-xs text-stone-500">
                  {entryKind === "next_bill" ? "Repete a partir de" : entryKind === "variable_bill" ? "Cai na fatura de" : "Entra no mês"}
                </p>
                <Input key={`billing-${purchaseDate}-${entryKind}`} name="billingMonth" type="month" defaultValue={entryKind === "next_bill" || entryKind === "variable_bill" ? defaultBillingMonth : purchaseDate.slice(0, 7)} />
              </div>
            </div>
            <Input name="notes" placeholder="Observação opcional" />
            <Button className="w-full"><Plus size={16} /> Salvar lançamento</Button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lançamentos do mês</h2>
            <p className="text-sm text-stone-500">Conferência por mês de cobrança, separando casa e pessoais.</p>
          </div>
          <Badge tone={expense > income && income > 0 ? "rose" : "emerald"}>{brl(income - expense)} de saldo</Badge>
        </div>
        <div className="mt-5 space-y-3">
          {monthFinances.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg bg-[#fffaf0] p-3 md:grid-cols-[1fr_140px_44px] md:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {item.paymentKind === "cartao" && <CreditCard size={16} className="shrink-0 text-clay" />}
                  <p className="truncate font-medium">{item.title}</p>
                  {item.paymentKind && <Badge tone={item.paymentKind === "conta_fixa" ? "amber" : item.paymentKind === "cartao" ? "indigo" : "slate"}>{paymentKindLabel[item.paymentKind]}</Badge>}
                  <Badge tone={item.sharing === "personal" ? "slate" : "emerald"}>{item.sharing === "personal" ? "Pessoal" : "Casa"}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-stone-500">
                  {item.sharing === "personal" ? item.responsible || "Casa" : "Compartilhado"} • {item.paymentName || item.category} • {formatDate(item.date)} • vence {formatDate(financeDueDateForMonth(item, selectedMonth))}
                </p>
                {item.notes && <p className="mt-1 truncate text-xs text-stone-500">{item.notes}</p>}
              </div>
              <p className={item.type === "income" ? "text-emerald-300 md:text-right" : "text-rose-300 md:text-right"}>{item.type === "income" ? "+" : "-"} {brl(Number(item.amount))}</p>
              <IconButton icon={Trash2} label="Excluir registro" onClick={() => onDelete(item.id)} />
            </div>
          ))}
          {!monthFinances.length && <p className="rounded-lg border border-line bg-[#fffaf0] p-4 text-sm text-stone-500">Nenhuma cobrança para este mês.</p>}
        </div>
      </Card>
    </div>
  );
}

function DistributionView({ distribution }: { distribution: Array<{ name: string; value: number; percentage: number }> }) {
  return (
    <Card className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBasket className="text-clay" />
        <div>
          <h2 className="text-2xl font-semibold">Distribuição de tarefas</h2>
          <p className="text-sm text-stone-500">Cálculo pelo grau simples, médio ou pesado de cada tarefa.</p>
        </div>
      </div>
      <div className="space-y-5">
        {distribution.map((item) => (
          <div key={item.name}>
            <div className="mb-2 flex justify-between text-sm"><span>{item.name}</span><span>{item.percentage}%</span></div>
            <Progress value={item.percentage} tone={item.percentage >= 65 ? "bg-rose-400" : "bg-emerald-400"} />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg bg-[#fffaf0] p-4 text-sm text-stone-600">{distribution.some((item) => item.percentage >= 65) ? "Há concentração de tarefas com uma pessoa. Redistribuir tarefas pesadas pode ajudar." : "Distribuição equilibrada. A rotina está em uma faixa saudável."}</div>
    </Card>
  );
}
