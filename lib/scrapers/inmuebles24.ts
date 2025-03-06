import { ScrapedProperty } from "../scraper";
import { chromium } from "playwright";

export async function scrapeInmuebles24(
  pageNum: number = 1,
  selectedTypes: string[] = ["casa", "departamento", "casa en condominio"]
): Promise<ScrapedProperty[]> {
  console.log("Iniciando navegador...");
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials",
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      javaScriptEnabled: true,
    });

    // Disable image loading to improve performance
    await context.route("**/*.{png,jpg,jpeg,gif,webp,svg}", (route) =>
      route.abort()
    );
    await context.route("**/*.{css,less,scss}", (route) => route.abort());
    await context.route("**/*.{woff,woff2,ttf,otf,eot}", (route) =>
      route.abort()
    );

    const page = await context.newPage();

    // Construir la URL basada en los tipos seleccionados
    const typeMapping = {
      casa: "casas",
      departamento: "departamentos",
      "casa en condominio": "casa-en-condominio",
    };

    const selectedTypesForUrl = selectedTypes
      .map((type) => typeMapping[type as keyof typeof typeMapping])
      .join("-o-");

    const baseUrl = `https://www.inmuebles24.com/${selectedTypesForUrl}-en-renta-en-zapopan-o-guadalajara`;
    const url =
      pageNum === 1 ? `${baseUrl}.html` : `${baseUrl}-pagina-${pageNum}.html`;

    console.log(`Navegando a: ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("Esperando que cargue el contenido...");
    await page.waitForTimeout(5000); // Dar tiempo extra para que cargue el contenido dinámico

    const items: ScrapedProperty[] = [];

    // Intentar diferentes selectores
    const selectors = [
      ".postings-container .posting-card",
      ".postings-container article",
      ".postings-container > div > div",
    ];

    for (const selector of selectors) {
      console.log(`Probando selector: ${selector}`);
      const elements = await page.$$(selector);

      if (elements.length > 0) {
        console.log(`Selector encontrado: ${selector}`);

        for (const element of elements) {
          try {
            // Intentar diferentes selectores para el título
            let title = "";
            const titleSelectors = [
              "h2",
              '[data-qa="POSTING_CARD_TITLE"]',
              ".postingCard-title",
              ".postingCardTitle",
              ".posting-title",
            ];

            for (const titleSelector of titleSelectors) {
              try {
                title = await element.$eval(
                  titleSelector,
                  (el) => el.textContent?.trim() || ""
                );
                if (title) break;
              } catch (e) {
                // Continuar con el siguiente selector
              }
            }

            if (!title) {
              console.log("No se pudo encontrar el título, saltando propiedad");
              continue;
            }

            const priceText = await element.$eval(
              '[data-qa="POSTING_CARD_PRICE"]',
              (el) => el.textContent?.replace(/[^0-9]/g, "") || "0"
            );
            const price = parseInt(priceText, 10);
            const location = await element.$eval(
              '[data-qa="POSTING_CARD_LOCATION"]',
              (el) => el.textContent?.trim() || ""
            );
            const imageUrl = await element.$eval(
              "img",
              (el) => el.getAttribute("src") || ""
            );
            const sourceUrl = await element.$eval(
              "a",
              (el) => el.getAttribute("href") || ""
            );

            // Determinar el tipo de propiedad basado en los tipos seleccionados y el título
            let propertyType: "casa" | "departamento" | "casa en condominio";

            // Si solo hay un tipo seleccionado, usar ese
            if (selectedTypes.length === 1) {
              propertyType = selectedTypes[0] as
                | "casa"
                | "departamento"
                | "casa en condominio";
            } else {
              // Si hay múltiples tipos, intentar determinar por el título
              const lowerTitle = title.toLowerCase();
              if (
                lowerTitle.includes("departamento") ||
                lowerTitle.includes("depto")
              ) {
                propertyType = "departamento";
              } else if (lowerTitle.includes("condominio")) {
                propertyType = "casa en condominio";
              } else {
                propertyType = "casa";
              }
            }

            items.push({
              title,
              price,
              location,
              imageUrl,
              sourceUrl: sourceUrl.startsWith("http")
                ? sourceUrl
                : `https://www.inmuebles24.com${sourceUrl}`,
              propertyType,
            });
          } catch (error) {
            console.error("Error extrayendo datos de la propiedad:", error);
          }
        }
        break; // Si encontramos un selector que funciona, salimos del loop
      }
    }

    console.log(`Encontradas ${items.length} propiedades en página ${pageNum}`);
    return items;
  } catch (error) {
    console.error("Error scraping Inmuebles24:", error);
    return [];
  } finally {
    await browser.close();
  }
}
