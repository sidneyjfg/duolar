import { Request, Response } from "express";
import { PersonalRuleDto } from "../dtos/PersonalRuleDto";
import { PersonalRuleService } from "../services/PersonalRuleService";
import { validateDto } from "../utils/validate";

const service = new PersonalRuleService();

export class PersonalRuleController {
  async list(req: Request, res: Response) {
    res.json(await service.list(req.user!));
  }

  async create(req: Request, res: Response) {
    const data = await validateDto(PersonalRuleDto, req.body);
    res.status(201).json(await service.create(req.user!, data));
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.user!, req.params.id, req.body));
  }

  async checkIn(req: Request, res: Response) {
    res.json(await service.checkIn(req.user!, req.params.id, req.body?.date, req.body?.completed ?? true));
  }

  async remove(req: Request, res: Response) {
    res.json(await service.remove(req.user!, req.params.id));
  }
}
