const vscode = require("vscode");
const bananaplusplusdoc = require("./b++doc");

function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0].uri.fsPath;
  } else {
    vscode.window.showWarningMessage("No hay carpetas abiertas en el workspace.");
    return null;
  }
}

async function activate(context) {
    const provider = vscode.languages.registerCompletionItemProvider('bananaplusplus', {
        provideCompletionItems(document, position) {
            vscode.window.showInformationMessage("Estamos ejecutando el script en modo silencioso para extraer el autocompletado, espere un momento");
            const code = document.getText();
            bananaplusplusdoc.SetPath(getWorkspaceRoot());
            const envi = bananaplusplusdoc.GetEnvFromCode(code);

            vscode.window.showInformationMessage("El script se termino de analizar, se mostraran a continuacion el resumen de lo extraido");

            const completions = [];

            // constantes
            for (const [key] of envi.constants.entries()) {
                let completion = new vscode.CompletionItem(key, vscode.CompletionItemKind.Constant);
                if (envi.documentations.has(key)) completion.detail = envi.documentations.get(key);
                completions.push(completion);
            }

            // variables
            for (const [key] of envi.variables.entries()) {
                let completion = new vscode.CompletionItem(key, vscode.CompletionItemKind.Variable);
                if (envi.documentations.has(key)) completion.detail = envi.documentations.get(key);
                completions.push(completion);
            }

            return completions;
        }
        });
  context.subscriptions.push(provider);
}

exports.activate = activate;