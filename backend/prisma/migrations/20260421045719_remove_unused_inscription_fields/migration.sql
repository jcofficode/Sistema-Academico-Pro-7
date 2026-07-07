/*
  Warnings:

  - You are about to drop the column `notaFinal_ahbb` on the `td_inscripcion_ahbb` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones_ahbb` on the `td_inscripcion_ahbb` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "td_inscripcion_ahbb" DROP COLUMN "notaFinal_ahbb",
DROP COLUMN "observaciones_ahbb";
