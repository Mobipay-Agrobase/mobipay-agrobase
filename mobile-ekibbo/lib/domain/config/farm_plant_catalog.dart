/// Second review (H): farm plant inventory catalog.
///
/// The Farm Land Registry "Total Plants" KPI breaks down per crop type.
/// The review fixes the exact category list (and per-category varieties),
/// so the plant data-entry forms use THIS catalog instead of free text:
///
///   Coffee       – Robusta
///   Cocoa        – Trinitario, Forastero, Criollo
///   Vanilla      – (no varieties)
///   Bamboo       – Asper, Strictus, Vulgaris Green  (bamboo seedlings)
///   Shade Trees  – Jackfruit, Avocado, Musizi, Mutuba, Calliandra
///                  (Kalisambuzi), Albizia (Mugavu), Ficus Natalensis
///                  (Mutuba), Cordia Africana (Mukebu), Maesopsis emini
///                  (Musizi), Ficus Ovata (Nserere)
///   Bananas, Jackfruit, Avocado, Cassava – (no varieties)
class FarmPlantCatalog {
  static const Map<String, List<String>> categories = {
    'Coffee': ['Robusta'],
    'Cocoa': ['Trinitario', 'Forastero', 'Criollo'],
    'Vanilla': [],
    // Bamboo seedlings (review H/J): Asper, Strictus, Vulgaris Green
    'Bamboo': ['Asper', 'Strictus', 'Vulgaris Green'],
    'Shade Trees': [
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
    'Bananas': [],
    'Jackfruit': [],
    'Avocado': [],
    'Cassava': [],
  };

  /// Varieties for a category (empty list = count only, no variety).
  static List<String> varietiesFor(String category) =>
      categories[category] ?? const [];
}
