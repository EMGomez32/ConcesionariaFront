import { body } from 'express-validator';

export const createUser = [
    body('email').isEmail().withMessage('Email inválido'),
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('concesionariaId').optional().isInt(),
    body('sucursalId').optional().isInt(),
    body('roleIds').isArray().withMessage('roleIds debe ser un array de IDs de roles'),
];

export const updateUser = [
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('activo').optional().isBoolean(),
    body('sucursalId').optional().isInt(),
    body('roleIds').optional().isArray().withMessage('roleIds debe ser un array de IDs de roles'),
];
