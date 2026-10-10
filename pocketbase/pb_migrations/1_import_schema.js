/**
 * Schema import
 *
 * Loads the exported production schema and a test superuser into a fresh database.
 *
 * Test superuser:
 *    email (test@sagi.local)
 *    password (sagi-test-password)
 *
 */

migrate((app) => {
  // Collections and access rules
  const schema = toString($os.readFile("/pb/pb_schema.json"));
  app.importCollectionsByMarshaledJSON(schema, true);

  // Superuser for test setup and cleanup
  const superuser = new Record(app.findCollectionByNameOrId("_superusers"));
  superuser.setEmail("test@sagi.local");
  superuser.setPassword("sagi-test-password");
  app.save(superuser);
});
