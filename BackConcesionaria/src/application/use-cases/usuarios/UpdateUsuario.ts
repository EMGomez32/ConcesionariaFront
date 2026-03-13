import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';
import bcrypt from 'bcryptjs';

export class UpdateUsuario {
    constructor(private readonly usuarioRepository: IUsuarioRepository) { }

    async execute(id: number, data: any) {
        const exists = await this.usuarioRepository.findById(id);
        if (!exists) {
            throw new NotFoundException('Usuario');
        }

        const { password, ...updateData } = data;
        if (password) {
            (updateData as any).passwordHash = await bcrypt.hash(password, 10);
        }

        return this.usuarioRepository.update(id, updateData);
    }
}
