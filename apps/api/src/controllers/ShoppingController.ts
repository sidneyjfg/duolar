import { Request, Response } from "express";
import { FinishPurchaseDto, ShoppingItemDto } from "../dtos/ShoppingDto";
import { ShoppingService } from "../services/ShoppingService";
import { validateDto } from "../utils/validate";

const service = new ShoppingService();

export class ShoppingController {
  async list(req: Request, res: Response) {
    res.json(await service.list(req.user!));
  }

  async create(req: Request, res: Response) {
    const data = await validateDto(ShoppingItemDto, req.body);
    res.status(201).json(await service.create(req.user!, data));
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.user!, req.params.id, req.body));
  }

  async remove(req: Request, res: Response) {
    res.json(await service.remove(req.user!, req.params.id));
  }

  async finish(req: Request, res: Response) {
    const data = await validateDto(FinishPurchaseDto, req.body);
    res.status(201).json(await service.finishPurchase(req.user!, data));
  }

  async history(req: Request, res: Response) {
    res.json(await service.history(req.user!));
  }
}
