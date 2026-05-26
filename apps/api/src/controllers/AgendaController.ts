import { Request, Response } from "express";
import { AgendaEventDto } from "../dtos/AgendaDto";
import { AgendaService } from "../services/AgendaService";
import { validateDto } from "../utils/validate";

const service = new AgendaService();

export class AgendaController {
  async list(req: Request, res: Response) {
    res.json(await service.list(req.user!, req.query.date ? String(req.query.date) : undefined));
  }

  async create(req: Request, res: Response) {
    const data = await validateDto(AgendaEventDto, req.body);
    res.status(201).json(await service.create(req.user!, data));
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.user!, req.params.id, req.body));
  }

  async remove(req: Request, res: Response) {
    res.json(await service.remove(req.user!, req.params.id));
  }
}
