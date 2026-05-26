"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarCheck, CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, CreditCard, List, Plus, ReceiptText, ShoppingBasket, Target, Trash2, Unplug, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { brl, scoreTask } from "@/lib/utils";
import { AgendaEvent, Finance, GoogleCalendarConnection, PersonalRule, ShoppingItem, Task, TaskDaySummary } from "@/types/domain";
import { useAuthStore } from "@/store/auth-store";
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
type ProfilePayload = { responsibleNames: string[] };
const emptyTasks: Task[] = [];
const emptyShopping: ShoppingItem[] = [];
const emptyFinances: Finance[] = [];
const emptyAgenda: AgendaEvent[] = [];
const emptyGoogleConnections: GoogleCalendarConnection[] = [];
const emptyRules: PersonalRule[] = [];
const responsiblePalette = [
  "border-l-indigo-400 bg-indigo-500/10",
  "border-l-emerald-400 bg-emerald-500/10",
  "border-l-amber-400 bg-amber-500/10",
  "border-l-rose-400 bg-rose-500/10",
  "border-l-cyan-400 bg-cyan-500/10",
  "border-l-fuchsia-400 bg-fuchsia-500/10",
  "border-l-sky-400 bg-sky-500/10",
  "border-l-lime-400 bg-lime-500/10"
];
const responsibleEventPalette = [
  "border-indigo-400 bg-indigo-500/15 text-indigo-100",
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

function nextDatesForTask(recurrence: Task["recurrence"], scheduledDays: string[], count = 8) {
  const dates: string[] = [];
  const cursor = new Date(`${today}T00:00:00`);
  for (let offset = 0; offset < 60 && dates.length < count; offset += 1) {
    const current = new Date(cursor);
    current.setDate(cursor.getDate() + offset);
    const iso = current.toISOString().slice(0, 10);
    if (recurrence === "daily") dates.push(iso);
    else if (recurrence === "weekly" && scheduledDays.some((day) => weekDayIndex[day] === current.getDay())) dates.push(iso);
    else if (recurrence === "monthly" && offset === 0) dates.push(iso);
    else if (recurrence === "none" && offset === 0) dates.push(iso);
  }
  return dates;
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
    queryFn: async () => (await api.get<GoogleCalendarConnection[]>("/integrations/google-calendar")).data
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
      const { agendaTime, ...taskPayload } = payload;
      const task = (await api.post<Task>("/tasks", taskPayload)).data;
      return { task, agendaTime };
    },
    onSuccess: async ({ task, agendaTime }) => {
      const scheduledDays = task.scheduledDays ?? [];
      const fallbackDays = [indexWeekDay[new Date(`${today}T00:00:00`).getDay()]];
      const dates = nextDatesForTask(task.recurrence, scheduledDays.length ? scheduledDays : fallbackDays, task.recurrence === "none" ? 1 : 8);
      await Promise.all(
        dates.map((date) =>
          api.post<AgendaEvent>("/agenda", {
            title: task.title,
            category: "tarefa",
            date,
            startTime: agendaTime,
            responsible: task.responsible,
            location: task.responsible,
            notes: `taskId:${task.id}; Responsável: ${task.responsible}. Grau: ${weightLabel[task.weight]}.`,
            completed: false
          })
        )
      );
      refreshTasks();
      refreshAgenda();
      toast.success("Tarefa criada");
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
    onSuccess: refreshShopping,
    onError: () => toast.error("Não foi possível atualizar o item")
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

  return (
    <AppShell section={section} setSection={setSection}>
      {section === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <p className="text-sm text-slate-400">Prioridades, equilíbrio e compras em tempo real.</p>
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
                {!tasks.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhuma tarefa cadastrada no backend.</p>}
              </div>
            </Card>
            <Insights distribution={distribution} expense={expense} income={income} />
          </div>
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
          googleConnections={googleCalendarConnections}
          responsibleOptions={responsibleOptions}
          loading={agendaQuery.isLoading}
          calendarLoading={agendaCalendarQuery.isLoading}
          googleConnectionsLoading={googleCalendarConnectionsQuery.isLoading}
          onCreate={(payload) => createAgendaEvent.mutate(payload)}
          onUpdate={(id, patch) => updateAgendaEvent.mutate({ id, patch })}
          onDelete={(id) => deleteAgendaEvent.mutate(id)}
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
        />
      )}
      {section === "finance" && (
        <FinanceView
          finances={finances}
          onCreate={(payload) => createFinance.mutate(payload)}
          onDelete={(id) => deleteFinance.mutate(id)}
        />
      )}
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

function SettingsView({ responsibleOptions, onSave }: { responsibleOptions: string[]; onSave: (responsibleNames: string[]) => void }) {
  const [count, setCount] = useState(Math.max(responsibleOptions.length, 1));
  const [names, setNames] = useState(() => {
    const initial = responsibleOptions.length ? responsibleOptions : ["Responsável 1"];
    return [...initial, "Responsável 2", "Responsável 3", "Responsável 4", "Responsável 5", "Responsável 6"].slice(0, 6);
  });

  function updateName(index: number, value: string) {
    setNames((current) => current.map((name, itemIndex) => (itemIndex === index ? value : name)));
  }

  function saveResponsibleNames(form: FormData) {
    const selectedCount = Number(form.get("responsibleCount") || count);
    const nextNames = Array.from({ length: selectedCount }, (_, index) => String(form.get(`responsibleName${index}`) || ""));
    onSave(uniqueNames(nextNames));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <Users className="text-indigo-300" />
          <div>
            <h2 className="text-xl font-semibold">Responsáveis da casa</h2>
            <p className="text-sm text-slate-400">Esses nomes aparecem nas tarefas, agenda e conexão do Google Calendar.</p>
          </div>
        </div>
        <form action={saveResponsibleNames} className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-slate-400">Quantidade de responsáveis</p>
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

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
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
          <div key={insight} className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-300">{insight}</div>
        ))}
      </div>
    </Card>
  );
}

function TaskRow({ task, date, onToggle }: { task: Task; date?: string; onToggle: () => void }) {
  const doneOnDate = date ? (task.completedDates ?? []).includes(date) : task.completed;
  return (
    <motion.div layout className={`flex items-center gap-3 rounded-2xl border border-l-4 border-line p-3 ${responsibleAccent(task.responsible)}`}>
      <button onClick={onToggle} className={`grid h-9 w-9 place-items-center rounded-xl ${doneOnDate ? "bg-emerald-500 text-white" : "bg-white/6 text-slate-400"}`}>
        <Check size={17} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={doneOnDate ? "truncate text-slate-500 line-through" : "truncate font-medium"}>{task.title}</p>
        <p className="truncate text-xs text-slate-500">{task.responsible} • grau {weightLabel[task.weight]} • {task.recurrence === "daily" ? "diária" : task.recurrence === "weekly" ? "semanal" : task.recurrence === "monthly" ? "mensal" : "sem repetição"}</p>
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
  function addTask(form: FormData) {
    const title = String(form.get("title") ?? "");
    if (!title) return;
    onCreate({
      title,
      description: String(form.get("description") || ""),
      responsible: String(form.get("responsible") || "Casa"),
      weight: String(form.get("weight") || "simples") as Task["weight"],
      mentalEffort: 1,
      domesticImpact: 1,
      recurrence: String(form.get("recurrence") || "weekly") as Task["recurrence"],
      priority: "medium",
      dueDate: "",
      scheduledDays: form.getAll("scheduledDays") as Task["scheduledDays"],
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
          <div className="grid grid-cols-3 gap-3">
            <Select name="weight" defaultValue="simples" title="Grau da tarefa">
              <option value="simples">Simples</option>
              <option value="medio">Médio</option>
              <option value="pesado">Pesado</option>
            </Select>
            <Select name="recurrence" defaultValue="weekly">
              <option value="none">Sem repetição</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </Select>
            <Input name="agendaTime" type="time" defaultValue="09:00" title="Horário para criar na agenda" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDayOptions.map(([value, label]) => (
              <label key={value} className="grid h-10 cursor-pointer place-items-center rounded-2xl border border-line bg-white/5 text-xs text-slate-300 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-500">
                <input className="sr-only" type="checkbox" name="scheduledDays" value={value} />
                {label}
              </label>
            ))}
          </div>
          <Button className="w-full"><Plus size={16} /> Criar</Button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Tarefas domésticas</h2>
        <div className="mt-5 space-y-3">
          {loading && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Carregando tarefas do backend...</p>}
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
          {!loading && !tasks.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Crie a primeira tarefa para gravar no backend.</p>}
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
            <CalendarDays className="text-indigo-300" />
            <div>
              <h2 className="text-2xl font-semibold">Rotina do dia</h2>
              <p className="text-sm text-slate-400">Tarefas previstas, concluídas e pendentes pela data selecionada.</p>
            </div>
          </div>
          <Input className="md:max-w-52" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric title="Previstas" value={String(summary?.totals.due ?? 0)} detail="deveriam ser feitas" />
          <Metric title="Feitas" value={String(summary?.totals.done ?? 0)} detail="registradas no dia" />
          <Metric title="Pendentes" value={String(summary?.totals.pending ?? 0)} detail="não foram feitas" />
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-semibold">Deveriam ser feitas</h3>
          <div className="mt-5 space-y-3">
            {loading && <p className="text-sm text-slate-400">Carregando...</p>}
            {pending.map((task) => (
              <TaskRow key={task.id} task={task} date={date} onToggle={() => onToggle(task, true)} />
            ))}
            {!loading && !pending.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhuma pendência nesta data.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold">Feitas no dia</h3>
          <div className="mt-5 space-y-3">
            {done.map((task) => (
              <TaskRow key={task.id} task={task} date={date} onToggle={() => onToggle(task, false)} />
            ))}
            {!loading && !done.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nada marcado como feito nesta data.</p>}
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
  googleConnections,
  responsibleOptions,
  loading,
  calendarLoading,
  googleConnectionsLoading,
  onCreate,
  onUpdate,
  onDelete,
  onConnectGoogleCalendar,
  onDisconnectGoogleCalendar
}: {
  date: string;
  setDate: (date: string) => void;
  events: AgendaEvent[];
  calendarEvents: AgendaEvent[];
  googleConnections: GoogleCalendarConnection[];
  responsibleOptions: string[];
  loading: boolean;
  calendarLoading: boolean;
  googleConnectionsLoading: boolean;
  onCreate: (payload: AgendaPayload) => void;
  onUpdate: (id: string, patch: Partial<AgendaEvent>) => void;
  onDelete: (id: string) => void;
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

  const completed = events.filter((event) => event.completed).length;
  const monthEvents = useMemo(
    () => calendarEvents.filter((event) => event.date.startsWith(selectedMonth)),
    [calendarEvents, selectedMonth]
  );
  const monthCompleted = monthEvents.filter((event) => event.completed).length;
  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce<Record<string, AgendaEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [calendarEvents]);
  const calendarDates = useMemo(() => calendarDatesForMonth(selectedMonth), [selectedMonth]);
  const agendaAccentByResponsible = useMemo(() => {
    const map = new Map<string, string>();
    calendarEvents.forEach((event) => {
      const responsible = normalizeResponsible(event.responsible);
      if (!map.has(responsible)) {
        map.set(responsible, responsiblePalette[map.size % responsiblePalette.length]);
      }
    });
    return map;
  }, [calendarEvents]);
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-line bg-ink p-5 shadow-premium">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">Novo compromisso</h2>
                <p className="text-sm text-slate-400">Crie na agenda interna e sincronize com o Google do responsável conectado.</p>
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
            <CalendarClock className="text-indigo-300" />
            <div>
              <h2 className="text-xl font-semibold">Agenda</h2>
              <p className="text-sm text-slate-400">Dia, mês completo e sincronização por responsável.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IconButton icon={ChevronLeft} label={viewMode === "month" ? "Mês anterior" : "Dia anterior"} onClick={() => setDate(viewMode === "month" ? addMonthsToIso(date, -1) : addDaysToIso(date, -1))} />
            <Input className="w-40" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <IconButton icon={ChevronRight} label={viewMode === "month" ? "Próximo mês" : "Próximo dia"} onClick={() => setDate(viewMode === "month" ? addMonthsToIso(date, 1) : addDaysToIso(date, 1))} />
            <Button variant={viewMode === "day" ? "primary" : "ghost"} onClick={() => setViewMode("day")}><List size={16} /> Dia</Button>
            <Button variant={viewMode === "month" ? "primary" : "ghost"} onClick={() => setViewMode("month")}><CalendarDays size={16} /> Mês</Button>
            <Button onClick={() => setCreating(true)}><Plus size={16} /> Novo</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck size={18} className="text-emerald-300" />
            <h3 className="text-sm font-semibold">Google Calendar</h3>
          </div>
          <form action={connectGoogleCalendar} className="grid gap-2">
            <Select name="googleResponsible" value={selectedGoogleResponsible} onChange={(event) => setSelectedGoogleResponsible(event.target.value)}>
              {responsibleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
            <div className="rounded-2xl border border-line bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{selectedGoogleResponsible || "Responsável"}</p>
                <Badge tone={selectedGoogleStatusTone}>{selectedGoogleStatusLabel}</Badge>
              </div>
              {selectedGoogleConnection ? (
                <div className="space-y-1 text-xs text-slate-500">
                  <p className="truncate">{selectedGoogleConnection.googleEmail}</p>
                  <p>{selectedGoogleConnection.syncedEvents ?? 0}/{selectedGoogleConnection.totalEvents ?? 0} eventos sincronizados</p>
                  <p>Última sincronização: {formatDateTime(selectedGoogleConnection.lastSyncAt)}</p>
                  {selectedGoogleConnection.lastError ? <p className="text-rose-300">Erro: {selectedGoogleConnection.lastError}</p> : null}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Este responsável ainda não tem uma conta Google conectada.</p>
              )}
            </div>
            <Button type="submit" variant={selectedGoogleConnection ? "ghost" : "primary"}><CalendarCheck size={16} /> {selectedGoogleConnection ? "Reconectar responsável" : "Conectar responsável"}</Button>
          </form>
          <div className="mt-4 space-y-2">
            {responsibleOptions.map((responsible) => {
              const connection = googleConnections.find((item) => normalizeResponsible(item.responsible) === normalizeResponsible(responsible));
              const status = connection?.syncStatus ?? "disconnected";
              const tone = status === "synced" ? "emerald" : status === "failed" ? "rose" : status === "pending" ? "amber" : "slate";
              const label = status === "synced" ? "Ok" : status === "failed" ? "Falhou" : status === "pending" ? "Pendente" : "Não conectado";
              return (
              <div key={responsible} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{responsible}</p>
                  <p className="truncate text-xs text-slate-500">{connection ? connection.googleEmail : "sem conta conectada"}</p>
                  {connection ? <p className="text-xs text-slate-500">{connection.syncedEvents ?? 0}/{connection.totalEvents ?? 0} eventos</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  {connection ? <IconButton icon={Unplug} label="Desconectar Google Calendar" onClick={() => onDisconnectGoogleCalendar(connection.id)} /> : null}
                </div>
              </div>
              );
            })}
            {googleConnectionsLoading && <p className="text-xs text-slate-500">Carregando conexões...</p>}
          </div>
        </Card>

        <Card>
        <div className="mb-5 flex flex-col gap-4">
          <div>
            <div>
              <h3 className="text-xl font-semibold">{viewMode === "month" ? monthLabel(selectedMonth) : dayShortLabel(date)}</h3>
              <p className="text-sm text-slate-400">{viewMode === "month" ? "Visão completa do mês selecionado." : "Compromissos do dia selecionado."}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric title="Compromissos" value={String(viewMode === "month" ? monthEvents.length : events.length)} detail={viewMode === "month" ? monthLabel(selectedMonth) : date} />
            <Metric title="Concluídos" value={String(viewMode === "month" ? monthCompleted : completed)} detail="marcados" />
            <Metric title="Pendentes" value={String(viewMode === "month" ? monthEvents.length - monthCompleted : events.length - completed)} detail="ainda abertos" />
          </div>
        </div>
        {viewMode === "month" ? (
          <div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
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
                    className={`min-h-36 rounded-2xl border p-2 text-left transition hover:border-indigo-300 hover:bg-white/8 ${isSelected ? "border-indigo-400 bg-indigo-500/15" : "border-line bg-white/5"} ${isOutsideMonth ? "opacity-45" : ""}`}
                  >
                    <span className="text-sm font-semibold text-slate-200">{Number(day.slice(8, 10))}</span>
                    <span className="mt-1 block text-xs text-slate-500">{dayEvents.length ? `${dayEvents.length} itens` : "livre"}</span>
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
                <div key={group.responsible} className={`rounded-2xl border border-l-4 border-line p-3 ${responsibleAccent(group.responsible)}`}>
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
                        <span className="text-xs text-slate-300">{event.date.slice(8, 10)}/{event.date.slice(5, 7)} {event.startTime}</span>
                        <span className="truncate">{event.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!monthEvents.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhum compromisso neste mês.</p>}
            </div>
            {calendarLoading && <p className="mt-3 rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Carregando calendário do backend...</p>}
          </div>
        ) : (
        <div className="space-y-3">
          {loading && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Carregando agenda do backend...</p>}
          {events.map((event) => {
            const responsibleKey = normalizeResponsible(event.responsible);
            return (
            <div key={event.id} className={`grid gap-3 rounded-2xl border border-l-4 border-line p-3 md:grid-cols-[96px_1fr_92px_44px] md:items-center ${agendaAccentByResponsible.get(responsibleKey) ?? responsibleAccent(responsibleKey)}`}>
              <div className="text-sm font-semibold text-indigo-200">
                {event.startTime}
                {event.endTime ? <span className="block text-xs font-normal text-slate-500">{event.endTime}</span> : null}
              </div>
              <div className="min-w-0">
                <p className={event.completed ? "truncate text-slate-500 line-through" : "truncate font-medium"}>{event.title}</p>
                <p className="truncate text-xs text-slate-500">{event.category} • {event.responsible || "Casa"} • {event.location || "sem local"}</p>
              </div>
              <Button variant={event.completed ? "ghost" : "primary"} onClick={() => onUpdate(event.id, { completed: !event.completed })}>
                {event.completed ? "Reabrir" : "Feito"}
              </Button>
              {event.category !== "tarefa" ? (
                <IconButton icon={Trash2} label="Excluir evento" onClick={() => onDelete(event.id)} />
              ) : (
                <span className="h-10 w-10" />
              )}
            </div>
            );
          })}
          {!loading && !events.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhum compromisso cadastrado para este dia.</p>}
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
            <p className="text-sm text-slate-400">Regras simples de decisão para rotina, consumo e disciplina.</p>
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
          {loading && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Carregando regras do backend...</p>}
          {rules.map((rule) => {
            const done = (rule.completedDates ?? []).includes(date);
            return (
              <div key={rule.id} className="rounded-2xl border border-line bg-white/5 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={done ? "truncate font-medium text-emerald-300" : "truncate font-medium"}>{rule.title}</p>
                    <p className="mt-1 text-sm text-slate-400">Se {rule.conditionText}, então {rule.rewardText}.</p>
                    {rule.consequenceText && <p className="mt-1 text-xs text-slate-500">Sem cumprir: {rule.consequenceText}</p>}
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
          {!loading && !rules.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhuma regra de desenvolvimento cadastrada.</p>}
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
    const name = String(form.get("name") ?? "");
    if (!name) return;
    onCreate({
      name,
      quantity: String(form.get("quantity") || "1 un"),
      category: String(form.get("category") || "mercado") as ShoppingItem["category"],
      estimatedPrice: Number(form.get("estimatedPrice") || 0),
      actualPrice: 0,
      checked: false,
      cartStatus: "pending",
      purchased: false,
      notes: String(form.get("notes") || "")
    });
  }
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
        <h2 className="text-xl font-semibold">Lista de compras</h2>
        <div className="mt-5 space-y-3">
          {loading && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Carregando compras do backend...</p>}
          {shopping.map((item) => <ShoppingRow key={item.id} item={item} onUpdate={(patch) => onUpdate(item.id, patch)} onDelete={() => onDelete(item.id)} />)}
          {!loading && !shopping.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhum item cadastrado no backend.</p>}
        </div>
      </Card>
    </div>
  );
}

function ShoppingRow({ item, onUpdate, onDelete }: { item: ShoppingItem; onUpdate: (patch: Partial<ShoppingItem>) => void; onDelete: () => void }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-white/5 p-3 md:grid-cols-[1fr_120px_44px] md:items-center">
      <div>
        <p className={item.checked ? "font-medium text-slate-500 line-through" : "font-medium"}>{item.name}</p>
        <p className="text-xs text-slate-500">{item.quantity} • {item.category} • estimado {brl(item.estimatedPrice)}</p>
      </div>
      <Input value={item.actualPrice || ""} type="number" step="0.01" placeholder="Preço" onChange={(event) => onUpdate({ actualPrice: Number(event.target.value), checked: true, cartStatus: "cart" })} />
      <IconButton icon={Trash2} label="Excluir item" onClick={onDelete} />
    </div>
  );
}

function MarketMode({
  shopping,
  onCreate,
  onUpdate
}: {
  shopping: ShoppingItem[];
  onCreate: (payload: ShoppingPayload) => void;
  onUpdate: (id: string, patch: Partial<ShoppingItem>) => void;
}) {
  const total = shopping.reduce((sum, item) => sum + Number(item.actualPrice || 0), 0);
  const estimated = shopping.reduce((sum, item) => sum + Number(item.estimatedPrice || 0), 0);
  function quickAdd(form: FormData) {
    const name = String(form.get("name") ?? "");
    if (!name) return;
    const price = Number(form.get("price") || 0);
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
  return (
    <div className="mx-auto max-w-3xl pb-28">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Modo Mercado</h2>
          <p className="text-sm text-slate-400">Inserção rápida, total em tempo real e uso confortável no celular.</p>
        </div>
        <Badge tone="indigo">Premium</Badge>
      </div>
      <div className="space-y-3">
        {shopping.map((item) => (
          <motion.div layout key={item.id} className="rounded-2xl border border-line bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className={item.cartStatus === "purchased" ? "text-slate-500 line-through" : "text-lg font-semibold"}>{item.name}</p>
                <p className="text-sm text-slate-500">Estimado {brl(item.estimatedPrice)}</p>
              </div>
              <Badge tone={item.actualPrice ? "emerald" : "slate"}>{item.actualPrice ? "no carrinho" : "pendente"}</Badge>
            </div>
            <Input inputMode="decimal" type="number" step="0.01" value={item.actualPrice || ""} placeholder="R$ 0,00" onChange={(event) => onUpdate(item.id, { actualPrice: Number(event.target.value), checked: true, cartStatus: "cart" })} />
          </motion.div>
        ))}
        {!shopping.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">A lista do backend está vazia.</p>}
      </div>
      <form action={quickAdd} className="fixed inset-x-4 bottom-24 z-20 mx-auto grid max-w-3xl grid-cols-[1fr_112px_48px] gap-2 rounded-2xl border border-line bg-ink/90 p-2 backdrop-blur-xl">
        <Input name="name" placeholder="Adicionar item" />
        <Input name="price" inputMode="decimal" type="number" step="0.01" placeholder="Valor" />
        <button className="grid h-11 place-items-center rounded-2xl bg-indigo-500"><Plus size={18} /></button>
      </form>
      <div className="fixed inset-x-4 bottom-4 z-20 mx-auto max-w-3xl rounded-2xl border border-line bg-indigo-500 p-4 shadow-premium">
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div><p className="text-indigo-100">Subtotal</p><p className="font-semibold">{brl(total)}</p></div>
          <div><p className="text-indigo-100">Itens</p><p className="font-semibold">{shopping.length}</p></div>
          <div><p className="text-indigo-100">Média</p><p className="font-semibold">{brl(total / Math.max(shopping.length, 1))}</p></div>
          <div><p className="text-indigo-100">Dif.</p><p className="font-semibold">{brl(total - estimated)}</p></div>
        </div>
      </div>
    </div>
  );
}

function FinanceView({
  finances,
  onCreate,
  onDelete
}: {
  finances: Finance[];
  onCreate: (payload: FinancePayload) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const defaultDueDate = addMonthsToIso(purchaseDate, 1);
  const defaultBillingMonth = defaultDueDate.slice(0, 7);
  const monthFinances = finances.filter((item) => (item.billingMonth || item.date.slice(0, 7)) === selectedMonth);
  const income = monthFinances.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = monthFinances.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const fixedExpense = monthFinances.filter((item) => item.type === "expense" && item.paymentKind === "conta_fixa").reduce((sum, item) => sum + Number(item.amount), 0);
  const cardExpense = monthFinances.filter((item) => item.type === "expense" && item.paymentKind === "cartao").reduce((sum, item) => sum + Number(item.amount), 0);
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
    const amount = Number(form.get("amount") || 0);
    if (!title || amount <= 0) return;
    const type = String(form.get("type")) as Finance["type"];
    const date = String(form.get("date") || today);
    const dueDate = String(form.get("dueDate") || (type === "expense" ? addMonthsToIso(date, 1) : date));
    const billingMonth = String(form.get("billingMonth") || dueDate.slice(0, 7));
    const paymentName = String(form.get("paymentName") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    onCreate({
      title,
      amount,
      type,
      category: String(form.get("category")) as Finance["category"],
      date,
      paymentKind: String(form.get("paymentKind") || "cartao") as Finance["paymentKind"],
      paymentName: paymentName || undefined,
      dueDate,
      billingMonth,
      notes: notes || undefined
    });
    setSelectedMonth(billingMonth);
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <div className="flex items-center gap-3">
          <ReceiptText className="text-indigo-300" />
          <div>
            <h2 className="text-xl font-semibold">Adicionar gasto ou conta</h2>
            <p className="text-sm text-slate-400">Compra em maio pode entrar direto na cobrança de junho.</p>
          </div>
        </div>
        <form action={addFinance} className="mt-5 space-y-3">
          <Input name="title" placeholder="Nome do gasto, conta ou receita" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="amount" inputMode="decimal" type="number" step="0.01" placeholder="Valor" />
            <Select name="type"><option value="expense">Gasto</option><option value="income">Receita</option></Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="paymentKind" defaultValue="cartao">
              <option value="cartao">Cartão</option>
              <option value="conta_fixa">Conta fixa</option>
              <option value="pix">Pix</option>
              <option value="debito">Débito</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="outros">Outros</option>
            </Select>
            <Input name="paymentName" placeholder="Cartão ou conta: Nubank, luz..." />
          </div>
          <Select name="category"><option value="alimentacao">Alimentação</option><option value="contas">Contas</option><option value="lazer">Lazer</option><option value="transporte">Transporte</option><option value="saude">Saúde</option><option value="casa">Casa</option></Select>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-slate-500">Data do gasto</p>
              <Input name="date" type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Vencimento</p>
              <Input key={`due-${purchaseDate}`} name="dueDate" type="date" defaultValue={defaultDueDate} />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Mês cobrado</p>
              <Input key={`billing-${purchaseDate}`} name="billingMonth" type="month" defaultValue={defaultBillingMonth} />
            </div>
          </div>
          <Input name="notes" placeholder="Observação opcional" />
          <Button className="w-full"><Plus size={16} /> Salvar</Button>
        </form>
      </Card>
      <Card>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold capitalize">{monthLabel(selectedMonth)}</h2>
            <p className="text-sm text-slate-400">Conferência por mês de cobrança, não só por data da compra.</p>
          </div>
          <div className="grid grid-cols-[40px_1fr_40px] gap-2">
            <Button type="button" variant="ghost" className="px-0" onClick={() => shiftSelectedMonth(-1)}><ChevronLeft size={18} /></Button>
            <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            <Button type="button" variant="ghost" className="px-0" onClick={() => shiftSelectedMonth(1)}><ChevronRight size={18} /></Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Receitas", brl(income), "no mês"],
            ["Gastos", brl(expense), "cobranças"],
            ["Cartões", brl(cardExpense), "faturas"],
            ["Fixas", brl(fixedExpense), "contas"]
          ].map(([title, value, detail]) => (
            <div key={title} className="rounded-2xl border border-line bg-white/5 p-4">
              <p className="text-sm text-slate-400">{title}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
              <p className="mt-2 text-sm text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {monthFinances.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-2xl bg-white/5 p-3 md:grid-cols-[1fr_132px_44px] md:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  {item.paymentKind === "cartao" && <CreditCard size={16} className="shrink-0 text-indigo-300" />}
                  <p className="truncate font-medium">{item.title}</p>
                  {item.paymentKind && <Badge tone={item.paymentKind === "conta_fixa" ? "amber" : item.paymentKind === "cartao" ? "indigo" : "slate"}>{paymentKindLabel[item.paymentKind]}</Badge>}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {item.paymentName || item.category} • gasto {formatDate(item.date)} • vence {formatDate(item.dueDate)}
                </p>
                {item.notes && <p className="mt-1 truncate text-xs text-slate-500">{item.notes}</p>}
              </div>
              <p className={item.type === "income" ? "text-emerald-300 md:text-right" : "text-rose-300 md:text-right"}>{item.type === "income" ? "+" : "-"} {brl(Number(item.amount))}</p>
              <IconButton icon={Trash2} label="Excluir registro" onClick={() => onDelete(item.id)} />
            </div>
          ))}
          {!monthFinances.length && <p className="rounded-2xl border border-line bg-white/5 p-4 text-sm text-slate-400">Nenhuma cobrança para este mês.</p>}
        </div>
      </Card>
    </div>
  );
}

function DistributionView({ distribution }: { distribution: Array<{ name: string; value: number; percentage: number }> }) {
  return (
    <Card className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBasket className="text-indigo-300" />
        <div>
          <h2 className="text-2xl font-semibold">Distribuição de tarefas</h2>
          <p className="text-sm text-slate-400">Cálculo pelo grau simples, médio ou pesado de cada tarefa.</p>
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
      <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-slate-300">{distribution.some((item) => item.percentage >= 65) ? "Há concentração de tarefas com uma pessoa. Redistribuir tarefas pesadas pode ajudar." : "Distribuição equilibrada. A rotina está em uma faixa saudável."}</div>
    </Card>
  );
}
