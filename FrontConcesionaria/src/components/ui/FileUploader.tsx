import { useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import client from '../../api/client';

interface FileUploaderProps {
    /** Endpoint POST multipart. The component will append the field `file` to the FormData. */
    endpoint: string;
    /** Extra form fields sent alongside the file (e.g. vehiculoId, tipo, descripcion). */
    extraFields?: Record<string, string | number | undefined>;
    /** Called after a successful upload with the response body. */
    onUploaded?: (result: unknown) => void;
    /** MIME types accepted by the file input. */
    accept?: string;
    /** Max bytes; default 25 MB (matches backend). */
    maxBytes?: number;
    /** Label shown above the dropzone. */
    label?: string;
    /** Disable the uploader (e.g. while a parent form is loading). */
    disabled?: boolean;
}

const DEFAULT_MAX = 25 * 1024 * 1024;

export function FileUploader({
    endpoint,
    extraFields = {},
    onUploaded,
    accept,
    maxBytes = DEFAULT_MAX,
    label = 'Subir archivo',
    disabled = false,
}: FileUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const reset = () => {
        setFile(null);
        setError(null);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > maxBytes) {
            setError(`El archivo supera el máximo de ${(maxBytes / 1024 / 1024).toFixed(1)} MB`);
            return;
        }
        setFile(f);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        setError(null);
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            for (const [key, value] of Object.entries(extraFields)) {
                if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, String(value));
                }
            }

            const result = await client.post<unknown>(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(Math.round((event.loaded / event.total) * 100));
                    }
                },
            });

            onUploaded?.(result);
            reset();
        } catch (err: unknown) {
            const e = err as { error?: { message?: string }; message?: string };
            setError(e?.error?.message || e?.message || 'Error al subir el archivo');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-uploader">
            <label className="uploader-label">{label}</label>

            {!file && (
                <button
                    type="button"
                    className="uploader-dropzone"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                >
                    <Upload size={20} />
                    <span>Click para seleccionar archivo</span>
                    {accept && <small>{accept}</small>}
                </button>
            )}

            {file && (
                <div className="uploader-selected">
                    <FileText size={18} />
                    <div className="uploader-file-info">
                        <span className="uploader-filename">{file.name}</span>
                        <small>{(file.size / 1024).toFixed(1)} KB</small>
                    </div>
                    {!uploading && (
                        <button type="button" onClick={reset} className="uploader-clear" aria-label="Quitar archivo">
                            <X size={16} />
                        </button>
                    )}
                </div>
            )}

            {uploading && (
                <div className="uploader-progress">
                    <div className="uploader-progress-bar" style={{ width: `${progress}%` }} />
                    <small>{progress}%</small>
                </div>
            )}

            {error && (
                <div className="uploader-error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleSelect}
                disabled={disabled || uploading}
                style={{ display: 'none' }}
            />

            {file && !uploading && (
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={disabled}
                    className="uploader-submit"
                >
                    Subir
                </button>
            )}

            <style>{`
                .file-uploader { display: flex; flex-direction: column; gap: 0.5rem; }
                .uploader-label { font-weight: 600; font-size: 0.825rem; color: #94a3b8; }
                .uploader-dropzone {
                    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
                    padding: 1.5rem; border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px;
                    background: rgba(30,41,59,0.3); color: #94a3b8; cursor: pointer; transition: all 0.2s;
                }
                .uploader-dropzone:hover:not(:disabled) { border-color: var(--accent, #6366f1); color: var(--accent, #6366f1); }
                .uploader-dropzone:disabled { opacity: 0.5; cursor: not-allowed; }
                .uploader-dropzone small { font-size: 0.7rem; opacity: 0.6; }
                .uploader-selected {
                    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(30,41,59,0.5);
                }
                .uploader-file-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
                .uploader-filename { font-size: 0.875rem; color: #e2e8f0; word-break: break-all; }
                .uploader-file-info small { font-size: 0.7rem; color: #64748b; }
                .uploader-clear {
                    background: transparent; color: #94a3b8; border: none; padding: 0.25rem; cursor: pointer;
                    border-radius: 6px;
                }
                .uploader-clear:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }
                .uploader-progress {
                    display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0;
                }
                .uploader-progress-bar {
                    flex: 1; height: 6px; background: var(--accent-gradient, #6366f1); border-radius: 3px;
                    transition: width 0.2s;
                }
                .uploader-error {
                    display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
                    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 8px; color: #fca5a5; font-size: 0.8rem;
                }
                .uploader-submit {
                    padding: 0.625rem 1rem; background: var(--accent-gradient, #6366f1); color: white;
                    border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: none; cursor: pointer;
                }
                .uploader-submit:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
