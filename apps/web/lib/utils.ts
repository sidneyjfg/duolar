export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const weightScore = {
  simples: 1,
  medio: 3,
  pesado: 5
} as const;

export function scoreTask(task: { weight: keyof typeof weightScore }) {
  return weightScore[task.weight];
}
