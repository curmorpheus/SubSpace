import { db } from "./index";
import { formTypes } from "./schema";

async function seed() {
  console.log("Seeding database...");

  // Insert the Impalement Protection form type
  await db.insert(formTypes).values({
    name: "impalement-protection",
    displayName: "Impalement Protection Inspection Form",
    description: "OSHA-compliant impalement hazard inspection and documentation",
    schema: {
      fields: [
        { name: "date", type: "date", required: true },
        { name: "jobNumber", type: "text", required: true },
        {
          name: "inspections",
          type: "array",
          fields: [
            { name: "startTime", type: "time", required: true },
            { name: "endTime", type: "time", required: true },
            { name: "location", type: "text", required: true },
            { name: "hazardDescription", type: "textarea", required: true },
            { name: "correctiveMeasures", type: "textarea", required: true },
            { name: "creatingEmployer", type: "text", required: true },
            { name: "supervisor", type: "text", required: true },
          ],
        },
      ],
    },
  });

  console.log("Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
