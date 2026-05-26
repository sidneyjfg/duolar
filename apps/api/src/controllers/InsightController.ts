import { Request, Response } from "express";
import { InsightService } from "../services/InsightService";

const service = new InsightService();

export class InsightController {
  async list(req: Request, res: Response) {
    res.json(await service.list(req.user!));
  }
}
