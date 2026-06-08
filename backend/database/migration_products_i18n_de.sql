-- German product catalog columns (also applied at runtime by ensureProductI18nColumns)
ALTER TABLE products ADD COLUMN name_de VARCHAR(255) NULL AFTER name;
ALTER TABLE products ADD COLUMN category_de VARCHAR(100) NULL AFTER category;
ALTER TABLE products ADD COLUMN description_de TEXT NULL AFTER description;
ALTER TABLE products ADD COLUMN material_de VARCHAR(255) NULL AFTER material;
ALTER TABLE products ADD COLUMN print_type_de VARCHAR(255) NULL AFTER print_type;
ALTER TABLE products ADD COLUMN packaging_de VARCHAR(255) NULL AFTER packaging;
ALTER TABLE products ADD COLUMN moq_de VARCHAR(255) NULL AFTER moq;
ALTER TABLE products ADD COLUMN specifications_de JSON NULL AFTER specifications;
