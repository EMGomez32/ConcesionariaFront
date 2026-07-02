-- DropIndex
DROP INDEX "categorias_gasto_fijo_concesionaria_id_nombre_key";

-- DropIndex
DROP INDEX "categorias_gasto_vehiculo_concesionaria_id_nombre_key";

-- DropIndex
DROP INDEX "financieras_concesionaria_id_nombre_key";

-- DropIndex
DROP INDEX "presupuestos_concesionaria_id_nro_presupuesto_key";

-- DropIndex
DROP INDEX "sucursales_concesionaria_id_nombre_key";

-- DropIndex
DROP INDEX "usuarios_concesionaria_id_email_key";

-- DropIndex
DROP INDEX "vehiculos_concesionaria_id_vin_key";

-- AlterTable
ALTER TABLE "sucursales" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_gasto_fijo_concesionaria_id_nombre_key" ON "categorias_gasto_fijo"("concesionaria_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_gasto_vehiculo_concesionaria_id_nombre_key" ON "categorias_gasto_vehiculo"("concesionaria_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "financieras_concesionaria_id_nombre_key" ON "financieras"("concesionaria_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_concesionaria_id_nro_presupuesto_key" ON "presupuestos"("concesionaria_id", "nro_presupuesto");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_concesionaria_id_nombre_key" ON "sucursales"("concesionaria_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_concesionaria_id_email_key" ON "usuarios"("concesionaria_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_concesionaria_id_vin_key" ON "vehiculos"("concesionaria_id", "vin");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
