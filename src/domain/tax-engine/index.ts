// Domain Tax Engine - Exportações principais

// Types
export * from './types';

// Engines
export { CreditEngine } from './credits/CreditEngine';
export { CashbackValidator } from './credits/CashbackValidator';
export { CreditoPISCOFINSEngine } from './credits/CreditoPISCOFINSEngine';

// Calculators
export { IBSDualCalculator } from './calculators/IBSDualCalculator';
export { BaseCalculator } from './calculators/BaseCalculator';

// Classifications
export { CFOPClassifier } from './classifications/CFOPClassifier';

// Scenarios
export { TransitionCalculator } from './scenarios/TransitionCalculator';

// Catalogs
export { CatalogLoader, carregarCatalogos } from './catalogs/CatalogLoader';
export type { CatalogosCarregados } from './catalogs/CatalogLoader';

// Main
export { TaxCalculator } from './TaxCalculator';
