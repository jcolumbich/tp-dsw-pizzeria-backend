import { Type } from '@mikro-orm/core';

// MySQL devuelve DECIMAL como string; la API conserva números para el frontend.
export class DecimalNumberType extends Type<number | null, string | null> {
  constructor(
    private readonly precision: number,
    private readonly escala: number
  ) {
    super();
  }

  convertToDatabaseValue(value: number | string | null): string | null {
    if (value == null) return null;

    const numero = Number(value);

    if (!Number.isFinite(numero)) {
      throw new Error('Valor decimal inválido');
    }

    return numero.toFixed(this.escala);
  }

  convertToJSValue(value: number | string | null): number | null {
    if (value == null) return null;

    return Number(value);
  }

  getColumnType(): string {
    return `decimal(${this.precision},${this.escala})`;
  }

  compareAsType(): string {
    return 'number';
  }
}