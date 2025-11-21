const vscode = require("vscode");
const bananaplusplusdoc = require("./b++doc");
const path = require("path");
const { json } = require("stream/consumers");
const { parseEmoji } = require("discord.js");

/**
 * Referencia
 * 
 * representa una referencia
 */
class Referencia {
  /**
   * la documentacion
   * @type {string}
   */
  documentation;

  /**
   * las subreferencia
   * @type {Map<string, Referencia> | undefined}
   */
  sub_referencias;

  /**
   * el tipo de referencia
   * @type {vscode.CompletionItemKind}
   */
  tipo;

  /**
   * el nombre de la referencia completa
   * @type {string}
   */
  name;

  /**
   * crea las referencias
   * @param {string} documentation la documentacion
   * @param {Map<string, Referencia> | undefined} sub_referencias las subreferencias
   * @param {vscode.CompletionItemKind} tipo el tipo
   * @param {string} name el nombre
   */
  constructor(documentation, sub_referencias, tipo, name)
  {
    this.documentation = documentation;
    this.sub_referencias = sub_referencias;
    this.tipo = tipo;
    this.name = name;
  }
}

/**
 * getWorkspaceRoot
 * 
 * otiene la primer carpeta del worcksapce
 * @returns {string | null} el worckspace
 */
function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0].uri.fsPath;
  } else {
    vscode.window.showWarningMessage("No hay carpetas abiertas en el workspace.");
    return null;
  }
}

/**
 * TipoDeContenido
 * 
 * verifica el tipo de contenido
 * @param {string} content el contenido
 * @returns {vscode.CompletionItemKind} el tipo que es
 */
function TipoDeContenido(content, name)
{
  // tipo de clases
  if (content.trim().includes("%{this}%", 0)) return vscode.CompletionItemKind.Class;
  // tipo de instacias de clases, por alguna razon no funciona y lo sigue tomando como funcion
  else if (content.trim().includes("out function " + name + ".", 0)) return vscode.CompletionItemKind.Variable;
  // el tipo de funciones
  else if (content.trim().startsWith("(") && content.trim().endsWith("}")) return vscode.CompletionItemKind.Function;

  // retornar la variable
  return vscode.CompletionItemKind.Variable;
}

/**
 * Ordenar
 * 
 * ordena las cosas del entorno
 * @param {bananaplusplusdoc.Envioriment} Entorno el entorno
 */
function Ordenar(Entorno) {
  let Trees = new Map();

  Entorno.constants.forEach((val, key) => {
    let Tread = key.split(".");
    let doc = Entorno.documentations.get(key);

    let currentMap = Trees;

    for (let i = 0; i < Tread.length; i++) {
      let part = Tread[i];

      if (!currentMap.has(part)) {
        currentMap.set(part, new Referencia(undefined, new Map(), vscode.CompletionItemKind.Constant, key));
      }

      let ref = currentMap.get(part);

      if (i === Tread.length - 1) {
        ref.documentation = doc;
      }

      currentMap = ref.sub_referencias;
    }
  });

  Entorno.variables.forEach((val, key) => {
    let Tread = key.split(".");
    let doc = Entorno.documentations.get(key);

    let currentMap = Trees;

    for (let i = 0; i < Tread.length; i++) {
      let part = Tread[i];

      if (!currentMap.has(part)) {
        currentMap.set(part, new Referencia(undefined, new Map(), TipoDeContenido(val, key), key));
      }

      let ref = currentMap.get(part);

      if (i === Tread.length - 1) {
        ref.documentation = doc;
      }

      currentMap = ref.sub_referencias;
    }
  });

  Entorno.locals.forEach((val, key) => {
    let Tread = key.split(".");
    let doc = Entorno.documentations.get(key);

    let currentMap = Trees;

    for (let i = 0; i < Tread.length; i++) {
      let part = Tread[i];

      if (!currentMap.has(part)) {
        currentMap.set(part, new Referencia(undefined, new Map(), TipoDeContenido(val, key), key));
      }

      let ref = currentMap.get(part);

      if (i === Tread.length - 1) {
        ref.documentation = doc;
      }

      currentMap = ref.sub_referencias;
    }
  });

  return Trees;
}

/**
 * ParseCodeToDocumental
 * @param {*} code el codigo
 */
function ParseCodeToDocumental(code)
{
  let params = bananaplusplusdoc.GetParamsDoc(code);

  if (params != null && code.includes('{', 0) && code.includes('}', 0)) {
    let codea = "(";

    params.forEach((element, index, array) => {
      codea += element;
        if (index != (params.length - 1))
        {
          codea += ", ";
        }
    });

    codea += ");";

    return codea;
  }
  else { return ""; }
}

/**
 * ParseDocumentation
 * 
 * parsea la documentacion
 * @param {string} doc la documentacion
 * @param {string} name el nombre
 * @param {bananaplusplusdoc.Envioriment} Env el entorno
 * @returns {Map} como el parseo
 */
function ParseDocumentation(doc, name, Env)
{
  let JsonText = "";
  let line = "";
  let docm = new Map();
  docm.set("code", 
    name + ParseCodeToDocumental(Env.variables.has(name) ? Env.variables.get(name) :(Env.constants.has(name) ? Env.constants.get(name): Env.locals.get(name)))
  );
  docm.set("documentation", "");

  for (let index = 0; index < doc.length; index++) {
    let element = doc[index];

    if (element != '\n' && element != '\r')
    {
      line += element;
    }
    else
    {
      let line_trimed = line.trim();

      if (line_trimed.startsWith("doc="))
      {
        let statment = line_trimed.substring(4, line_trimed.length);

        let parsed = JSON.parse(statment);
        let documental_code = "";
        let CodeSnippetType = parsed.type;

        switch (CodeSnippetType)
        {
          case 'function':
            let fn_params = parsed.params;

            documental_code = "function ";
            documental_code += parsed.name + "(";

            fn_params.forEach((element, index, array) => {
              documental_code += element;
              if (index != (array.length - 1))
              {
                documental_code += ", ";
              }
            });

            documental_code += ");";
            
            break;
          default:
            break;
        }

        docm.set("code", documental_code);
      }
      else
      {
          if (line_trimed != "") docm.set("documentation", docm.get("documentation") + line_trimed + "\n");
      }
      line = "";
    }
  }

  let line_trimed = line.trim();
  if (line_trimed != "") docm.set("documentation", docm.get("documentation") + line_trimed + "\n");

  return docm;
}

/**
 * activate
 * 
 * activa la extension
 * @param {*} context el contexto
 */
async function activate(context) {
  /**
  * bananaplusplus.revisarModulo
  * 
  * revisa un modulo
  */
  vscode.commands.registerCommand("bananaplusplus.revisarModulo", async (modulo) => {

    let moduloNombre = modulo;

    if (modulo == undefined) {
    moduloNombre = await vscode.window.showInputBox({
        prompt: "Nombre del módulo a revisar",
        placeHolder: "stdlib o stdlib.b++"
      });}

      if (!moduloNombre || typeof moduloNombre !== "string") {
        vscode.window.showErrorMessage("Nombre inválido.");
        return;
      }

      const workspaceFolders = vscode.workspace.workspaceFolders;
      const extensionPath = vscode.extensions.getExtension("ErickCraftStudios.banana-support")?.extensionPath;

      if (!extensionPath) {
        vscode.window.showErrorMessage("No se pudo obtener la ruta de la extensión.");
        return;
      }

      const extensionUri = vscode.Uri.file(extensionPath);
      let rutaFinal;

      if (moduloNombre.endsWith(".b++") && workspaceFolders?.length) {
        rutaFinal = vscode.Uri.joinPath(workspaceFolders[0].uri, moduloNombre);
      } else {
        rutaFinal = vscode.Uri.joinPath(extensionUri, `${moduloNombre}.b++`);
      }

      vscode.window.showInformationMessage(`Abriendo: ${rutaFinal.fsPath}`);

      try {
        const doc = await vscode.workspace.openTextDocument(rutaFinal);
        await vscode.window.showTextDocument(doc);
      } catch (err) {
        vscode.window.showErrorMessage(`No se pudo abrir el módulo: ${err.message}`);
      }
  });

  vscode.languages.registerDefinitionProvider({ language: "bananaplusplus" }, {
  provideDefinition(document, position, token) {
    const range = document.getWordRangeAtPosition(position, /"[^"]+"/);
    if (!range) return;

    const word = document.getText(range).replace(/"/g, "");
    const lineText = document.lineAt(position.line).text;

    if (!lineText.includes("import")) return;

    vscode.commands.executeCommand("bananaplusplus.revisarModulo", word);

    return null;
  }
});

  /**
  * provider
  * 
  * el provedor de autocompletado
  */
  const provider = vscode.languages.registerCompletionItemProvider('bananaplusplus', {
        // crea el provedor
        provideCompletionItems(document, position) {
            // muestra la alerta para que sean pacientes que tarda
            vscode.window.showInformationMessage("Estamos ejecutando el script en modo silencioso para extraer el autocompletado, espere un momento");
            
            // el codigo actual
            const code = document.getText();

            // selecciona la carpeta para los archivos de inclusion
            bananaplusplusdoc.SetPath(getWorkspaceRoot());

            // revisa el codigo y obtiene el entorno, si, es el mismo interprete pero en modo silencioso
            const envi = bananaplusplusdoc.GetEnvFromCode(code);

            // ya termino de revisarlo
            vscode.window.showInformationMessage("El script se termino de analizar, se mostraran a continuacion el resumen de lo extraido");
            
            // el prefix de la linea
            const linePrefix = document.lineAt(position).text.substring(0, position.character);
            
            // el ultimo token
            const lastToken = linePrefix.split(/[\s=+\-*/(),;]/).pop();

            // las partes del prefijo
            const prefixParts = lastToken.split(".");

            // ordenarlo en arbol para que sea mas comodo
            let currentMap = Ordenar(envi);

            // ir piza por una
            for (let i = 0; i < prefixParts.length - 1; i++) {
              // la parte
              const part = prefixParts[i];
              // la referencia
              const ref = currentMap.get(part);
              
              // verificar si no hay subreferencias o no hay referencia
              if (!ref || !ref.sub_referencias) return [];

              // ajusatrlo a las subreferencias
              currentMap = ref.sub_referencias;
            }

            // los items de autocompletado
            const completions = [];

            // ir a mostrar las referencias
            for (const [key, ref] of currentMap.entries()) {
              // el item de autocompletado
              const item = new vscode.CompletionItem(key, ref.tipo);

              // si hay documentacion entonces ponersela
              if (ref.documentation) { 
                let documental = ParseDocumentation(ref.documentation, ref.name, envi);
                let documentationa = "";           
                
                if (documental.has("code"))
                {
                  documentationa = "```\n" + documental.get("code") + "\n```\n";
                }
                else
                {
                  documentationa = "";
                }
                documentationa += documental.get("documentation");

                item.documentation = new vscode.MarkdownString(documentationa);
              }

              // poner el item ahi
              completions.push(item);
            }


            /*let documentation_completion = new vscode.CompletionItem("//((( )))", vscode.CompletionItemKind.Text);
            documentation_completion.detail */

            return completions;
  }});
  context.subscriptions.push(provider);
}

exports.activate = activate;