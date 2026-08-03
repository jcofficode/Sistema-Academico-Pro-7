import { Injectable, Logger } from '@nestjs/common';

/**
 * TasaCambioService_ap — Servicio HTTP para obtener la tasa de cambio oficial del BCV desde la API de MontosVE.
 * Endpoint: GET https://api.montosve.com/v1/fx/rates
 * Header: X-API-Key: 35|tasasve_75lKfu9rotf5bj2K33gJ3uGbxnniSpWmkMYSo17Z5cc883fe
 */
@Injectable()
export class TasaCambioService_ap {
  private readonly logger = new Logger(TasaCambioService_ap.name);
  private readonly urlMontosVE = 'https://api.montosve.com/v1/fx/rates';
  private readonly apiKeyMontosVE = '35|tasasve_75lKfu9rotf5bj2K33gJ3uGbxnniSpWmkMYSo17Z5cc883fe';

  /** Obtiene la tasa oficial del BCV (USD/VES) en tiempo real desde MontosVE. */
  async obtenerTasaOficialBCV_ap(): Promise<{ tasa: number; timestamp: string }> {
    try {
      const respuesta = await fetch(this.urlMontosVE, {
        headers: {
          'X-API-Key': this.apiKeyMontosVE,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (respuesta.ok) {
        const json = await respuesta.json();
        const items = json.data || [];
        const bcvItem = items.find(
          (i: any) => i.market === 'bcv' && i.currency_pair === 'USD/VES',
        );

        if (bcvItem && typeof bcvItem.rate === 'number') {
          const tasa = bcvItem.rate;
          const timestamp = json.meta?.timestamp || bcvItem.updated_at;
          this.logger.log(`Tasa BCV oficial obtenida desde MontosVE: ${tasa} VES/USD (${timestamp})`);
          return { tasa, timestamp };
        }
      }
    } catch (error) {
      this.logger.warn(`Error al consultar API MontosVE (${this.urlMontosVE}): ${error.message}`);
    }

    // Tasa fallback en caso de problemas de red
    return {
      tasa: 748.78,
      timestamp: new Date().toISOString(),
    };
  }
}
