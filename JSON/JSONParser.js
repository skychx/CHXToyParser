/*
 * @Author: chenhao25
 * @Date: 2021-06-12 10:59:29
 * @LastEditors: chenhao25
 * @LastEditTime: 2021-06-12 12:40:58
 * @FilePath: /CHXToyParser/JSON/JSONParser.js
 * Code: https://codesandbox.io/s/json-parser-with-error-handling-hjwxk?from-embed=&file=/src/index.js
 * EN-Blog: https://lihautan.com/json-parser-with-javascript/
 * CH-Blog: https://github.com/ascoders/weekly/blob/master/%E5%89%8D%E6%B2%BF%E6%8A%80%E6%9C%AF/139.%E7%B2%BE%E8%AF%BB%E3%80%8A%E6%89%8B%E5%86%99%20JSON%20Parser%E3%80%8B.md
 */

function ToyJSONParser(str) {
    let i = 0;

    // Object
    // https://www.json.org/img/object.png
    //      ┌─┐     ┌──────────┐               ┌─┐
    // ─────┤{├──┬──┤whitespace├─────────────┬─┤}├─►
    //      └─┘  │  └──────────┘             │ └─┘
    //           │                           │
    //      ┌─┐  │  ┌──────────┐ ┌──────┐    │
    //   ┌──┤,├──┴──┤whitespase├─┤string├──┐ │
    //   │  └─┘     └──────────┘ └──────┘  │ │
    //   │                                 │ │
    //   │  ┌──────────────────────────────┘ │
    //   │  │                                │
    //   │  │ ┌──────────┐  ┌─┐   ┌─────┐    │
    //   │  └─┤whitespace├──┤;├───┤value├────┤
    //   │    └──────────┘  └─┘   └─────┘    │
    //   │                                   │
    //   └───────────────────────────────────┘
    function parseObject() {
        if (str[i] === '{') {
            i++;
            skipWhitespace();

            const result = {};

            // JSON 内容解析时其实是按【, key: value】【, key: value】 的组合分隔的
            // initial 变量是用来标示是不是第一个元素（因为第一个元素前面没有逗号和空格）
            let initial = true;

            // 如果下一个字符不是 '}'（也就是 "{}"）的形式
            // 那么里面的内容应该是 string -> whitespace -> ':' -> value -> ...
            while (str[i] !== '}') {
                // 这个是用来跳过逗号和空格的
                if (!initial) {
                    eatComma();
                    skipWhitespace();
                }

                const key = parseString();
                skipWhitespace();
                eatColon();
                const value = parseValue();

                result[key] = value;
                initial = false;
            }

            // 跳过末尾的括号 "}"
            i++;

            return result;
        }
    }

    function parseArray() {
        if (str[i] === '[') {
            i++;
            skipWhitespace();

            const result = [];
            let initial = true;

            while (str[i] !== ']') {
                if (!initial) {
                    eatComma();
                }

                const value = parseValue();

                result.push(value);
                initial = false;
            }

            // 跳过末尾的括号 "}"
            i++;

            return result;
        }
    }

    function parseValue() {
        skipWhitespace();

        const value =
            parseString() ??
            parseNumber() ??
            parseObject() ??
            parseArray() ??
            parseKeyword("true", true) ??
            parseKeyword("false", false) ??
            parseKeyword("null", null);

        skipWhitespace();

        return value;
    }

    // 解析 true、false、null
    function parseKeyword(name, value) {
        if (str.slice(i, i + name.length) === name) {
            i += name.length;

            return value
        }
    }

    function parseString() {
        if (str[i] === '"') {
            i++; // 跳过第一个引号
            let result = "";
            while (i < str.length && str[i] !== '"') {
                // 转义字符
                if (str[i] === "\\") {
                    const char = str[i + 1];
                    // 特殊符号
                    if (
                        char === '"' ||
                        char === "\\" ||
                        char === "/" ||
                        char === "b" ||
                        char === "f" ||
                        char === "n" ||
                        char === "r" ||
                        char === "t"
                    ) {
                        result += char;
                        i++;
                    } else if (char === "u") {
                        // 4 hex digits
                        if (
                            isHexadecimal(str[i + 2]) &&
                            isHexadecimal(str[i + 3]) &&
                            isHexadecimal(str[i + 4]) &&
                            isHexadecimal(str[i + 5])
                        ) {
                            result += String.fromCharCode(
                                parseInt(str.slice(i + 2, i + 6), 16)
                            );
                            i += 5;
                        } else {
                            i += 2;
                            // expectEscapeUnicode(result);
                        }
                    } else {
                        // expectEscapeCharacter(result);
                    }
                } else {
                    result += str[i];
                }
                i++;
            }
            // expectNotEndOfInput('"');
            i++; // 跳过末尾引号
            return result;
        }
    }

    function isHexadecimal(char) {
        return (
            (char >= "0" && char <= "9") ||
            (char.toLowerCase() >= "a" && char.toLowerCase() <= "f")
        );
    }

    // 解析数字
    // https://leetcode-cn.com/problems/valid-number/
    function parseNumber() {
        let start = i; // 记录 number 开始的位置

        // 负号的分支
        if (str[i] === "-") {
            i++;
        }
        // 0 开头的分支
        if (str[i] === "0") {
            i++;
        } else if (str[i] >= "1" && str[i] <= "9") {
            // 1-9 的分支
            i++;
            while (str[i] >= "0" && str[i] <= "9") {
                i++;
            }
        }

        // 如果有小数点
        if (str[i] === ".") {
            i++;
            while (str[i] >= "0" && str[i] <= "9") {
                i++;
            }
        }

        // 科学计数法
        if (str[i] === "e" || str[i] === "E") {
            i++;
            if (str[i] === "-" || str[i] === "+") {
                i++;
            }
            while (str[i] >= "0" && str[i] <= "9") {
                i++;
            }
        }
        if (i > start) {
            return Number(str.slice(start, i));
        }
    }

    // 跳过空白符号
    // https://www.json.org/img/whitespace.png
    function skipWhitespace() {
        // /s/.test(str[i])
        while (
            str[i] === " " ||
            str[i] === "\n" ||
            str[i] === "\t" ||
            str[i] === "\r"
        ) {
            i++;
        }
    }

    // 吃掉逗号
    function eatComma() {
        if (str[i] !== ',') {
            throw new Error('Expected ",".');
        }
        i++;
    }

    // 吃掉冒号
    function eatColon() {
        if (str[i] !== ':') {
            throw new Error('Expected ":".');
        }
        i++;
    }

    const value = parseValue();
    return value;
}

let test = ToyJSONParser('{ "data": { "fish": "cake", "array": [1,2,3], "children": [ { "something": "else" }, { "candy": "cane" }, { "sponge": "bob" }, { "boolean": true }, { "NULL": null } ] } } ');

console.log('ToyJSONParser test', JSON.stringify(test, null, 2));
