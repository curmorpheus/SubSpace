-- Insert the Impalement Protection form type
INSERT INTO form_types (name, display_name, description, schema)
VALUES (
  'impalement-protection',
  'Impalement Protection Inspection Form',
  'OSHA-compliant impalement hazard inspection and documentation',
  '{
    "fields": [
      {"name": "date", "type": "date", "required": true},
      {"name": "jobNumber", "type": "text", "required": true},
      {
        "name": "inspections",
        "type": "array",
        "fields": [
          {"name": "startTime", "type": "time", "required": true},
          {"name": "endTime", "type": "time", "required": true},
          {"name": "location", "type": "text", "required": true},
          {"name": "hazardDescription", "type": "textarea", "required": true},
          {"name": "correctiveMeasures", "type": "textarea", "required": true},
          {"name": "creatingEmployer", "type": "text", "required": true},
          {"name": "supervisor", "type": "text", "required": true}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;
