-- AlterTable
ALTER TABLE "td_materia_cjgp" ADD COLUMN     "id_profesor_materia_cjgp" INTEGER;

-- AddForeignKey
ALTER TABLE "td_materia_cjgp" ADD CONSTRAINT "td_materia_cjgp_id_profesor_materia_cjgp_fkey" FOREIGN KEY ("id_profesor_materia_cjgp") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;
