/**
 * Banana++
 * 
 * un lenguaje de programacion rapido y portable
 */

//
// rincon de inclusion
//

const fs = require("fs");
const readline = require('readline');
const path = require('path');
const { env } = require("process");

var actual_path = "";

/**
 * Envioriment
 * 
 * representa el entorno de ejecucion
 */
class Envioriment {
    /** 
     * variables y funciones persistentes
     * @type {Map<string,string>}
     */
    variables;

    /** 
     * variables y funciones locales
     * @type {Map<string,string>}
     */
    locals;

    /**
     * variables de lectura namas
     * @type {Map<string, string>}
     */
    constants;

    /**
     * valor de retorno
     *  @type {string}
     */
    retval;

    /**
     * la documentacion de las cosas
     * @type {Map<string, string>}
     */
    documentations;

    /**
     * retorna un valor
     * @param {string} r el retorno
     */
    return(r) {this.retval = r; }

    /**
     * el constructor
     * @param {Map<string, string>} vars las variables
     *  @param {Map<string, string>} locals las locales
     */
    constructor()
    {
        this.variables = new Map();
        this.locals = new Map();
        this.constants = new Map();
        this.documentations = new Map();
        this.retval = "";
    }
}

/**
 * readl
 * 
 * lee la linea
 * @param {string} ask la pregunta
 * @returns la respuesta
 */
function readl(ask) {
  return new Promise((resolve) => {
    rl.question(ask, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * EcodeJsStr
 * 
 * codifica un string para js
 * @param {string} str 
 */
function EcodeJsStr(str) {
    let stra = "";

    for (let index = 0; index < str.length; index++) {
        const element = str[index];

        switch (element) {
            case '\\': stra += "\\\\"; break;
            case '\n': stra += "\\n"; break;
            case '\r': stra += "\\r"; break;
            case '\t': stra += "\\t"; break;
            case '\b': stra += "\\b"; break;
            case '\f': stra += "\\f"; break;
            case '\v': stra += "\\v"; break;
            case '\"': stra += "\\\""; break;
            case '\'': stra += "\\\'"; break;
            case '\0': stra += "\\0"; break;
            default:
                const code = element.charCodeAt(0);
                if (code < 32 || code > 126) {
                    stra += "\\u" + code.toString(16).padStart(4, '0');
                } else {
                    stra += element;
                }
        }
    }

    return "\"" + stra + "\"";
}

/**
 * StringScape
 * 
 * codigos de escape en Banana++
 * @param {string} str el string
 * @returns el string escapado
 */
function StringScape(str)
{
    let stra = "";

    for (let index = 0; index < str.length; index++) {
        let element = str[index];
        
        if (element == "\\")
        {
            element = str[index + 1]
            index++;

            if (element == "n") stra += "\n";
            else if (element == "c") stra += "\"";
            else if (element == "r") stra += "\r";
            else if (element == "y") stra += ":"
            else if (element == "\\") stra += "\\";
            else if (element == "1") stra += "(";
            else if (element == "2") stra += ")";
            else if (element == "3") stra += "{";
            else if (element == "4") stra += "}";
            else if (element == "l") stra += ";";
            else if (element == "s") stra += ",";
            else if (element == "k") stra += "\x1b[";
            else return stra;
        }
        else
        {
            stra += element;
        }
    }

    return stra;
}

/**
 * SyntaxSolve
 * 
 * soluciona la sintaxis
 * @param {string} Syntax la sintaxis
 * @param {Envioriment} Env el entorno
 * @returns {string} la sintaxis resuelta
 */
function SyntaxSolve(Syntax, Env)
{
    // x
    if (Env.locals.has(Syntax)) return Env.locals.get(Syntax);
    
    // x
    else if (Env.variables.has(Syntax)) return Env.variables.get(Syntax);
        
    // x
    else if (Env.constants.has(Syntax)) return Env.constants.get(Syntax);
    
    // 'x' y "x"
    else if ((Syntax.startsWith("\"") && Syntax.endsWith("\""))) return StringScape(Syntax.substring(1, Syntax.length - 1));

    // Syntax["x"]
    else if (Syntax.startsWith("Syntax[\"") && Syntax.endsWith("\"]")) return SyntaxSolve(Syntax.substring(8, Syntax.length - 2), Env);

    // EnvContains[x]
    else if (Syntax.startsWith("EnvContains[") && Syntax.endsWith("]")) {
        let variable = SyntaxSolve(Syntax.substring(12, Syntax.length - 1), Env);

        let result = "false";

        Env.variables.forEach((v, k, m) => {if (k == variable) result = "true";});
        Env.constants.forEach((v, k, m) => {if (k == variable) result = "true";});
        Env.locals.forEach((v, k, m) => {if (k == variable) result = "true";});

        return result;
    }

    // ScapeJsStr[x]
    else if (Syntax.startsWith("ScapeJsStr[") && Syntax.endsWith("]")) return EcodeJsStr(SyntaxSolve(Syntax.substring(11, Syntax.length - 1), Env));

    // VarSyntax[x]
    else if (Syntax.startsWith("VarSyntax[") && Syntax.endsWith("]")) return VarSyntax(Syntax.substring(10, Syntax.length - 1), Env);

    // Syntax[x]
    else if (Syntax.startsWith("Syntax[") && Syntax.endsWith("]")) return SyntaxSolve(Syntax.substring(7, Syntax.length - 1), Env);

    // DSyntax[x]
    else if (Syntax.startsWith("DSyntax[") && Syntax.endsWith("]")) return SyntaxSolve(SyntaxSolve(Syntax.substring(8, Syntax.length - 1), Env), Env);

    // Sys.len[x]
    else if (Syntax.startsWith("Sys.len[") && Syntax.endsWith("]")) return String(SyntaxSolve(Syntax.substring(8, Syntax.length - 1), Env).length); 

    // x==y
    else if (Syntax.split("==").length == 2) 
    { 
        return String(SyntaxSolve(Syntax.split("==")[0], Env) == SyntaxSolve(Syntax.split("==")[1], Env))
    }
    // x!=y
    else if (Syntax.split("!=").length == 2) 
    { 
        return String(SyntaxSolve(Syntax.split("!=")[0], Env) != SyntaxSolve(Syntax.split("!=")[1], Env))
    }
    // x<y
    else if (Syntax.split("<").length == 2) 
    { 
        return String(Number(SyntaxSolve(Syntax.split("<")[0], Env)) < Number(SyntaxSolve(Syntax.split("<")[1], Env)))
    }
    // x>y
    else if (Syntax.split(">").length == 2) 
    { 
        return String(Number(SyntaxSolve(Syntax.split(">")[0], Env)) > Number(SyntaxSolve(Syntax.split(">")[1], Env)))
    }
    // JavaScript[x]
    else if (Syntax.startsWith("JavaScript[") && Syntax.endsWith("]"))
    {
        let code = SyntaxSolve(Syntax.substring(11, Syntax.length - 1), Env);
        let result = eval(code);
        return String(result == undefined ? "undefined" : result);
    }
    // Sys.Read[]
    else if (Syntax.startsWith("Sys.Read[") && Syntax.endsWith("]")) { 
        let ask = SyntaxSolve(Syntax.substring(9, Syntax.length - 1));
        let completed = false;
        let answare = "";
        
        rl.question(ask, (respuesta) => {
            answare = respuesta;
            completed = true;
        });

        while (completed == false) {
            for (let index = 0; index < 1000; index++) {
            }
        };

        return answare;
    }

    // milisegudos
    else if (Syntax == "Sys.Time.Milliseconds") return String(new Date().getMilliseconds());
    // segundos
    else if (Syntax == "Sys.Time.Seconds") return String(new Date().getSeconds());
    // minutos
    else if (Syntax == "Sys.Time.Minutes") return String(new Date().getMinutes());
    // hora
    else if (Syntax == "Sys.Time.Hour") return String(new Date().getHours());
    // dia
    else if (Syntax == "Sys.Time.Day") return String(new Date().getDay());
    // mes
    else if (Syntax == "Sys.Time.Month") return String(new Date().getMonth());
    // año
    else if (Syntax == "Sys.Time.Year") return String(new Date().getFullYear());

    return Syntax;
}

/**
 * NormalizePath
 * 
 * normaliza la carpeta
 * @param {string} directory el directorio
 * @returns {string} normalizado
 */
function NormalizePath(directory)
{
    return directory.replaceAll("/", path.sep);
}

/**
 * IsOperator
 * 
 * revisa si un caracter es uno de operacion
 * @param {*} char el operador
 * @returns si es uno
 */
function IsOperator(char)
{
    return char == '$' || char == '^' || char == '*' || char == '+' || char == '-' || char == '/' || char == '%' || char == '√';
}

/**
 * VarSyntax
 * 
 * soluciona el nombre de variable
 * @param {string} VarName el nombre
 * @param {Envioriment} Env el entorno
 * @returns {string} el nombre devuelto
 */
function VarSyntax(VarName, Env)
{
    let retval = VarName;
    Env.variables.forEach((val, key, map) => {
        retval = retval.replaceAll(`@get[${key}]`, val);
    });

    Env.locals.forEach((val, key, map) => {
        retval = retval.replaceAll(`@get[${key}]`, val);
    })

    return retval;
}

/**
 * IsWhileSpace
 * 
 * ve si es un espacion en blanco
 * @param {*} str el string
 * @returns {boolean} si es o no
 */
function IsWhileSpace(str)
{
    if (str == ' ' || str == '\t' || str == '\n' || str == '\r') return true;
    return false;
}

/**
 * GetParams
 * 
 * obtiene los parametros
 * @param {string} func el cuerpo
 * @returns {string[]} los parametros
 */
function GetParams(func)
{
    if ((func.includes('(', 0) && func.includes(')', 0)) == false) return new Array();

    let pars = "";

    for (let index = 1; index < func.length; index++) {
        const element = func[index];
        
        if (element == ')') break;
        else pars += element;
    }

    let psm = pars.split(",");
    let nm = [];

    psm.forEach(element => {
        let el = element.trim()

        if (el.split(":").length == 2) el = el.split(":")[0];

        nm.push(el);
    });

    return nm;
}

/**
 * GetParamsDoc
 * 
 * obtiene los parametros para documentacion
 * @param {string} func el cuerpo
 * @returns {string[]} los parametros
 */
function GetParamsDoc(func)
{
    if ((func.includes('(', 0) && func.includes(')', 0)) == false) return new Array();

    let pars = "";

    for (let index = 1; index < func.length; index++) {
        const element = func[index];
        
        if (element == ')') break;
        else pars += element;
    }

    let psm = pars.split(",");
    let nm = [];

    if (pars.trim() == "") return nm;

    psm.forEach(element => {
        let el = element.trim()

        if (el.split(":").length != 2) el += ":any";

        nm.push(el);
    });

    return nm;
}
/**
 * IsAValidCharForWord
 * 
 * si es un caracter valido para una palabra
 * @param {string} element el caracter
 * @returns si es
 */
function IsAValidCharForWord(element)
{
    return (IsWhileSpace(element) == false && element != '&' && element != '|' && element != '+' && element != '$' && element != '-' && element != '=' && element != '/' && element != '*' && element != '(' && element != ')' && element != '{' && element != '}' && element != ':' && element != ';');
}

/**
 * ExCode
 * 
 * ejecuta un codigo
 * @param {string} Code el codigo
 * @param {Envioriment} Env el entorno
 * @returns {Envioriment} el entorno despues
 */
function ExCode(Code, Env)
{
    // declarar parametros del interpete
    let Word = "";
    // variables que eliminara cuando el local termine
    let VarsThatDeletes = [];
    // constantes que eliminara cuando el scope termine
    let ConstsThatDeletes = [];
    // modo silencioso en documentacion
    let OnlyDocumentationQuiet = (Env.variables.has("quiet_mode") ? Boolean(Env.variables.get("quiet_mode")) : false)
    // para el modo documentacion
    let LastDocumentationCommentContent = "";

    //
    // parametros de instrucciones
    //
    let SysDotMkDir = false;
    let DeleteVar = false;
    let EnvNew = Env;
    let PutInOut = false;
    let OnFunction = false;
    let GoToReturn = false;
    let GoToAsign = false;
    let GoToAsignOp = false;
    let SysWarnStatment = false;
    let SysDotOutStatment = false;
    let SysDotFreadStatment = false;
    let SysDotFwrite = false;
    let SysDotFexist = false;
    let Operator = "";
    let line = "";
    let AsignTo = "";
    let InString = false;
    let IsInFor = false;
    let SysGetChar = false;
    let InIfDef = false;
    let IfCondition = "";
    let importfile = false;
    let filestoimport = [];
    let requirethings = false;
    let thingstorequire = [];
    let DeclareAsConst = false;
    let UnableActions = false;
    let StrictMode = false;

    EnvNew.locals = Env.locals;
    EnvNew.variables = Env.variables;
    EnvNew.constants = Env.constants;

    for (let Recorrer = 0; Recorrer < Code.length; Recorrer++) {
        // el caracter actual
        const element = Code[Recorrer];
        // añadir a la linea
        line += element;
        // si esta en string y hay un scape ponerlo
        if (element == "\\" && InString)
        {
            // si es una comilla
            if (Code[Recorrer + 1] == "\"") { Word += "\""; Recorrer++;continue; }
        }
        // si se cierran comillas
        if (element == "\"") InString = !InString;
        // condicion de if
        if (InIfDef == true) IfCondition += element;

        // mas para la palabra
        if (InString == false ? (IsWhileSpace(element) == false && element != '&' && element != '|' && element != '+' && element != '$' && element != '-' && element != '=' && element != '/' && element != '*' && element != '(' && element != ')' && element != '{' && element != '}' && element != ':' && element != ';') : true) Word += element;
        // ejecutar lo dicho
        else
        {
            //console.log(Word)
            line = line.trimStart()

            // terminar linea
            if (Code[Recorrer] == ';')
            {
                // si se va a asignar algo
                if (GoToAsign == true)
                {
                    // añadir la documentacion
                    if (OnlyDocumentationQuiet) EnvNew.documentations.set(VarSyntax(AsignTo, EnvNew), LastDocumentationCommentContent);
                    if (DeclareAsConst == true)
                    {
                        // declarar una constante ya esta
                        DeclareAsConst = false;
                        // no se puede redefinir
                        if (EnvNew.constants.has(VarSyntax(AsignTo,EnvNew))) return EnvNew;
                        // incluirla en las que eliminara
                        ConstsThatDeletes.push(AsignTo);
                        // asignarla
                        EnvNew.constants.set(VarSyntax(AsignTo,EnvNew), SyntaxSolve(Word,EnvNew));
                    }
                    else {
                        // si lo va a guardar en el global
                        if (PutInOut == false) { if (EnvNew.locals.has(AsignTo) == false) { VarsThatDeletes.push(AsignTo); } }
                        // va a asignarlo
                        GoToAsign = false;
                        // en todo el codigo global
                        if (PutInOut == true) EnvNew.variables.set(VarSyntax(AsignTo,EnvNew), SyntaxSolve(Word,EnvNew));
                        // solo en este stack
                        else EnvNew.locals.set(VarSyntax(AsignTo,EnvNew), SyntaxSolve(Word,EnvNew));
                    }
                }
                // modo estricto
                else if (Word == "\"use strict\"") StrictMode = true;
                // operadores 
                else if (GoToAsignOp == true)
                {
                    // va a asignarlo
                    GoToAsignOp = false;
                    // si el operador no es para juntar
                    if (Operator != '$')
                    {
                        // convertirlo a numero
                        let val = Number(SyntaxSolve(VarSyntax(AsignTo, EnvNew), EnvNew));
                        // operadores
                        switch (Operator)
                        {
                            // raiz cuadrada
                            case "√": val = Math.sqrt(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew)); break;
                            // potencia
                            case "^": val = Math.exp(Number(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew))); break;
                            // suma
                            case '+': val += Number(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew)); break;
                            // resta
                            case '-': val -= Number(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew)); break;
                            // multiplicacion
                            case '*': val *= Number(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew)); break;
                            // division
                            case '/': val /= Number(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew)); break;
                            // modulo
                            case '%': val %= Number(SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew)); break;
                            // si no es valido el operador
                            default: break;
                        }
                        // en todo el codigo global
                        if (PutInOut == true) EnvNew.variables.set(VarSyntax(AsignTo,EnvNew), String(val));
                        // solo en este stack
                        else EnvNew.locals.set(VarSyntax(AsignTo, EnvNew), String(val));
                    }
                    else {
                        // va a juntarlo
                        let val = SyntaxSolve(VarSyntax(AsignTo, EnvNew), EnvNew) + SyntaxSolve(VarSyntax(Word, EnvNew), EnvNew);
                        // en todo el codigo global
                        if (PutInOut == true) EnvNew.variables.set(VarSyntax(AsignTo,EnvNew), val);
                        // solo en este stack
                        else EnvNew.locals.set(VarSyntax(AsignTo, EnvNew), val);
                    }
                }
                // requerir cosas
                else if (requirethings == true)
                {
                    // terminar el requerimiento
                    requirethings = false; thingstorequire.push(Word);
                    // ir a los elementos
                    for (const elemental of thingstorequire) {
                        // si no contiene el simbolo
                        if (!(EnvNew.locals.has(elemental) || EnvNew.variables.has(elemental) || EnvNew.constants.has(elemental))) return EnvNew;
                    }
                    // eliminar los requerimientos
                    thingstorequire = [];
                }
                // importar archivos
                else if (importfile == true)
                {
                    // terminar la importacion
                    importfile = false; filestoimport.push(Word);

                    // ir importando los archivos
                    filestoimport.forEach(elemental => {
                        // si es un modulo en la carpeta nromal
                        if ((SyntaxSolve(elemental, EnvNew)).endsWith(".b++")) {
                            // si existe
                            if (OnlyDocumentationQuiet == false ) if (fs.existsSync(NormalizePath(SyntaxSolve(elemental, EnvNew)))) { let file_content = fs.readFileSync(NormalizePath(SyntaxSolve(elemental, EnvNew)) , 'utf-8'); EnvNew = ExCode(file_content, EnvNew); }
                            // si es en documentacion
                            else { if (fs.existsSync(path.join(actual_path, NormalizePath(SyntaxSolve(elemental, EnvNew))))) { let file_content = fs.readFileSync(path.join(actual_path, NormalizePath(SyntaxSolve(elemental, EnvNew))) , 'utf-8'); EnvNew = ExCode(file_content, EnvNew); } }
                        }
                        else {
                            // en no documentacion
                            if (OnlyDocumentationQuiet == false) {
                                // el archivo
                                elfile = path.join(__dirname, NormalizePath(SyntaxSolve(elemental, EnvNew)) + ".b++");
                                // si existe
                                if (fs.existsSync(NormalizePath(elfile))) { let file_content = fs.readFileSync(NormalizePath(elfile) , 'utf-8'); EnvNew = ExCode(file_content, EnvNew); }
                            }
                            // en documentacion
                            else
                            {
                                // el archivo
                                elfile = path.join(__dirname, SyntaxSolve(elemental, EnvNew) + ".b++");
                                // verificar si existe
                                if (fs.existsSync(NormalizePath(elfile))) { let file_content = fs.readFileSync(NormalizePath(elfile) , 'utf-8'); EnvNew = ExCode(file_content, EnvNew);}
                            }
                        }
                    });
                    // limpiar las importaciones
                    filestoimport = [];
                }
                // llamar funciones
                else if (line.endsWith(");"))
                {
                    // la funcion
                    let func = ""; let fmt = 0;

                    for (let ind = 0; ind < line.length; ind++) {
                        // la letra
                        const element = line[ind];
                        // si termina ahi
                        if (element == "(") { func = func.trim(); fmt = ind; break; }
                        // si no pues, el nombre de la funcion sigue
                        else func += element;
                    }
                    // si esta en ...
                    let OnDotDotDot = false;
                    // el parametro actual de DotDotDot
                    let DotDotDotNumParam = 0;
                    // la sintaxis
                    let fn = SyntaxSolve(func, EnvNew).trim();
                    // los parametros de la funcion
                    let params = StrictMode == true ? GetParamsStrict(fn) : GetParams(fn);
                    // los parametros puestos
                    let psm = GetParams(line.substring(fmt, (line.length) - 1));
                    // ir parametro por parametro y remplazarlos
                    let type_violation = false;
                    // ir parseando los parametros
                    psm.forEach((elemental, index, array) => {
                        // si es modo estricto y esta en el ...
                        if ((StrictMode == true ? params[index].split(":")[0] : params[index]) == "...")
                        {
                            // activar modo ...
                            OnDotDotDot = true;
                            // ajustar el item
                            EnvNew.variables.set("Lang.DotDotDot[" + String(DotDotDotNumParam) + "]", SyntaxSolve(elemental, EnvNew));
                            // sumar longitud
                            DotDotDotNumParam++; EnvNew.variables.set("#Lang.DotDotDot", String(DotDotDotNumParam));
                        }  
                        // si esta en el ...
                        else if (OnDotDotDot)
                        {
                            // ajustar el item
                            EnvNew.variables.set("Lang.DotDotDot[" + String(DotDotDotNumParam) + "]", SyntaxSolve(elemental, EnvNew));
                            // sumar la longitud
                            DotDotDotNumParam++; EnvNew.variables.set("#Lang.DotDotDot", String(DotDotDotNumParam));
                        }
                        else { 
                            // si esta en modo estricto
                            if (StrictMode == true && params[index].split(":").length == 2)
                            {
                                // parsear el tipo
                                let type = new RegExp(SyntaxSolve( params[index].split(":")[1], EnvNew ));
                                // testearlo
                                if (type.test(SyntaxSolve(elemental, EnvNew))) fn = fn.replaceAll(`%{${params[index].split(":")[0]}}%`, elemental);
                               // los tipos no coinciden
                                else { console.error("los tipos no coinciden"); type_violation = true }
                            }
                            // renplazar el parametro por el indice
                            else fn = fn.replaceAll(`%{${params[index]}}%`, elemental);
                        }
                    })
                    // si los tipos se infringieron detener el programa
                    if (type_violation) return EnvNew;
                    // eliminar los parametros
                    fn = fn.substring(fn.split("{")[0].length).trim();
                    // eliminar las llaves
                    fn = fn.substring(1, fn.length - 2).trim();
                    // ejecutar el codigo
                    EnvNew = ExCode(fn + "\n//.", EnvNew);
                    // cambiar la longitud
                    EnvNew.variables.set("#Lang.DotDotDot", "0");
                }
                // vaciar la linea
                line = "";
            }
            // comentarios
            else if (Code[Recorrer] == '/' && Code[Recorrer + 1] == '/')
            {
                // limpiar documentacion
                LastDocumentationCommentContent = "";
                // el comentario
                let comment = "";
                // limpiar la linea y irse despues de los comentarios
                line = ""; Recorrer += 2;
                // si es uno de varias lineas
                if ( Code[Recorrer] == '(' && Code[Recorrer + 1] == '(' && Code[Recorrer + 2] == '('
                )
                {
                    // recorrerlo
                    Recorrer += 3;
                    // esperar a encontrar un cierre
                    while (Recorrer < Code.length)
                    {
                        // el si se ha completado
                        if (Code[Recorrer] == ')' && Code[Recorrer + 1] == ')' && Code[Recorrer + 2] == ')') { Recorrer += 2; break; }
                        // añadir el caracter al comentario
                        else comment += Code[Recorrer];
                        // recorrerlo
                        Recorrer++;
                    }
                    // la documentacion
                    LastDocumentationCommentContent = comment;
                }
                // si no esperar a un salto de linea
                else while (Recorrer < Code.length && Code[Recorrer] != '\n') Recorrer++;
            }
            // abrir un if
            else if (Word == "if") InIfDef = true;
            // elimina variables globales
            else if (Word == "delete") DeleteVar = true;
            // import
            else if (Word == "import") importfile = true;
            // require
            else if (Word == "require") {requirethings = true;}
            // then
            else if (Word == "then" && InIfDef == true)
            {
                // la condicion
                InIfDef = false; IfCondition = IfCondition.replaceAll("then", "").trim()
                // resolverla
                IfCondition = SyntaxSolve(IfCondition, EnvNew);
                // el numero de scope
                let Treads = 0;
                // cuerpo de la funcion
                let FunctionBody = "";
                // se ha abierto el principal
                let havem = false;
                // recorrerlo
                while ((havem == true ? (Treads != 0) : true) && Recorrer < Code.length) {
                    // unir el cuerpo
                    FunctionBody += Code[Recorrer];
                    // si se ha abierto activarlo y ir al siguiente arbol
                    if (Code[Recorrer] == '{') { Treads++; havem = true;}
                    // cerrar el scope
                    else if (Code[Recorrer] == '}') Treads--;
                    // siguiente caracter
                    Recorrer++;
                }
                // vaciar la linea
                line = ""; 
                // el cuerpo
                let BodyCode = FunctionBody.trim().substring(1, FunctionBody.trim().length - 1);
                // si la condicion es verdadera ejecutar el cuerpo
                let IfTrueCode = BodyCode;
                // declarar la falsa
                let IfFalseCode = "";
                // esperar a cualquier no espacio
                while (Recorrer < Code.length && IsWhileSpace(Code[Recorrer])) Code[Recorrer++];
                // si encontro un else
                if (Recorrer + 4 < Code.length && Code[Recorrer] === 'e' && Code[Recorrer + 1] === 'l' && Code[Recorrer + 2] === 's' && Code[Recorrer + 3] === 'e' && !IsAValidCharForWord(Code[Recorrer + 4])) {
                    // recorer el tamaño de else
                    Recorrer += 4;
                    // esperar a un cuerpo
                    while (Recorrer < Code.length && IsWhileSpace(Code[Recorrer])) Code[Recorrer++];
                    // si hay un cuerpo ponerlo
                    if (Code[Recorrer] == '{')
                    {
                        // arboles
                        Treads = 0;
                        // cuerpo
                        FunctionBody = "";
                        // ha estado en uno
                        havem = false;
                        // recorrerlo
                        while ((havem == true ? (Treads != 0) : true) && Recorrer < Code.length) {
                            // unir el cuerpo de la funcion
                            FunctionBody += Code[Recorrer];
                            // si se ha abierto
                            if (Code[Recorrer] == '{') { Treads++; havem = true;}
                            // si se ha cerrado
                            else if (Code[Recorrer] == '}') Treads--;
                            // siguiente caracter
                            Recorrer++;
                        }
                        // la linea
                        line = ""; 
                        // el cuerpo
                        BodyCode = FunctionBody.trim().substring(1, FunctionBody.trim().length - 1);
                        // crear el falso
                        IfFalseCode = BodyCode;
                    }
                }
                // si es verdadero ejecutar el verdadero
                if (IfCondition == "true") EnvNew = ExCode(IfTrueCode+ "\n//.", EnvNew);
                // si es falso ejecutar el falso
                else EnvNew = ExCode(IfFalseCode+ "\n//.", EnvNew);
            }
            // uso estricto
            else if (Word == "\"use strict\"") StrictMode = true;
            // limpieza de pantalla
            else if (Word == "Sys.Clear") console.clear();
            // obtencion de caracteres
            else if (Word == "Sys.GetChar") SysGetChar = true;
            // romper bucle
            else if (Word == "break") { EnvNew.retval = "@break"; return EnvNew;}
            // crear carpeta
            else if (Word == "Sys.MkDir") SysDotMkDir = true;
            // abrir archivo
            else if (Word == "Sys.fread") SysDotFreadStatment = true;
            // si existe un archivo
            else if (Word == "Sys.fexist") SysDotFexist = true;
            // escribir en un archivo
            else if (Word == "Sys.fwrite") SysDotFwrite = true;
            // impresion
            else if (Word == "Sys.Out") SysDotOutStatment = true;
            // advertencia
            else if (Word == "Sys.Warn") SysWarnStatment = true;
            // poner en el principal
            else if (Word == "out") PutInOut = true;
            // crear funcion
            else if (Word == "function") OnFunction = true;
            // for
            else if (Word == "for") IsInFor = true;
            // retornar valor
            else if (Word == "return") GoToReturn = true;
            // const x = val;
            else if (Word == "const") DeclareAsConst = true;
            // asignar
            else if (Code[Recorrer + 1] == '=')
            {
                // recorrer
                Recorrer++;
                // eliminar espacios en blanco
                while (Recorrer < Code.length && IsWhileSpace(Code[Recorrer])) { Recorrer++;}
                // preparar asignacion
                GoToAsign = true; 
                // asignacion
                AsignTo = Word;
            } 
            // operar algo
            else if (Code[Recorrer + 2] == '=' && IsOperator(Code[Recorrer + 1]))
            {
                // el operador
                let operator = Code[Recorrer + 1];
                // asignar opcion
                GoToAsignOp = true; 
                // el operador
                Operator = operator; 
                // asignacion
                AsignTo = Word;
                // siguiente caracter
                Recorrer++;
            }
            else
            {
                // si esta en la definicion de una funcion
                if (OnFunction == true)
                {          
                    // si es documentado agregarlo
                    if (OnlyDocumentationQuiet) EnvNew.documentations.set(Word, LastDocumentationCommentContent);
                    // en una funcion          
                    OnFunction = false;
                    // arboles
                    let Treads = 0;
                    // el cuerpo
                    let FunctionBody = "";
                    // ha estado en un scope
                    let havem = false;
                    // obtener el cuerpo
                    while ((havem == true ? (Treads != 0) : true) && Recorrer < Code.length) {
                        // añadir caracter
                        FunctionBody += Code[Recorrer];
                        // nuevo scope
                        if (Code[Recorrer] == '{') { Treads++; havem = true;}
                        // salir del scope
                        else if (Code[Recorrer] == '}') Treads--;
                        // siguiente caracter
                        Recorrer++;
                    }
                    // vaciar linea
                    line = "";
                    // en todo el codigo global
                    if (PutInOut == true) Env.variables.set(Word, FunctionBody);
                    // solo en este stack
                    else Env.locals.set(Word, FunctionBody);
                }
                // elimina una variable
                else if (DeleteVar) { DeleteVar = false; EnvNew.variables.delete(Word); }
                // escritura de archivos
                else if (SysDotFwrite)
                {
                    // el nombre
                    SysDotFwrite = false; let name = SyntaxSolve("Sys.__Fname__", EnvNew);
                    // la codificacion
                    let encode = SyntaxSolve("Sys.__encode__", EnvNew);
                    // el contenido
                    let content = SyntaxSolve(Word, EnvNew);
                    // escribir en el archivo
                    if (OnlyDocumentationQuiet == false) fs.writeFileSync(name, content, encode);
                }
                // hacer un directorio
                else if (SysDotMkDir) {
                    // el nombre
                    SysDotMkDir = false; let name = SyntaxSolve("Sys.__Fname__", EnvNew);
                    // no existe o no hay un archivo con el nombre crearlo
                    if (!fs.existsSync(name) || !fs.statSync(name).isDirectory()) if (OnlyDocumentationQuiet == false) fs.mkdirSync(name);
                }
                // si un archivo existe
                else if (SysDotFexist) { SysDotFexist = false; EnvNew.variables.set(Word ,String(fs.existsSync(SyntaxSolve("Sys.__Fname__", EnvNew)))); }
                // leer el contenido de un archivo
                else if (SysDotFreadStatment) { SysDotFreadStatment = false; EnvNew.variables.set(Word ,fs.readFileSync(SyntaxSolve("Sys.__Fname__", EnvNew), 'utf-8')); }
                // obtener caracter de un texto
                else if (SysGetChar) { SysGetChar = false; let Str = SyntaxSolve("Sys.__str__",Env); let CharGet = Number(SyntaxSolve("Sys.__char__",Env)); EnvNew.variables.set(Word, Str[CharGet]); }
                // requerir cosas y ponerlas
                else if (requirethings == true) { thingstorequire.push(Word); }
                // añadir un archivo a la lista de importacion
                else if (importfile == true) { filestoimport.push(Word); }
                else if (IsInFor)
                {
                    // configurar variables
                    IsInFor = false; let Treads = 0; let FunctionBody = ""; let havem = false;
                    // recorrer el for
                    while ((havem == true ? (Treads != 0) : true) && Recorrer < Code.length) {
                        // añadir el caracter
                        FunctionBody += Code[Recorrer];
                        // abrir llave
                        if (Code[Recorrer] == '{') { Treads++; havem = true;}
                        // cerrar llave
                        else if (Code[Recorrer] == '}') {  Treads--; havem = true; }
                        // si ya no hay scopes salir del bucle
                        if (Treads == 0 && havem == true) { break;}
                        // siguiente caracter
                        Recorrer++;
                    }
                    // vaciar la linea
                    line = "";
                    // parametros
                    let Params = GetParams(FunctionBody);
                    // las literaciones
                    let ForIterations = Number(SyntaxSolve(Params[0], EnvNew));
                    // si tiene un index
                    let HaveIndex = false;
                    // variable de indice
                    let IndexVar = "";
                    // si tiene un indice
                    if (Params.length == 2) { IndexVar = Params[1]; HaveIndex = true; }
                    // el cuerpo de la funcion
                    let BodyCode = FunctionBody.substring(FunctionBody.split("{")[0].length).trim();
                    // extraer solo el cuerpo
                    BodyCode = BodyCode.substring(1, BodyCode.length - 2).trim();
                    // si tiene indice
                    if (HaveIndex)
                    { 
                        // el indice
                        let index = Number(SyntaxSolve(IndexVar, EnvNew));
                        // literaciones que necesita para salir
                        let ForGetExit = Number(SyntaxSolve(Params[0], EnvNew));
                        // ejecutar literaciones
                        while (index < ForGetExit)
                        {
                            // el indice
                            index = Number(SyntaxSolve(IndexVar, EnvNew));
                            // el numero de literaciones para salir
                            ForGetExit = Number(SyntaxSolve(Params[0], EnvNew));
                            // si el indice es mayor a las literaciones salir
                            if (index > ForGetExit) break;
                            // ejecutar el codigo
                            EnvNew = ExCode(BodyCode+ "\n//.", EnvNew);
                            // si se rompe el bucle
                            if (EnvNew.retval == "@break") { EnvNew.retval = ""; break;}
                        }
                    }
                    // si no tiene indice
                    else {
                        // las literaciones
                        for (let index = 0; index < ForIterations; index++) {     
                            // ejecutar codigo       
                            EnvNew = ExCode(BodyCode+ "\n//.", EnvNew);
                            // si se rompe el bucle
                            if (EnvNew.retval == "@break") { EnvNew.retval = ""; break; }
                        }
                    }
                }
                // imprimir advertencia
                else if (SysWarnStatment == true) { SysWarnStatment = false; if (OnlyDocumentationQuiet == false) console.warn(SyntaxSolve(Word, EnvNew)); }
                // imprimir algo
                else if (SysDotOutStatment == true) { SysDotOutStatment = false; if (OnlyDocumentationQuiet == false) console.log(SyntaxSolve(Word, EnvNew)); }
                // ir a retornar algo
                else if (GoToReturn == true) { EnvNew.retval = SyntaxSolve(Word, EnvNew); return EnvNew; }
                // evaluar codigo
                else if (Word.startsWith("@[") && Word.endsWith("]")) { EnvNew = ExCode(SyntaxSolve(Word.substring(2, Word.length - 1), EnvNew), EnvNew); }
            }
            // limpiar la palabra clave
            Word = "";
        }
    }
    // se despiden las constantes
    ConstsThatDeletes.forEach(element => { if (EnvNew.constants.has(element)) EnvNew.constants.delete(element); });
    // se despiden las variables locales
    VarsThatDeletes.forEach(element => { if (EnvNew.locals.has(element)) EnvNew.locals.delete(element); });
    // codigo terminado
    return EnvNew;
}

function GetEnvFromCode(Code)
{
    // el entorno
    let envi = new Envioriment();

    // asignar interno
    envi.variables.set("quiet_mode", "true");

    // ajustar variable de argumentos
    envi.variables.set("#Sys.Argv", "0");

    // inicializar variables del entorno
    envi.constants.set("Sys.PathSep", path.sep);
    envi.constants.set("Sys.PathDelimiter", path.delimiter);
    envi.constants.set("Sys.ActualPath", process.cwd());
    envi.constants.set("Sys.RunPath", __dirname);

    // documentacion para las varibales del entorno
    envi.documentations.set("Sys.PathSep", "separador para los directorios, puede ser `\\` en windows, `/` en MacOS y GNU/Linux o cualquier kernel basado en unix");
    envi.documentations.set("Sys.PathDelimiter", "separador para multiples directorios, puede ser `;` en windows, `:` en MacOS y GNU/Linux o cualquier kernel basado en unix");
    envi.documentations.set("#Sys.Argv", "Representa la cantidad de argumentos que se pasaron a la instancia de el interprete, eso ya no lo puedo extraer con la documentacion por que es muy dinamico");
    envi.documentations.set("Sys.ActualPath", "Representa la carpeta desde la cual se llamo a el interprete");

    // documentacion para cosas que no son variables
    envi.documentations.set("Sys.Time.Milliseconds", "obtiene el milisegundo actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");
    envi.documentations.set("Sys.Time.Seconds", "obtiene el segundo actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");
    envi.documentations.set("Sys.Time.Minutes", "obtiene el minuto actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");
    envi.documentations.set("Sys.Time.Hour", "obtiene la hora actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");
    envi.documentations.set("Sys.Time.Day", "obtiene el dia actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");
    envi.documentations.set("Sys.Time.Month", "obtiene el mes actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");
    envi.documentations.set("Sys.Time.Year", "obtiene el año actual, se actualiza en tiempo real asi que no se tiene que preocupar por nada");

    // ejecutar codigo
    envi = ExCode(Code, envi);

    return envi;
}

function SetPath(Path)
{
    actual_path = Path;
}

module.exports = { GetEnvFromCode, Envioriment , SetPath, GetParamsDoc};
