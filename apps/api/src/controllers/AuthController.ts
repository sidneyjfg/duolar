import { Request, Response } from "express";
import { LoginDto, RegisterDto, UpdateProfileDto } from "../dtos/AuthDto";
import { AuthService } from "../services/AuthService";
import { validateDto } from "../utils/validate";

const service = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const data = await validateDto(RegisterDto, req.body);
    res.status(201).json(await service.register(data));
  }

  async login(req: Request, res: Response) {
    const data = await validateDto(LoginDto, req.body);
    res.json(await service.login(data));
  }

  async me(req: Request, res: Response) {
    const { password: _password, ...user } = req.user!;
    res.json({ ...user, responsibleNames: user.responsibleNames?.length ? user.responsibleNames : [user.name] });
  }

  async updateMe(req: Request, res: Response) {
    const data = await validateDto(UpdateProfileDto, req.body);
    res.json(await service.updateProfile(req.user!, data));
  }
}
