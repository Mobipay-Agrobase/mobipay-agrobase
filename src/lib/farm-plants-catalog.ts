/**
 * Farm Plant Inventory catalog — EKiBBO second review, section H.
 *
 * The "Total Plants" KPI card in the Farm Land Registry breaks down per crop
 * type. The review fixes the exact category list (and per-category varieties),
 * so the data-entry forms use THIS catalog instead of free text:
 *
 *   Coffee       – Robusta
 *   Cocoa        – Trinitario, Forastero, Criollo
 *   Vanilla      – (no varieties)
 *   Shade Trees  – Jackfruit, Avocado, Musizi, Mutuba, Calliandra
 *                  (Kalisambuzi), Albizia (Mugavu), Ficus Natalensis
 *                  (Mutuba), Cordia Africana (Mukebu), Maesopsis emini
 *                  (Musizi), Ficus Ovata (Nserere)
 *   Bananas, Jackfruit, Avocado, Cassava – (no varieties)
 */

export interface FarmPlantCategory {
  category: string
  varieties: string[] // empty = no variety breakdown, count only
}

export const FARM_PLANT_CATEGORIES: FarmPlantCategory[] = [
  { category: 'Coffee', varieties: ['Robusta'] },
  { category: 'Cocoa', varieties: ['Trinitario', 'Forastero', 'Criollo'] },
  { category: 'Vanilla', varieties: [] },
  {
    category: 'Shade Trees',
    varieties: [
      'Jackfruit',
      'Avocado',
      'Musizi',
      'Mutuba',
      'Calliandra (Kalisambuzi)',
      'Albizia (Mugavu)',
      'Ficus Natalensis (Mutuba)',
      'Cordia Africana (Mukebu)',
      'Maesopsis emini (Musizi)',
      'Ficus Ovata (Nserere)',
    ],
  },
  { category: 'Bananas', varieties: [] },
  { category: 'Jackfruit', varieties: [] },
  { category: 'Avocado', varieties: [] },
  { category: 'Cassava', varieties: [] },
]

/** Varieties for a category (empty array when the category has none). */
export function varietiesForCategory(category: string): string[] {
  return FARM_PLANT_CATEGORIES.find(c => c.category === category)?.varieties ?? []
}
