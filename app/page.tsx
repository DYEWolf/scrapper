"use client";
import React, { useState } from "react";

interface Property {
  title: string;
  price: number;
  location: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  propertyType: "casa" | "departamento" | "casa en condominio";
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["casa", "departamento", "casa en condominio"])
  );
  const [selectedZones, setSelectedZones] = useState<Set<string>>(
    new Set(["zapopan", "guadalajara"])
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");

  const scrapeProperties = async (page: number) => {
    if (selectedTypes.size === 0) {
      alert("Por favor selecciona al menos un tipo de propiedad");
      return;
    }

    if (selectedZones.size === 0) {
      alert("Por favor selecciona al menos una zona");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          selectedTypes: Array.from(selectedTypes),
          selectedZones: Array.from(selectedZones),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener propiedades");
      }

      const result = await response.json();

      if (result.properties) {
        setProperties(result.properties);
        setHasSearched(true);
      } else {
        throw new Error("No se recibieron propiedades del servidor");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al obtener propiedades. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
    // No llamar a scrapeProperties aquí
  };

  const zones = [
    { id: "zapopan", name: "Zapopan" },
    { id: "guadalajara", name: "Guadalajara" },
    { id: "san-pedro-tlaquepaque", name: "Tlaquepaque" },
    { id: "tonala", name: "Tonalá" },
    { id: "tlajomulco-de-zuniga", name: "Tlajomulco" },
  ];

  const handleZoneToggle = (zoneId: string) => {
    const newZones = new Set(selectedZones);
    if (newZones.has(zoneId)) {
      newZones.delete(zoneId);
    } else {
      newZones.add(zoneId);
    }
    setSelectedZones(newZones);
  };

  const sortProperties = (props: Property[]) => {
    if (sortOrder === "none") return [...props].reverse();
    return [...props].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
  };

  const filteredProperties = sortProperties(
    properties.filter((p) => selectedTypes.has(p.propertyType))
  );
  const hasProperties = hasSearched && filteredProperties.length > 0;

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => scrapeProperties(currentPage)}
            disabled={
              loading || selectedTypes.size === 0 || selectedZones.size === 0
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Buscando..." : "Buscar Propiedades"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                scrapeProperties(newPage);
              }}
              disabled={loading || currentPage === 1 || !hasProperties}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:bg-gray-100"
            >
              ←
            </button>

            <span>Página {currentPage}</span>

            <button
              onClick={() => {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                scrapeProperties(newPage);
              }}
              disabled={loading || !hasProperties}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:bg-gray-100"
            >
              →
            </button>
          </div>

          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "none" | "asc" | "desc")
            }
            className="ml-4 px-3 py-2 border rounded"
            disabled={!hasProperties}
          >
            <option value="none">Más recientes primero</option>
            <option value="asc">Precio: menor a mayor</option>
            <option value="desc">Precio: mayor a menor</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-4">
            {["casa", "departamento", "casa en condominio"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTypes.has(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {zones.map((zone) => (
              <label key={zone.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedZones.has(zone.id)}
                  onChange={() => handleZoneToggle(zone.id)}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
                <span>{zone.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {hasSearched ? (
        hasProperties ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property, index) => (
              <div key={index} className="border rounded-lg p-4 shadow">
                {property.imageUrl && (
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h2 className="text-xl font-bold mb-2">{property.title}</h2>
                <p className="text-gray-600 mb-2">{property.location}</p>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  ${property.price.toLocaleString()}
                </p>
                {property.description && (
                  <p className="text-gray-500 mb-2">{property.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {property.propertyType}
                  </span>
                  <a
                    href={property.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Ver más →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No se encontraron propiedades con los filtros seleccionados
          </div>
        )
      ) : (
        <div className="text-center text-gray-500">
          Selecciona los filtros deseados y haz click en "Buscar Propiedades"
          para comenzar
        </div>
      )}
    </main>
  );
}
