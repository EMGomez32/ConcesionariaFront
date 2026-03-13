import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { BaseException } from '../../../domain/exceptions/BaseException';
import bcrypt from 'bcryptjs';

export class CreateUsuario {
    constructor(private readonly usuarioRepository: IUsuarioRepository) { }

    async execute(data: any) {
        const { password, ...userData } = data;
        if (!password) {
            throw new BaseException(400, 'La contraseña es obligatoria', 'VALIDATION_ERROR');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        return this.usuarioRepository.create({ ...userData, passwordHash });
    }
}
