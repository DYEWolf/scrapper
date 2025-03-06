export interface ScrapedProperty {
  title: string;
  price: number;
  location: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  propertyType: "casa" | "departamento" | "casa en condominio";
}

// Store properties in memory
let properties: ScrapedProperty[] = [];

export async function saveProperties(newProperties: ScrapedProperty[]) {
  console.log(`Saving ${newProperties.length} properties...`);

  // Update existing properties or add new ones
  newProperties.forEach((newProp) => {
    const index = properties.findIndex(
      (p) => p.sourceUrl === newProp.sourceUrl
    );
    if (index >= 0) {
      properties[index] = newProp;
      console.log(`Updated property: ${newProp.location}`);
    } else {
      properties.push(newProp);
      console.log(`Added new property: ${newProp.location}`);
    }
  });
}

export function getProperties() {
  return properties;
}
