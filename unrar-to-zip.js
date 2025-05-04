"use strict";

// Assume rpc.js, worker.js, jszip.min.js, and download.js are loaded in the environment.

/**
 * Reads a File object as an ArrayBuffer.
 * @param {File} file The File object to read.
 * @returns {Promise<ArrayBuffer>} A Promise that resolves with the ArrayBuffer.
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

// Assume RPC is available globally from rpc.js
let rpcWorker = null;

/**
 * Gets or creates the RPC worker instance.
 * @param {object} [options] Options containing callback functions.
 * @returns {Promise<object>} A Promise that resolves with the RPC worker object.
 */
async function getRpcWorker(options = {}) {
  if (!rpcWorker) {
    // Use the provided callbacks or default to console logs
    const so = {
      loaded: options.onLoad || (() => console.log("Worker loaded")),
      progressShow: options.onProgress || ((fileName, fileSize, progress) =>
        console.log(
          `Progress: ${fileName} (${((100 * progress) / fileSize).toFixed(2)}%)`
        )),
      errShow: options.onError || ((errMsg) => console.error(`Worker error: ${errMsg}`)),
    };
    rpcWorker = await RPC.new("./worker.js", so);
  }
  return rpcWorker;
}

/**
 * Adds files extracted from RAR to a JSZip instance.
 * @param {JSZip} zip The JSZip instance.
 * @param {object} entry The entry from the unrar result.
 */
function addFilesToZip(zip, entry) {
  if (entry.type === "file") {
    zip.file(entry.fullFileName, entry.fileContent);
  } else if (entry.type === "dir") {
    Object.keys(entry.ls).forEach((k) => {
      addFilesToZip(zip, entry.ls[k]);
    });
  }
}

/**
 * Converts RAR files to a single ZIP file.
 * @param {File[]} rarFiles An array of File objects representing the RAR volumes.
 * @param {string | null} password The password for the RAR archive, or null.
 * @param {object} [options] Optional configuration.
 * @param {function(string, number, number): void} [options.onProgress] Callback for progress updates.
 * @param {function(): void} [options.onLoad] Callback when the worker is loaded.
 * @param {function(string): void} [options.onError] Callback for error messages from the worker.
 * @returns {Promise<Blob>} A Promise that resolves with the ZIP file as a Blob.
 */
async function unrarToZip(rarFiles, password = null, options = {}) {
  if (!rarFiles || rarFiles.length === 0) {
    throw new Error("No RAR files provided.");
  }

  // Sort files by name (important for multi-volume archives)
  rarFiles.sort((a, b) => {
    if (a.name > b.name) return 1;
    else if (a.name < b.name) return -1;
    else return 0;
  });

  const dataToPass = [];
  const buffers = [];

  // Read files and prepare data for the worker
  for (const file of rarFiles) {
    const buffer = await readFileAsArrayBuffer(file);
    buffers.push(buffer);
    dataToPass.push({ name: file.name, content: buffer });
  }

  const rpc = await getRpcWorker();

  // Transfer buffers to the worker for processing
  rpc.transferables = buffers;

  // Call the unrar function in the worker
  const ret = await rpc.unrar(dataToPass, password);

  // Create a new JSZip instance (Assume JSZip is available globally)
  const zip = new JSZip();

  // Add extracted files to the zip
  if (ret && ret.ls) {
    Object.keys(ret.ls).forEach((k) => {
      addFilesToZip(zip, ret.ls[k]);
    });
  } else {
    throw new Error("Unrar operation failed or returned unexpected format.");
  }

  // Generate the ZIP file as a Blob
  // Generate the ZIP file as a Blob
  // Using synchronous generate for JSZip v2.x
  const content = zip.generate({ type: "blob" });

  return content;
}

// Export the main function
export { unrarToZip };
