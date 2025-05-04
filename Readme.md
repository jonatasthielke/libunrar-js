libunrar.js
===========

Emscripten port of RARLab's open-source unrar library

# How to use
1. Visit http://wcchoi.github.io/libunrar-js/
2. Drag the RAR file to the box or select from the file chooser then click **Unrar**.
3. For multi-part RAR, drag/select ALL the parts (part1.rar to partN.rar).
4. If you get a password error, fill in the password then click **Unrar**.
5. Wait for the decompression to complete and click on the file name to download the decompressed content.

# Caveat
1. Everything is loaded to the memory so make sure you have enough free memory to hold BOTH the RAR file AND the decompressed content (although only the decompressed content will keep in memory after decompression) , otherwise your browser page may crash.
2. Slow, especially for password-protected RAR
3. Memory leak in IE, no problem in Chrome

# WHY?
If you are in node.js environment then this is probably useless for you because you can call the native unrar utility/library. I made this for using on my Chromebook because ChromeOS does not yet support extracting password-protected RAR archive or multi-part RAR archives(.part1.rar - .partN.rar files) in the file manager, and using crouton/android apk for that task is an overkill.

Tested on latest version of Chrome(chromebook, PC, android), though it also somehow works in IE11(desktop). Not tested on other browsers.

# How to use the code
Load libunrar.js in a web-worker and call *readRARContent* function, read the source code for parameter/return value. Also read worker.js, index.html for usage example.

# How to use with npm

## Installation

```bash
npm install libunrar-js-npm
```

## Usage

```javascript
const { unrar } = require('libunrar-js-npm');
const fs = require('fs');

// Assuming you have your RAR file data as a Buffer or Uint8Array
// For multi-part RARs, provide an array of objects
// Example for a single file:
async function extractSingleFile(rarFilePath, password) {
  try {
    const fileData = fs.readFileSync(rarFilePath);
    const rarContent = await unrar([{ name: 'archive.rar', content: fileData }], password);

    // rarContent will be an object representing the structure of the RAR archive
    // You can traverse it to find the files you want to extract.
    // For example, to get the content of a file named 'my_file.txt':
    // const myFileEntry = rarContent.ls['my_file.txt'];
    // if (myFileEntry && myFileEntry.type === 'file') {
    //   console.log('File content:', myFileEntry.fileContent.toString()); // Assuming text content
    // }

    console.log('Extraction complete:', rarContent);
    return rarContent;

  } catch (error) {
    console.error('Error extracting RAR:', error);
    throw error;
  }
}

// Example usage:
// extractSingleFile('./path/to/your/archive.rar', 'your_password');

// Example for multi-part files:
/*
async function extractMultiPart(rarFilePaths, password) {
  try {
    const fileDataArray = rarFilePaths.map(filePath => ({
      name: filePath.split('/').pop(), // Get filename from path
      content: fs.readFileSync(filePath)
    }));

    const rarContent = await unrar(fileDataArray, password);
    console.log('Extraction complete:', rarContent);
    return rarContent;

  } catch (error) {
    console.error('Error extracting multi-part RAR:', error);
    throw error;
  }
}
*/

// Example usage for multi-part:
// extractMultiPart(['./path/to/part1.rar', './path/to/part2.rar'], 'your_password');


// You can also provide a progress callback (optional)
/*
async function extractWithProgress(rarFilePath, password) {
  try {
    const fileData = fs.readFileSync(rarFilePath);
    const progressCallback = (extractedBytes, totalBytes) => {
      const percentage = (extractedBytes / totalBytes) * 100;
      console.log(`Progress: ${percentage.toFixed(2)}%`);
    };

    const rarContent = await unrar([{ name: 'archive.rar', content: fileData }], password, progressCallback);
    console.log('Extraction complete:', rarContent);
    return rarContent;

  } catch (error) {
    console.error('Error extracting RAR:', error);
    throw error;
  }
}
*/

// Example usage with progress:
// extractWithProgress('./path/to/your/archive.rar', 'your_password');


# Licence
MIT, also see license.txt for the C code's license

# Acknowledgement
Alexander L. Roshal from RARLab for the C/C++ Code

[seikichi/unrar.js](https://github.com/seikichi/unrar.js) - which does not support RAR5 format - for the index.html code

# Como usar a biblioteca unrar-to-zip.js

Esta biblioteca permite converter arquivos RAR para ZIP diretamente no navegador.

**1. Arquivos Necessários:**

Para usar a biblioteca, você precisará dos seguintes arquivos no mesmo diretório ou em caminhos acessíveis pelo seu servidor web:

*   `unrar-to-zip.js` (a biblioteca que criamos)
*   `rpc.js` (para comunicação com o worker)
*   `worker.js` (o web worker que contém a lógica de descompressão RAR)
*   `libunrar.js` e `libunrar.js.mem` (o código da biblioteca unrar compilado para WebAssembly/JavaScript)
*   `jszip.min.js` (a biblioteca JSZip para criar o arquivo ZIP)
*   `download.js` (uma função auxiliar para iniciar downloads no navegador)
*   `Promise.min.js` (um polyfill para Promises, se necessário para navegadores mais antigos)

**2. Incluindo os Arquivos no seu HTML:**

Inclua os arquivos necessários na seção `<head>` ou antes do fechamento da tag `</body>` do seu arquivo HTML. É importante manter a ordem de inclusão das dependências antes da sua biblioteca e do script que a utiliza. Note o uso de `type="module"` para o script que importa a biblioteca.

```html
<!DOCTYPE html>
<html>
<head>
    <title>Exemplo de Uso Unrar to Zip</title>
</head>
<body>

    <h1>Converter RAR para ZIP</h1>

    <input type="file" id="rarFile" multiple>
    <br><br>
    Password: <input type="password" id="password">
    <br><br>
    <button id="convertBtn">Converter para ZIP</button>

    <div id="status"></div>
    <div id="downloadLink"></div>

    <!-- Dependências -->
    <script src="Promise.min.js"></script> <!-- Opcional, para compatibilidade -->
    <script src="download.js"></script>
    <script src="jszip.min.js"></script>
    <script src="rpc.js"></script>
    <script src="libunrar.js"></script>
    <script src="libunrar.js.mem"></script>
    <script src="worker.js"></script>

    <!-- Sua biblioteca e script de uso -->
    <script type="module" src="unrar-to-zip.js"></script>
    <script type="module">
        import { unrarToZip } from './unrar-to-zip.js';

        const fileInput = document.getElementById('rarFile');
        const passwordInput = document.getElementById('password');
        const convertBtn = document.getElementById('convertBtn');
        const statusDiv = document.getElementById('status');
        const downloadLinkDiv = document.getElementById('downloadLink');

        convertBtn.addEventListener('click', async () => {
            const files = fileInput.files;
            const password = passwordInput.value;

            if (files.length === 0) {
                statusDiv.innerHTML = 'Por favor, selecione um arquivo RAR.';
                return;
            }

            statusDiv.innerHTML = 'Iniciando conversão...';
            downloadLinkDiv.innerHTML = ''; // Limpa link anterior

            const options = {
                onLoad: () => {
                    statusDiv.innerHTML = "Worker carregado.";
                },
                onProgress: (fileName, fileSize, progress) => {
                    statusDiv.innerHTML = `Processando ${fileName}: ${((100 * progress) / fileSize).toFixed(2)}%`;
                },
                onError: (errMsg) => {
                    statusDiv.innerHTML = `Erro do Worker: ${errMsg}`;
                }
            };

            try {
                // Chama a função da biblioteca
                const zipBlob = await unrarToZip(Array.from(files), password, options);

                // Cria um link para download do arquivo ZIP gerado
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'converted.zip';
                a.textContent = 'Download ZIP';
                downloadLinkDiv.appendChild(a);

                statusDiv.innerHTML = 'Conversão concluída!';

            } catch (error) {
                statusDiv.innerHTML = `Erro na conversão: ${error.message}`;
                console.error(error);
            }
        });
    </script>

</body>
</html>
```

**3. Usando a Função `unrarToZip`:**

A função principal exportada pela biblioteca é `unrarToZip`. Ela é uma função assíncrona que retorna uma Promise.

```javascript
import { unrarToZip } from './unrar-to-zip.js';

// ... (obtenha os arquivos RAR e a senha, por exemplo, de um input file)

const rarFiles = fileInput.files; // FileList de um input type="file"
const password = passwordInput.value; // String da senha ou null

// Opcional: callbacks para status
const options = {
    onLoad: () => { console.log("Worker carregado"); },
    onProgress: (fileName, fileSize, progress) => { console.log(`Progresso: ${fileName} (${((100 * progress) / fileSize).toFixed(2)}%)`); },
    onError: (errMsg) => { console.error(`Erro: ${errMsg}`); }
};

try {
    const zipBlob = await unrarToZip(Array.from(rarFiles), password, options);

    // zipBlob é um Blob que representa o arquivo ZIP gerado.
    // Você pode usá-lo para criar um link de download, por exemplo.
    const url = URL.createObjectURL(zipBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'output.zip';
    downloadLink.textContent = 'Download ZIP';
    document.body.appendChild(downloadLink); // Adiciona o link à página

} catch (error) {
    console.error("Ocorreu um erro durante a conversão:", error);
}
```

**Explicação dos Parâmetros de `unrarToZip`:**

*   `rarFiles`: Um array de objetos `File`. Se for um arquivo RAR de volume único, será um array com um único `File`. Se for um arquivo RAR multi-volume, inclua todos os arquivos de volume (`.part1.rar`, `.part2.rar`, etc.) neste array.
*   `password`: Uma string contendo a senha do arquivo RAR, ou `null` se não houver senha.
*   `options` (opcional): Um objeto com funções de callback para receber atualizações de status:
    *   `onLoad`: Chamado quando o web worker da biblioteca é carregado.
    *   `onProgress`: Chamado periodicamente durante a descompressão, fornecendo o nome do arquivo atual, tamanho total e progresso.
    *   `onError`: Chamado se ocorrer um erro no web worker.

**4. Servindo os Arquivos:**

Lembre-se de que, ao usar módulos JavaScript (`type="module"`), você precisa servir seus arquivos através de um servidor web (como o servidor HTTP simples do Python que usamos anteriormente) para evitar erros de CORS. Abrir o arquivo HTML diretamente no navegador (`file:///...`) não funcionará.
