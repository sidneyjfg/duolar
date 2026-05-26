import { Request, Response } from "express";
import { TaskDto } from "../dtos/TaskDto";
import { TaskService } from "../services/TaskService";
import { validateDto } from "../utils/validate";

const service = new TaskService();

export class TaskController {
  async list(req: Request, res: Response) {
    res.json(await service.list(req.user!));
  }

  async create(req: Request, res: Response) {
    const data = await validateDto(TaskDto, req.body);
    res.status(201).json(await service.create(req.user!, data));
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.user!, req.params.id, req.body));
  }

  async remove(req: Request, res: Response) {
    res.json(await service.remove(req.user!, req.params.id));
  }

  async completeOnDate(req: Request, res: Response) {
    res.json(await service.completeOnDate(req.user!, req.params.id, req.body?.date, req.body?.completed ?? true));
  }

  async day(req: Request, res: Response) {
    res.json(await service.day(req.user!, String(req.query.date ?? "")));
  }

  async balance(req: Request, res: Response) {
    res.json(await service.balance(req.user!));
  }
}
