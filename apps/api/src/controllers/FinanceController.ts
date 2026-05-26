import { Request, Response } from "express";
import { FinanceDto } from "../dtos/FinanceDto";
import { FinanceService } from "../services/FinanceService";
import { validateDto } from "../utils/validate";

const service = new FinanceService();

export class FinanceController {
  async list(req: Request, res: Response) {
    res.json(await service.list(req.user!));
  }

  async create(req: Request, res: Response) {
    const data = await validateDto(FinanceDto, req.body);
    res.status(201).json(await service.create(req.user!, data));
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.user!, req.params.id, req.body));
  }

  async remove(req: Request, res: Response) {
    res.json(await service.remove(req.user!, req.params.id));
  }

  async summary(req: Request, res: Response) {
    res.json(await service.summary(req.user!));
  }
}
