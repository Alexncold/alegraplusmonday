const axios = require("axios");

// Definir las credenciales de la API de Monday.com
const API_KEY =
  "MONDAY_API_KEY";
const BOARD_ID = "5353533770";

// Obtener facturas desde Alegra
async function getInvoicesFromAlegra() {
  try {
    const response = await axios.get("https://api.alegra.com/api/v1/invoices", {
      headers: {
        Authorization: `Basic API_KEY`,
      },
    });

    if (
      response.status !== 200 ||
      !response.data ||
      !Array.isArray(response.data)
    ) {
      console.error("Respuesta inesperada de Alegra:", response.data);
      throw new Error("No se pudieron obtener las facturas de Alegra.");
    }

    return response.data;
  } catch (error) {
    console.error("Error al obtener facturas de Alegra:", error.message);
    throw new Error("No se pudieron obtener las facturas de Alegra.");
  }
}

// Función para crear un item en Monday.com
async function createItem(itemName) {
  try {
    const response = await axios.post(
      "https://api.monday.com/v2",
      {
        query: `
          mutation {
            create_item (
              board_id: ${BOARD_ID},
              item_name: "${itemName}"
            ) {
              id
            }
          }
        `,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
      }
    );

    if (
      !response.data ||
      !response.data.data ||
      !response.data.data.create_item
    ) {
      console.error("Respuesta inesperada de Monday.com:", response.data);
      throw new Error("No se pudo crear el item en Monday.com.");
    }

    console.log(
      `Item "${itemName}" creado con éxito. ID: ${response.data.data.create_item.id}`
    );
    return response.data.data.create_item.id;
  } catch (error) {
    console.error(`Error al crear el elemento: ${error.message}`);
    throw new Error("No se pudo crear el item en Monday.com.");
  }
}

// Función para asignar valor a la columna TOTAL
async function assignValueToTotalColumn(item_id, value) {
  try {
    const response = await axios.post(
      "https://api.monday.com/v2",
      {
        query: `
          mutation {
            change_column_value (
              board_id: ${BOARD_ID},
              item_id: ${item_id},
              column_id: "n_meros2",
              value: ${value}
            ) {
              id
            }
          }
        `,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
      }
    );

    if (
      !response.data ||
      !response.data.data ||
      !response.data.data.change_column_value
    ) {
      console.error("Respuesta inesperada de Monday.com:", response.data);
      throw new Error(
        "No se pudo asignar el valor a la columna TOTAL en Monday.com."
      );
    }

    console.log(
      `Valor asignado con éxito para el item ID ${item_id}: ${response.data.data.change_column_value.id}`
    );
  } catch (error) {
    console.error(`Error al asignar valores: ${error.message}`);
    throw new Error(
      "No se pudo asignar el valor a la columna TOTAL en Monday.com."
    );
  }
}

// Proceso principal
async function main() {
  try {
    // Obtener facturas de Alegra
    const invoices = await getInvoicesFromAlegra();

    // Imprimir información de facturas (depuración)
    console.log("Facturas obtenidas de Alegra:");
    for (const invoice of invoices) {
      console.log(
        `Factura N° ${invoice.numberTemplate.fullNumber}, Total: ${invoice.total}`
      );
    }

    // Crear items y asignar valores
    for (const invoice of invoices) {
      const itemName = `Factura N° ${invoice.numberTemplate.fullNumber}`; // Nombre del item es el número completo de factura
      const totalValue = invoice.total; // Valor total de la factura

      const itemId = await createItem(itemName);
      await assignValueToTotalColumn(itemId, `"${totalValue}"`);
    }
  } catch (error) {
    console.error(error.message);
  }
}

// Ejecutar el código principal
main();
