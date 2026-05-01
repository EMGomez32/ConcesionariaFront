import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

/**
 * Wrapper sobre react-hook-form `Controller` para nuestros inputs existentes.
 *
 * Fundación para adoptar RHF en pages grandes (PresupuestosPage 1010 LOC,
 * VentasPage 799, etc.) sin reescribir Input/Select/Textarea. El usuario
 * pasa `name` + `control` + `rules` y este componente conecta:
 *   - `field.value` / `field.onChange` al input
 *   - error de validación al `error` prop visual
 *   - label/hint/required
 *
 * Beneficios vs `useState` ad-hoc:
 *   - Re-render solo del field que cambió (no todo el form de 30 campos).
 *   - Validación declarativa con rules (o resolver de Zod).
 *   - submitting/dirty/touched out-of-the-box.
 *
 * Uso:
 *   const { control, handleSubmit } = useForm<FormValues>();
 *   <FormField control={control} name="email" label="Email" type="email"
 *              rules={{ required: 'Requerido' }} />
 */

type SharedProps = {
    label?: string;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
};

type InputFieldProps = SharedProps & {
    type?: 'text' | 'email' | 'number' | 'date' | 'tel' | 'password';
    icon?: React.ReactNode;
};

type TextareaFieldProps = SharedProps & {
    rows?: number;
};

type SelectFieldProps = SharedProps & {
    options: Array<{ value: string | number; label: string }>;
};

interface FormFieldProps<TValues extends FieldValues>
    extends Partial<InputFieldProps & TextareaFieldProps & SelectFieldProps> {
    control: Control<TValues>;
    name: Path<TValues>;
    rules?: Record<string, unknown>;
    /** input | textarea | select. Default: input */
    as?: 'input' | 'textarea' | 'select';
}

export function FormField<TValues extends FieldValues>({
    control,
    name,
    rules,
    as = 'input',
    label,
    hint,
    placeholder,
    disabled,
    required,
    type = 'text',
    icon,
    rows,
    options,
}: FormFieldProps<TValues>) {
    const finalLabel = required && label ? `${label} *` : label;

    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field, fieldState }) => {
                const errorMsg = fieldState.error?.message;
                const common = {
                    id: name as string,
                    name: name as string,
                    label: finalLabel,
                    error: errorMsg,
                    hint,
                    placeholder,
                    disabled,
                    onBlur: field.onBlur,
                    value: field.value ?? '',
                };

                if (as === 'textarea') {
                    return (
                        <Textarea
                            {...common}
                            rows={rows}
                            onChange={(e) => field.onChange(e.target.value)}
                        />
                    );
                }

                if (as === 'select') {
                    return (
                        <Select
                            {...common}
                            options={options ?? []}
                            onChange={(e) => field.onChange(e.target.value)}
                        />
                    );
                }

                return (
                    <Input
                        {...common}
                        type={type}
                        icon={icon}
                        onChange={(e) =>
                            field.onChange(
                                type === 'number'
                                    ? e.target.value === ''
                                        ? null
                                        : Number(e.target.value)
                                    : e.target.value,
                            )
                        }
                    />
                );
            }}
        />
    );
}

export default FormField;
