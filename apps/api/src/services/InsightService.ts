import { User } from "../entities/User";
import { FinanceService } from "./FinanceService";
import { TaskService } from "./TaskService";

export class InsightService {
  async list(user: User) {
    const [balance, finance] = await Promise.all([new TaskService().balance(user), new FinanceService().summary(user)]);
    const insights = [balance.insight];

    if (finance.expense > finance.income * 0.75) {
      insights.push("Os gastos do mês estão próximos da renda registrada");
    } else {
      insights.push("Resumo financeiro dentro de uma faixa saudável");
    }

    if (balance.status === "overload") {
      insights.push("Redistribuir tarefas pode reduzir a carga mental");
    } else {
      insights.push("As tarefas estão equilibradas nesta semana");
    }

    return { insights, balance, finance };
  }
}
