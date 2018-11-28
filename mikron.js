$(function() {
    var version = "v3.0";
    var container = $('div.console');
    // main controller for interpreter (from jquery.console.js)
    var controller = container.console({
        promptLabel: 'Σ ',
        autofocus: true,
        animateScroll: true,
        promptHistory: true,
        welcomeMessage: "═══[mikron]═══",
        cmds: [
            "run",
			"debug",
			"runfile",
			"debugfile",
			"cls",
			"save",
			"load",
			"list",
			"version",
			"purge",
			"help",
			"atoms",
			"file",
			"examples"
        ],
        commandValidate: line => line === '' ? false : true,
        commandHandle: line => {
            try {
                var gotten = parseCommand(line);
                if (gotten[1] == 1) {
                    return [{
                        msg: gotten[0],
                        className: "jquery-console-message-error"
                    }];
                } else {
                    return [{
                        msg: gotten[0],
                        className: "jquery-console-message-value"
                    }];
                }
            } catch (e) {
                return [{
                    msg: "internal error: this is a bug, please report it\n" + e,
                    className: "jquery-console-message-error"
                }];
            }
        },
        completeHandle: function(prefix) {
            var cmds = this.cmds, ret = [], cmd;
            for (var i = 0; i < cmds.length; i++) {
                cmd = cmds[i];
                if (cmd.lastIndexOf(prefix, 0) === 0)
                    ret.push(cmd.substring(prefix.length));
            }
            return ret;
        }
    });
    var input, a, b, c, ip, a1, a2, done, runfile, toRun, mode, errorString; // non array vars
    var list, loop, stringList, charList; // array type vars
    var wrong, maxLoop, compareTo, nest, funIndex, result, info; // misc vars
    var atoms = [], program, programNoComments, programRun; // core vars
    var cmdStore = [10, 16, 100, 256]; // array for ! and ? atoms
    var replies = [ // snarky replies on wrong commands
        "what are you doing",
		"stop it",
		"you're trying too hard",
		"nope",
		"try again",
		"delet this",
		"getting warmer",
		"one eternity later...",
		"it's not helping",
		"why",
		"you are now aware of your own breathing",
		"NO",
		"*screams in computer*"
    ];
    var loadList = [ // example programs
        "5+5 'addition'",
        '7*2@" bytes"@+',
        ":I=I: 'palindrone detector that is a palindrome'",
        `"Hello, world!"`
    ];
    // shorthand functions
    var p = v => parseInt(v, 10);
    var n = v => isNaN(v);
    var d = v => v !== undefined;
    var pf = v => parseFloat(v);
    var ma = v => Math.abs(v);
    var tS = v => v.toString();
    
    list = loop = stringList = charList = [];
    wrong = maxLoop = compareTo = nest = funIndex = 0;
    
    // undefined protection with arrays
    Array.prototype.pull = function() { return this.length === 0 ? 0 : this.pop(); };
    Array.prototype.dequeue = function() { return this.length === 0 ? 0 : this.shift(); };
    
    // external file reader
    document.getElementById("file").onchange = function() {
        var file = this.files[0], reader = new FileReader();
        reader.onload = function(progressEvent) { runfile = this.result; };
        reader.readAsText(file);
    };
    
    function parseCommand(input) {
        var command = input.match(/(?:[^\s"]+|"[^"]*")+/g);
        switch (command[0]) {
            case "run":
                if (!d(command[1])) {
                    if (d(toRun))
                        return [runProgram(toRun, false), 0];
                    return ["# err:run -> no program", 1];
                } else {
                    toRun = command[1];
                    return [runProgram(toRun, false, command[2], command[3]), 0];
                }
                break;
            case "debug":
                if (!d(command[1])) {
                    if (d(toRun))
                        return [runProgram(toRun, true), 0];
                    return ["# err:debug -> no program", 1];
                } else {
                    toRun = command[1];
                    return [runProgram(toRun, true, command[2], command[3]), 0];
                }
                break;
            case "runfile":
                if (!d(runfile))
                    return ["# err:runfile -> no program", 1];
                else
                    return [runProgram(runfile, false, command[1], command[2]), 0];
                break;
            case "debugfile":
                if (!d(runfile))
                    return ["# err:debugfile -> no program", 1];
                else
                    return [runProgram(runfile, true, command[1], command[2]), 0];
                break;
            case "load":
                if (n(command[1]))
                    return ["# err:load -> give a proper index", 1];
                else {
                    toRun = loadList[p(command[1])];
                    if (!d(toRun))
                        return [`> program ${command[1]} does not exist`, 0];
                    else {
                        var a1 = command[2], a2 = command[3];
                        if (!d(a1) && !d(a2))
                            return [`> loaded program ${command[1]} as ${toRun}`, 0];
                        else if (!d(a2))
                            return [`> loaded program ${command[1]} as ${toRun} <- ${a1}`, 0];
                        else
                            return [`> loaded program ${command[1]} as ${toRun} <- ${a1} ${a2}`, 0];
                    }
                }
                break;
            case "save":
                if (n(command[1]))
                    return ["# err:save -> give a proper index", 1];
                else {
                    loadList[p(command[1])] = (!d(command[2]) ? toRun : command[2]);
                    return [`> saved ${loadList[p(command[1])]} as program ${command[1]}`, 0];
                }
                break;
            case "help":
                return [
                    "atoms:     get atoms (in new tab)\n" +
                    "examples:  show examples (in new tab)\n" +
				    "run:       run [program] [arg1] [arg2]\n" +
				    "debug:     debug [program] [arg1] [arg2]\n" +
				    "file:      get file\n" +
				    "runfile:   run file [arg1] [arg2]\n" +
				    "debugfile: debug file [arg1] [arg2]\n" +
				    "cls:       clear screen\n" +
				    "load:      load program to run [program number]\n" +
				    "save:      save program [program number] [program]\n" +
				    "list:      list programs in memory\n" +
				    "purge:     clear memory\n", 0
                ];
            case "version":
                return [
                    `mikron version ${version}\n` +
                    "powered by JavaScript, JQuery, and Magic(TM)", 0
                ];
            case "list":
                var ret = "";
                for (var i = 0; i < loadList.length; i++)
                    ret += `[${i}]\t${loadList[i]}\n`;
                if (loadList.length !== 0)
                    return [`current programs loaded:\n${ret}`, 0];
                else
                    return ["> current programs loaded\nnone", 0];
                break;
            case "cls":
                $('div.jquery-console-message-value').html('');
                $('div.jquery-console-message-error').html('');
                $('div.jquery-console-prompt-box').html('');
                $('div.jquery-console-welcome').html('');
                return ['', 0];
            case "purge":
                toRun = runfile = a1 = a2 = undefined;
                return ["> memory purged", 0];
            case "atoms":
                window.open("atoms.txt", "_blank");
                return ["", 0];
            case "examples":
                window.open("examples.txt", "_blank");
                return ["", 0];
            case "M>":
                return [atoms, 0];
            case "file":
                $("#file").trigger("click");
                return ["", 0];
            default:
                if (wrong >= 5) {
                    var reply = replies[~~(Math.random() * (replies.length))];
                    wrong = 0;
                    return [`# Unknown command: ${command[0]}\n\n${reply}`, 1];
                } else {
                    wrong++;
                    return [`# Unknown command: ${command[0]}`, 1];
                }
                break;
        }
    }
    
    function format(atoms) {
        var st = [], back, error = -1;
        loop = [];
        for (ip = 0; ip < atoms.length; ip++) {
            switch (atoms[ip].value) {
                case '[':
                    st.push(ip);
                    break;
                case ']':
                    if (st.length === 0) error = ip;
                    back = st.pop();
                    loop[ip] = back;
                    loop[back] = ip;
                    break;
            }
        }
        if (st.length > 0) error = st[0];
        if (error >= 0) {
            ip = error;
            errorString = `# Unmatched '${atoms[error].value}' at atom ${error}`;
            return 1;
        } else return 0;
    }
    
    // extracts strings from between quotes
    function getString(str) {
        const re = /"(.*?)"/g, result = [];
        let current;
        while (current = re.exec(str)) result.push(current.pop());
        if (!str.includes('"')) return [];
        else return result.length > 0 ? result : [str];
    }
    
    function reset(arg0, arg1) {
        a = arg0;
        b = arg1;
        if (d(a)) a = !n(a) ? (Number.isInteger(a) ? p(a) : pf(a)) : a;
        if (d(b)) b = !n(b) ? (Number.isInteger(b) ? p(b) : pf(b)) : b;
        done = mode = false;
        result = "", info = "";
        cmdStore = [10, 16, 100, 256];
        list = [];
        atoms = [];
        if (d(arg0)) {
            list = (tS(arg0).includes(',') ?
                (n(tS(arg0).split(',')[0]) ?
                    tS(arg0).split(',') :
                    tS(arg0).split(',').map(Number)
                ) : []
            );
        }
        ip = maxLoop = 0;
    };
    
    function lex(input) {
        var i = 0;
        var isDigit = function(c) { return /[0-9]/.test(c); };
        var addAtom = function(type, value) {
            atoms.push({
                type: type,
                value: value
            });
        };
        
        charList = input.match(/`./g);
        charList = charList === null ? charList : charList.map(z => z.replace(/`/g, '')).reverse();
        stringList = getString(input).reverse();
        
        var _ = input;
        _ = _.replace(/"[^"]*"/g, '"');
        _ = _.replace(/`./g, '`');
        console.log(_);
        programNoComment = input.replace(/'(.*?)'/g, '');
        console.log(programNoComment);
        programRun = _.replace(/'(.*?)'/g, '').replace(/[\s\t\n]+(?=([^"]*"[^"]*")*[^"]*$)/g, '');
        console.log(programRun);
        
        for (i = 0; i < programRun.length; i++) {
            c = programRun[i];
            if (diyadSet[c])
                addAtom(2, c);
            else if (monadSet[c])
                addAtom(1, c);
            else if (niladSet[c])
                addAtom(0, c);
            else if (isDigit(c)) {
                var num = "";
                for (;;) {
                    var n = programRun[i];
                    if (!isDigit(n)) break;
                    num += n;
                    i++;
                }
                num = p(num);
                addAtom(-1, num);
                --i;
            } else if (c == '"')
                addAtom(-1, stringList.pop());
            else if (c == '`')
                addAtom(-1, charList.pop());
            else {};
        }
        console.log(atoms);
        return atoms;
    };
    
    var diyadSet = {
        '+': (x, y) => {
            if (!n(p(x)) && !n(p(y)))
                return x + y;
            else
                return tS(x).concat(y);
        },
        '-': (x, y) => {
            if (!n(x) && !n(y))
                return x - y;
            if ((n(x) && !n(y)) || (!n(x) && n(y))) {
                var t = n(x) ? y : x, s = n(x) ? x : y;
                for (var i = 0; i < t; i++)
                    s = s.slice(0, -1);
                return s;
            }
            if (n(x) && n(y))
                return [...x].map(n => [...y].some(z => n == z) ? "" : n).join('');
        },
        '*': (x, y) => {
            if (!n(x) && !n(y))
                return x * y;
            else if ((n(x) && !n(y)) || (!n(x) && n(y))) {
                var to = n(x) ? y : x, tA = [];
                for (var i = 0; i <= to - 1; i++)
                    tempArray[i] = n(x) ? tS(x) : tS(y);
                return tA.join().replace(/,/g, '');
            } else {
                var ri = (x, y) => String.raw({ raw: x.match(/.?/g) }, ...y);
                return ri(tS(x), tS(y));
            }
        },
        '/': (x, y) => {
            if (mode) {
                if (!n(x) && !n(y)) {
                    b = x % y;
                    return Math.floor(x / y);
                } else
                    return x.toUpperCase();
            } else {
                if (!n(x) && !n(y))
                    return x / y;
                else
                    return x.toUpperCase();
            }
        },
        '%': (x, y) => {
            if (!n(x) && !n(y))
                return x % y;
            else
                return x.toLowerCase();
        },
        '&': (x, y) => {
            if (mode) return x & y;
            else return (x !== 0 && y !== 0) ? 1 : 0;
        },
        '^': (x, y) => {
            if (mode) return x | y;
            else return (x !== 0 || y !== 0) ? 1 : 0;
        },
        '=': (x, y) => {
            if (mode) return x ^ y;
            else return x == y ? 1 : 0;
        },
        '>': (x, y) => {
            if (mode) return x >> y;
            else return x > y ? 1 : 0;
        },
        '<': (x, y) => {
            if (mode) return x << y;
            else return x < y ? 1 : 0;
        },
        'E': (x, y) => x ** y,
        'G': (x, y) => {
            if (mode) return (monadSet.F(x)) / (monadSet.F(y) * monadSet.F(x - y));
            else {
                return (gcd = (n1, n2) => {
                    n1 = ma(n1), n2 = ma(n2);
                    return (!n2) ? n1 : gcd(n2, n1 % n2);
                })(x, y);
            }
        },
        'L': (x, y) => {
            if (mode) return (monadSet.F(x)) / monadSet.F(x - y);
            else {
                return (lcm = (n1, n2) => {
                    abs = ma(n1 * n2);
                    return abs / diyadSet.G(n1, n2);
                })(x, y);
            }
        },
        'R': (x, y) => ~~(Math.random() * (y - x + 1)) + x,
        't': (x, y) => x == y ? x : y,
        'u': (x, y) => Math.log(x) / Math.log(y)
    };
    var monadSet = {
        '$': x => (list.push(x), a),
        '}': x => {
            if (mode) {
                result += `${x}`;
                return x;
            } else {
                result += `${x}\n`;
                return x;
            }
        },
        '~': x => {
            if (mode) return ~x;
            else {
                if (!n(x)) return (x !== 0) ? 1 : 0;
                else {
                    var sC = l => {
                        var nL = "";
                        for (var i = 0; i < l.length; i++) {
                            if (l[i] === l[i].toLowerCase()) nL += l[i].toUpperCase();
                            else nL += l[i].toLowerCase();
                        }
                        return nL;
                    }
                    return sC(x);
                }
            }
        },
        'B': x => (fib = z => z < 2 ? z : fib(z - 1) + fib(z - 2))(x),
        'C': x => {
            if (!n(x)) return Math.ceil(x);
        },
        'D': x => list[x],
        'F': x => (fact = z => z < 2 ? 1 : z * fact(z - 1))(x),
        'H': x => {
            if (mode) return x * 2;
            else return x * 0.5;
        },
        'J': x => x % 1 ? 0 : 1,
        'K': x => x * 0.75,
        'M': x => (list = list.concat([...tS(x)].map(Number)), x),
        'N': x => (!n(x) ? p(x) : x),
        'P': x => {
            if (x == 2) return 1;
            else if ((x < 2) || (x % 2 == 0)) return 0;
            else {
                for (var i = 3; i <= x ** 0.5; i += 2)
                    if (x % i == 0) return 0;
                return 1;
            }
        },
        'Q': x => {
            if (mode) return x * 4;
            else return x * 0.25;
        },
        'S': x => Math.sqrt(x),
        'T': x => {
            ip++;
            if (atoms[ip].value == 's') return Math.sin(x);
            else if (atoms[ip].value == 'c') return Math.cos(x);
            else if (atoms[ip].value == 't') return Math.tan(x);
            else {
                if (mode) return (180 * x) / Math.PI;
                else return (Math.PI * x) / 180;
            }
        },
        'U': x => (list.length || tS(x).length),
        'X': x => {
            if (x > 0) {
                var tA = [];
                for (var i = x; i > 0; i--) tA.push(i);
                list = list.concat(tA);
            }
            else list.push(1);
            return x;
        },
        'c': x => x ** 3,
        'd': x => x - (9 * (~~((x - 1) / 9))),
        'f': x => ~~x,
        'g': x => {
            if (x > 0) {
                var tA = [];
                for (var i = tS(x).length; i > 0; i--) tA.push(i);
                list = list.concat(tA);
            }
            else list.push(1);
            return x;
        },
        'h': x => x * 2,
        'i': x => -x,
        'k': x => 1 / x,
        'l': x => Math.log(x),
        'm': x => (list = list.concat([...tS(x)].map(String)), x),
        'n': x => tS(x),
        'p': x => n(x) ? x.charCodeAt(0) : String.fromCharCode(x),
        'q': x => (list.unshift(a), a),
        's': x => x ** 2,
        'v': x => ma(x),
        'x': x => {
            for (var l = x; l > 0; l--) list.pop();
            return x;
        },
        'z': x => x / 10,
    };
    var niladSet = {
        '\n': () => a,
        '\t': () => a,
        '|': () => a,
        'V': () => {
            switch (atoms[++ip].value) {
                case 'p':
                    return Math.PI;
                    break;
                case 'e':
                    return Math.E;
                    break;
                case 'h':
                    return (1 + (5 ** 0.5)) / 2;
                    break;
                case 's':
                    return Math.SQRT2;
                    break;
                case 'd':
                    var d = new Date();
                    return d.getDate();
                case 'm':
                    if (mode) {
                        var d = new Date();
                        return d.getMonth();
                    } else {
                        var d = new Date();
                        const months = [
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December"
                        ];
                        return months[d.getMonth()];
                    }
                case 'y':
                    var d = new Date();
                    return d.getFullYear();
                default:
                    return a;
            }
        },
        '@': () => ([b, a] = [a, b], a),
        ',': () => {
            ip = atoms.length == 1 ? ip : ip + 1;
            if (monadSet[atoms[ip].value]) {
                list.push(monadSet[atoms[ip].value](list.pull()));
                return a;
            }
            else if (diyadSet[atoms[ip].value]) {
                list.push(diyadSet[atoms[ip].value](list.pull(), list.pull()));
                return a;
            }
            else {
                ip--;
                if (mode) return list.dequeue();
                else return list.pull();
            }
        },
        '#': () => (list.pop(), a),
        ':': () => {
            if (list.length !== 0) {
                var dup = list.pull();
                list.push(dup, dup);
                return a;
            } else {
                b = a;
                return a;
            }
        },
        '\\': () => {
            if (mode) {
                list = [];
                return a;
            } else {
                a = b = 0;
                return a;
            }
        },
        ';': () => (done = true, a),
        '.': () => (list = list.slice(list.length - 1).concat(list.slice(0, list.length - 1)), a),
        '{': () => (reset(arg0, arg1), a),
        '?': () => {
            ip = program.length == 1 ? ip : ip + 1;
            if (!n(atoms[ip].value)) {
                cmdStore[atoms[ip].value] = a;
                return a;
            }
            else if (atoms[ip].value == '!') {
                funIndex = b;
                return a;
            }
            else {
                cmdStore[0] = a;
                return a;
            }
        },
        '!': () => {
            ip = program.length == 1 ? ip : ip + 1;
            if (!n(atoms[ip].value)) {
                a = cmdStore[atoms[ip].value];
                a = !n(a) ? (Number.isInteger(a) ? p(a) : pf(a)) : a;
                return a;
            } else if (atoms[ip].value == '_') {
                ip--;
                compareTo = cmdStore[funIndex];
                return a;
            }
            else return cmdStore[0];
        },
        '[': () => {
            if (a === 0) ip = loop[ip];
            else ++nest;
            return a;
        },
        ']': () => {
            if (a !== 0) {
                ip = loop[ip];
                maxLoop++;
            }
            else --nest;
            return a;
        },
        '_': () => {
            if (a !== compareTo) {
                var i = 1;
                for (var j = ip + 1; j < atoms.length; j++) {
                    if (atoms[j].value == '_') i--;
                    if (i === 0) {
                        ip = j;
                        break;
                    }
                }
            }
            return a;
        },
        '(': () => {
            if (a === 0) {
                var i = 1;
                for (var j = ip + 1; j < atoms.length; j++) {
                    if (atoms[j].value == ')') i--;
                    if (i === 0) {
                        ip = j;
                        break;
                    }
                }
            }
            return a;
        },
        ')': () => {
            return a;
        },
        'A': () => {
            if (list != []) return niladSet.y() / list.length;
            else return niladSet.y() / tS(a).length;
        },
        'I': () => {
            if (list.length !== 0) {
                list = list.reverse();
                return a;
            }
            else return [...tS(a)].reverse().join``;
        },
        'W': () => Math.max(...list),
        'Y': () => {
            if (list.length !== 0) {
                var pro = 1;
                for (var q = 0; q < list.length; q++) pro *= list[q];
                return p(pro);
            }
            else {
                var pro = 1,
                    temp = [...tS(a)].map(Number);
                for (var q = 0; q < temp.length; q++) pro *= temp[q];
                return p(pro);
            }
        },
        'Z': () => {
            if (mode) {
                result += `${list}`;
                return a;
            } else {
                result += `${list}\n`;
                return a;
            }
        },
        'a': () => (list.sort(), a),
        'b': () => (mode = !mode, a),
        'e': () => (list.sort((a, b) => a - b), a),
        'r': () => Math.random(),
        'w': () => Math.min(...list),
        'y': () => {
            if (list.length !== 0) {
                var sum;
                if (n(list[0]) || typeof list[0] == "string") {
                    sum = "";
                    for (var q = 0; q < list.length; q++) sum += list[q];
                }
                else {
                    sum = 0;
                    for (var q = 0; q < list.length; q++) sum += list[q];
                }
                return p(sum);
            }
            else {
                var sum, temp = [...tS(a)];
                if (!n(a)) {
                    temp = temp.map(Number);
                    sum = 0;
                }
                else sum = "";
                for (var q = 0; q < temp.length; q++) sum += temp[q];
                return p(sum);
            }
        },
        'O': (x, y) => {
            ip++;
            var temp;
            if (n(y)) y = 1;
            for (var counter = y - 1; counter < list.length; counter += y) {
                temp = a;
                if (niladSet[atoms[ip].value]) list[counter] = niladSet[atoms[ip].value]();
                if (monadSet[atoms[ip].value]) list[counter] = monadSet[atoms[ip].value](list[counter]);
                if (diyadSet[atoms[ip].value]) list[counter] = diyadSet[atoms[ip].value](list[counter], a);
                a = temp;
            }
            return a;
        },
        'j': (x, y) => {
            for (var counter = 0; counter < list.length; counter++)
                if (list[counter] == x) list[counter] = y;
            return x;
        },
        'o': (x, y) => {
            ip++;
            var temp;
            if (n(y)) y = 1;
            for (var counter = y - 1; counter < list.length; counter += y) {
                temp = a;
                if (niladSet[atoms[ip].value]) list[counter] = niladSet[atoms[ip].value]();
                if (monadSet[atoms[ip].value]) list[counter] = monadSet[atoms[ip].value](list[counter]);
                if (diyadSet[atoms[ip].value]) list[counter] = diyadSet[atoms[ip].value](list[counter], list[counter]);
                a = temp;
            }
            return a;
        }
    };
    
    function parse(atom) {
        var left, right;
        switch (atom.type) {
            case 2:
                if (d(atoms[ip - 1]) && atoms[ip - 1].type == -1)
                    left = atoms[ip - 1].value;
                else
                    left = a;
                if (d(atoms[ip + 1]) && atoms[ip + 1].type == -1)
                    right = atoms[ip + 1].value;
                else
                    right = b;
                a = diyadSet[atom.value](left, right);
                ip++;
                break;
            case 1:
                if (d(atoms[ip - 1]) && atoms[ip - 1].type == -1)
                    left = atoms[ip - 1].value;
                else
                    left = a;
                a = monadSet[atom.value](left);
                break;
            case 0:
                if (atom.value == 'O' || atom.value == 'j' || atom.value == 'o')
                    a = niladSet[atom.value](a, b);
                else
                    a = niladSet[atom.value]();
                break;
            case -1:
                a = atom.value;
        }
    }
    
    function runProgram(run, debug, arg0, arg1) {
        reset(arg0, arg1);
        if (debug) {
            if (!d(arg0) && !d(arg1))
                result += `> debugging program ${programNoComment}\n> args = none\n`;
            else if (!d(arg0) && d(arg1))
                result += `> debugging program ${programNoComment}\n> args = ${arg1}\n`;
            else if (d(arg0) && !d(arg1))
                result += `> debugging program ${programNoComment}\n> args = ${arg0}\n`;
            else
                result += `> debugging program ${programNoComment}\n> args = ${arg0} ${arg1}\n`;
        }
        lex(run);
        try {
            format(atoms);
            if (format(atoms) !== 0)
                return errorString;
            else {
                for (ip = 0; ip < atoms.length; ++ip) {
                    if (done) break;
                    var atom = atoms[ip];
                    if (debug) {
                        info = `${ip} (${atom.value}): `;
                        parse(atom);
                        info += `${a = !d(a) ? '' : a}|${b = !d(b) ? "" : b} [${list}] {${cmdStore}}`;
                        if (ip != atoms.length) result += `${info}\n`;
                        if (maxLoop > 999) {
                            done = true;
                            result += "> loop stopped at 1000 cycles\n";
                        }
                    } else {
                        parse(atom);
                        if (maxLoop > 999) done = true;
                    }
                }
            }
        } catch (e) {
            return `Error with program at atom ${ip}: ${atom.value}`
        }
        if (!d(a)) a = 0;
        if (!done) result += `${a}`;
        if (!done && debug) result += "\n< end";
        return result.replace(/( |{|,)\n( |{|,)/g, "\\n");
    }
});