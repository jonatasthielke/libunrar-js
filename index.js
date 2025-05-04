// Tentativa de importar o módulo Emscripten
// O nome exato do módulo ou a forma de inicialização pode variar
// dependendo de como libunrar.js foi gerado pelo Emscripten.
// Pode ser necessário ajustar isso.
let Module;

// Emscripten modules often expose a global Module object
// or can be imported as a CommonJS/ES Module depending on build flags.
// Let's try a common pattern for Node.js/bundlers.
try {
  // Assuming libunrar.js was built with Module export
  Module = require('./libunrar.js');
} catch (e) {
  console.error("Failed to load libunrar.js:", e);
  // Fallback or alternative loading mechanism might be needed
  // depending on Emscripten output format.
}

// Function to replicate the worker's unrar logic
async function unrar(fileDataArray, password, progressCallback) {
  if (!Module || !Module.readRARContent) {
    throw new Error("libunrar.js module not loaded or readRARContent not available.");
  }

  // Adapt fileDataArray format if necessary to match readRARContent expected input
  const formattedFileData = fileDataArray.map(fileData => ({
    name: fileData.name,
    content: new Uint8Array(fileData.content) // Assuming content is a Buffer or ArrayBuffer
  }));

  // Call the core unrar function from libunrar.js
  const rarContent = Module.readRARContent(formattedFileData, password, progressCallback);

  // The result structure should be similar to what the worker returned
  return rarContent;
}

// Export the unrar function
module.exports = {
  unrar
};
