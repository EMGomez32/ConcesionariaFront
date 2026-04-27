import client from './client';

export interface ActivateDto {
    token: string;
    password: string;
}

export interface RequestResetDto {
    email: string;
}

export interface ConfirmResetDto {
    token: string;
    password: string;
}

export const accountApi = {
    /** Activa la cuenta. Crea password + marca email verificado. */
    activate: (data: ActivateDto) =>
        client.post('/account/activate', data),

    /** Pide un email de reset. SIEMPRE responde 200 con mensaje genérico. */
    requestReset: (data: RequestResetDto) =>
        client.post('/account/password-reset/request', data),

    /** Confirma el reset con el token recibido por email. */
    confirmReset: (data: ConfirmResetDto) =>
        client.post('/account/password-reset/confirm', data),

    /** Re-envía la invitación de activación a un usuario pendiente. (admin) */
    resendInvitation: (usuarioId: number) =>
        client.post(`/account/resend-invitation/${usuarioId}`),
};
