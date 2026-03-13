import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService';
import { PrismaRefreshTokenRepository } from '../../infrastructure/database/repositories/PrismaRefreshTokenRepository';
import { Login } from '../../application/use-cases/auth/Login';
import { RefreshAuth } from '../../application/use-cases/auth/RefreshAuth';

const tokenService = new JwtTokenService();
const refreshRepo = new PrismaRefreshTokenRepository();
const loginUC = new Login(tokenService, refreshRepo);
const refreshUC = new RefreshAuth(tokenService, refreshRepo);

export class AuthController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await loginUC.execute(email, password);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const result = await refreshUC.execute(refreshToken);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // In a real scenario, you would revoke the current refresh token
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
