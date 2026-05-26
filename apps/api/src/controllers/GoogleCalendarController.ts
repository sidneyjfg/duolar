import { Request, Response } from "express";
import { env } from "../config/env";
import { GoogleCalendarService } from "../services/GoogleCalendarService";

const service = new GoogleCalendarService();

export class GoogleCalendarController {
  async list(req: Request, res: Response) {
    res.json(await service.listConnections(req.user!));
  }

  async connect(req: Request, res: Response) {
    res.json(service.getConnectUrl(req.user!, String(req.query.responsible ?? "")));
  }

  async callback(req: Request, res: Response) {
    await service.handleCallback(String(req.query.code ?? ""), String(req.query.state ?? ""));
    res.redirect(`${env.webOrigin}/?googleCalendar=connected`);
  }

  async disconnect(req: Request, res: Response) {
    res.json(await service.disconnect(req.user!, req.params.id));
  }
}
