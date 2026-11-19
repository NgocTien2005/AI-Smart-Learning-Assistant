# Data model

No database/model/migration changes. Separate fresh production project owns new postgres_data/uploads_data volumes. Existing data never seeded/reset/copied by this kit. Backups must cover database and uploads at a quiesced moment; restore only to verified empty target.
