import { NextResponse } from "next/server";
import { scrapeInmuebles24 } from "@/lib/scrapers/inmuebles24";
import { saveProperties } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const {
      page = 1,
      selectedTypes = ["casa", "departamento", "casa en condominio"],
      selectedZones = ["zapopan", "guadalajara"],
    } = await request.json();

    const properties = await scrapeInmuebles24(
      page,
      selectedTypes,
      selectedZones
    );
    console.log(
      `Encontradas ${properties.length} propiedades en página ${page}`
    );

    if (properties.length > 0) {
      console.log("Saving properties...");
      await saveProperties(properties);
    }

    return NextResponse.json({
      success: true,
      count: properties.length,
      properties: properties,
    });
  } catch (error) {
    console.error("Error in scrape route:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener propiedades" },
      { status: 500 }
    );
  }
}
