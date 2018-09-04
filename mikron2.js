$(function() {
    var version = 2.7,
        container = $('div.console'),
        controller = container.console({
            promptLabel: 'Σ ', // It's a sideways M
            commandValidate: line => {
                if (line === '') return false;
                else return true;
            },
            commandHandle: line => {
                try {
                    var gotten = parseCommand(line);
                    if (gotten[1] == 1) return [{
                        msg: gotten[0],
                        className: "jquery-console-message-error"
                    }];
                    else return [{
                        msg: gotten[0],
                        className: "jquery-console-message-value"
                    }];
                }
                catch (e) {
                    return [{
                        msg: "internal error; consider debugging",
                        className: "jquery-console-message-error"
                    }];
                }
            },
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
				"file"
			],
            completeHandle: function(prefix) {
                var cmds = this.cmds,
                    ret = [];
                for (var i = 0; i < cmds.length; i++) {
                    var cmd = cmds[i];
                    if (cmd.lastIndexOf(prefix, 0) === 0) ret.push(cmd.substring(prefix.length));
                }
                return ret;
            },
            autofocus: false,
            animateScroll: true,
            promptHistory: true,
            welcomeMessage: "═══[mikron 2]═══"
        });
    var input,
        list = [],
		wrong = 0,
        a, b, c, ip, a1, a2,
        maxLoop = 0,
        compareTo = 0,
        loop = [],
        nest = 0,
        done, runfile, toRun,
        funIndex = 0,
        mode,
        cmdStore = [10, 16, 100, 256],
        errorString,
		replies = [
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
		],
        loadList = [
            // elementary programs
            "5+5 'addition'",
            "6XY 'factorial'",
            "6F 'factorial built in'",
            "=1[}]{=0(0};); 'truth machine'",
            "-1|/9f*9?0{g!0g- 'digital root'",
            ":[-1g$g]Y 'x ^ x without builtins'",
            "/f}{% 'division and remainder'",
            '11[-1g"**********"}g]; \'10/10 grid\'',
            "_0};_<0_1};_1i 'print the sign'",
            ":Ugy$g${$y 'Sum of ILD'",
            // fun programs
            "1[\"duck\"}0R9]\"goose\" 'duck duck goose'",
            '11[-1_"BOOM"};_}] \'countdown\'',
            "1O-y+1 'electrical outlet, input is array'",
            "\"&j\"mopYH '2014 with no numbers'",
            "XoFoEy+1 'PPCG-103756'",
            "Fy 'PPCG-100823'",
            "gVeE};}l 'inversed function ln(x) and e^x'",
            "XoNyny 'PPCG-18556'",
            "1}}:[+}g] 'Infinite Fibonacci'",
            '100[-1?g" bobontw"g+}!(g" bob"g+}"todpia"})!];',
            '7*2g" bytes"g+',
            ":I=I: 'palindrone detector that is a palindrome'"
        ];
    var p = v => parseInt(v, 10),
        n = v => isNaN(v),
        pf = v => parseFloat(v),
        ma = v => Math.abs(v),
        d = v => v !== undefined,
        tS = v => v.toString();
    Array.prototype.pull = function() {
        return this.length === 0 ? 0 : this.pop();
    };
    document.getElementById("file").onchange = function() {
        var file = this.files[0],
            reader = new FileReader();
        reader.onload = function(progressEvent) {
            runfile = this.result;
        };
        reader.readAsText(file);
    };

    function parseCommand(input) {
        var command = input.match(/(?:[^\s"]+|"[^"]*")+/g);
        if (command[0] == "run") {
            if (!d(command[1])) {
                if (d(toRun)) {
                    if (format(toRun) === 0) return [runProgram(toRun, false, a1, a2), 0];
                    else return [errorString, 1];
                }
                return ["# err:run -> no program", 1];
            }
            else {
                toRun = command[1];
                if (format(toRun) === 0) return [runProgram(toRun, false, command[2], command[3]), 0];
                else return [errorString, 1];
            }
        }
        else if (command[0] == "debug") {
            if (!d(command[1])) {
                if (d(toRun)) {
                    if (format(toRun) === 0) return [runProgram(toRun, true, a1, a2), 0];
                    else return [errorString, 1];
                }
                return ["# err:debug -> no program", 1];
            }
            else {
                toRun = command[1];
                if (format(toRun) === 0) return [runProgram(toRun, true, command[2], command[3]), 0];
                else return [errorString, 1];
            }
        }
        else if (command[0] == "runfile") {
            if (!d(runfile)) return ["# err:runfile -> no program", 1];
            else {
                if (format(runfile) === 0) return [runProgram(runfile, false, command[1], command[2]), 0];
                else return [errorString, 1];
            }
        }
        else if (command[0] == "debugfile") {
            if (!d(runfile)) return ["# err:debugfile -> no program", 1];
            else {
                if (format(runfile) === 0) return [runProgram(runfile, true, command[1], command[2]), 0];
                else return [errorString, 1];
            }
        }
        else if (command[0] == "load") {
            if (n(command[1])) return ["# err:load -> give a proper index", 1];
            else {
                toRun = loadList[p(command[1])];
                if (!d(toRun)) return [`> program ${command[1]} does not exist`, 0];
                else {
                    a1 = command[2], a2 = command[3];
                    if (!d(a1) && !d(a2)) return [`> loaded program ${command[1]} as ${toRun}`, 0];
                    else if (!d(a2)) return [`> loaded program ${command[1]} as ${toRun} <- ${a1}`, 0];
                    else return [`> loaded program ${command[1]} as ${toRun} <- ${a1} ${a2}`, 0];
                }
            }
        }
        else if (command[0] == "save") {
            if (n(command[1])) return ["# err:save -> give a proper index", 1];
            else {
                loadList[p(command[1])] = (!d(command[2]) ? toRun : command[2]);
                return [`> saved ${loadList[p(command[1])]} as program ${command[1]}`, 0];
            }
        }
        else if (command[0] == "help") {
            return [
				"\
				atoms:		get atoms (in new tab)\n\
				run:       	run [program] [arg1] [arg2]\n\
				debug:      debug [program] [arg1] [arg2]\n\
				file:		get file\n\
				runfile:    run file [arg1] [arg2]\n\
				debugfile:  debug file [arg1] [arg2]\n\
				cls:        clear screen\n\
				load:       load program to run [program number]\n\
				save:       save program [program number] [program]\n\
				list:       list programs in memory\n\
				purge:      clear memory\n", 0
            ];
        }
        else if (command[0] == "version") {
            return [
                `mikron2 console version ${version}
                        powered by js and magic`, 0
            ];
        }
        else if (command[0] == "list") {
            var ret = "";
            for (var i = 0; i < loadList.length; i++) ret += `[${i}] \t${loadList[i]}\n`;
            if (loadList.length !== 0) return [`> current programs loaded:\n${ret}`, 0];
            else return ["> current programs loaded\nnone", 0];
        }
        else if (command[0] == "cls") {
            $('div.jquery-console-message-value').html('');
            $('div.jquery-console-message-error').html('');
            $('div.jquery-console-prompt-box').html('');
            $('div.jquery-console-welcome').html('');
            return ['', 0];
        }
        else if (command[0] == "purge") {
            toRun = runfile = a1 = a2 = undefined;
            return ["> memory purged", 0];
        }
		else if (command[0] == "atoms") {
			window.open("atoms.txt", "_blank");
			return ["", 0];
		}
		else if (command[0] == "file") {
			$("#file").trigger("click");
			return ["", 0];
		}
        else {
			if (wrong >= 5) {
				reply = replies[~~(Math.random() * (replies.length))];
				wrong = 0;
				return [`# Unknown command: ${command[0]}\n\n${reply}`, 1];
			}
			else {
				wrong++;
				return [`# Unknown command: ${command[0]}`, 1];
			}
		}
    }

    function format(program) {
        var st = [],
            back, error = -1;
        loop = [];
        for (ip = 0; ip < program.length; ip++) {
            switch (program[ip]) {
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
            errorString = `# Unmatched '${program[error]}' at ${error}`;
            return 1;
        }
        else return 0;
    }

    function runProgram(program, debug, arg1, arg2) {
        try {
            var parse = c => {
                if (mode) {
                    if (niladSet_1[c] && c != 'O' && c != 'j' && c != 'o') a = niladSet_1[c]();
                    if (monadSet_1[c]) a = monadSet_1[c](a);
                    if (diyadSet_1[c]) a = diyad(a, b, c);
                    if (c == 'O' || c == 'j' || c == 'o') a = niladSet_1[c](a, b);
                } else {
                    if (niladSet[c] && c != 'O' && c != 'j' && c != 'o') a = niladSet[c]();
                    if (monadSet[c]) a = monadSet[c](a);
                    if (diyadSet[c]) a = diyad(a, b, c);
                    if (c == 'O' || c == 'j' || c == 'o') a = niladSet[c](a, b);
                }
            }
            
            var reset = () => {
                a = arg1;
                b = arg2;
                if (d(a)) a = !n(a) ? (Number.isInteger(a) ? p(a) : pf(a)) : a;
                if (d(b)) b = !n(b) ? (Number.isInteger(b) ? p(b) : pf(b)) : b;
            }
            
            function diyad(a, b, c) {
                if (!n(program[ip - 1]) && !n(program[ip + 1])) {
                    ip++;
                    a = p(program[ip - 2]);
                    b = p(program[ip]);
                }
                else if (!n(program[ip - 1]) && n(program[ip + 1])) {
                    a = p(program[ip - 1]);
                    this.b = b;
                }
                else if (n(program[ip - 1]) && !n(program[ip + 1])) {
                    ip++;
                    this.a = a;
                    b = p(program[ip]);
                }
                else {
                    this.a = a;
                    this.b = b;
                }
                if (diyadSet_1[c] && mode) return diyadSet_1[c](a, b);
                if (diyadSet[c] && !mode) return diyadSet[c](a, b);
                else return this.a;
            }
            
            var diyadSet = {
                '+': (x, y) => {
                    if (!n(p(x)) && !n(p(y))) return x + y;
                    else return tS(x).concat(y);
                },
                '-': (x, y) => {
                    if (!n(x) && !n(y)) return x - y;
                    else if ((n(x) && !n(y)) || (!n(x) && n(y))) {
                        var t = n(x) ? y : x,
                            s = n(x) ? x : y;
                        for (var i = 0; i < t; i++) s = s.slice(0, -1);
                        return s;
                    }
                    else if (n(x) && n(y)) return [...x].map(n => [...y].some(z => n == z) ? "" : n).join``;
                },
                '*': (x, y) => {
                    if (!n(x) && !n(y)) return x * y;
                    else if ((n(x) && !n(y)) || (!n(x) && n(y))) {
                        var to = n(x) ? y : x,
                            tA = [];
                        for (var i = 0; i <= to - 1; i++) tempArray[i] = n(x) ? tS(x) : tS(y);
                        return tA.join().replace(/,/g, '');
                    }
                    else {
                        var ri = (x, y) => String.raw({
                            raw: x.match(/.?/g)
                        }, ...y);
                        return ri(tS(x), tS(y));
                    }
                },
                '@': (x, y) => Math.floor(x / y),
                '/': (x, y) => {
                    if (!n(x) && !n(y)) return x / y;
                    else return x.toUpperCase();
                },
                '%': (x, y) => {
                    if (!n(x) && !n(y)) return x % y;
                    else return x.toLowerCase();
                },
                '&': (x, y) => (x !== 0 && y !== 0) ? 1 : 0,
                '^': (x, y) => (x !== 0 || y !== 0) ? 1 : 0,
                '=': (x, y) => x == y ? 1 : 0,
                '>': (x, y) => x > y ? 1 : 0,
                '<': (x, y) => x < y ? 1 : 0,
                'E': (x, y) => x ** y,
                'G': (x, y) => { 
					return (gcd = (n1, n2) => {
						n1 = ma(n1), n2 = ma(n2);
						return (!n2) ? n1 : gcd(n2, n1 % n2);
					})(x, y);
				},
                'L': (x, y) => {
					return (lcm = (n1, n2) => {
						abs = ma(n1 * n2);
						return abs / diyadSet.G(n1, n2)
					})(x, y);
				},
                'R': (x, y) => ~~(Math.random() * (y - x + 1)) + x,
                't': (x, y) => x == y ? x : y,
                'u': (x, y) => Math.log(x) / Math.log(y)
            };
            var diyadSet_1 = {
                '+': (x, y) => {
                    if (!n(p(x)) && !n(p(y))) return x + y;
                    else return tS(x).concat(y);
                },
                '-': (x, y) => {
                    if (!n(x) && !n(y)) return x - y;
                    else if ((n(x) && !n(y)) || (!n(x) && n(y))) {
                        var t = n(x) ? y : x,
                            s = n(x) ? x : y;
                        for (var i = 0; i < t; i++) s = s.slice(0, -1);
                        return s;
                    }
                    else if (n(x) && n(y)) return [...x].map(n => [...y].some(z => n == z) ? "" : n).join``;
                },
                '*': (x, y) => {
                    if (!n(x) && !n(y)) return x * y;
                    else if ((n(x) && !n(y)) || (!n(x) && n(y))) {
                        var to = n(x) ? y : x,
                            tA = [];
                        for (var i = 0; i <= to - 1; i++) tempArray[i] = n(x) ? tS(x) : tS(y);
                        return tA.join().replace(/,/g, '');
                    }
                    else {
                        var ri = (x, y) => String.raw({
                            raw: x.match(/.?/g)
                        }, ...y);
                        return ri(tS(x), tS(y));
                    }
                },
                '@': (x, y) => Math.floor(x / y),
                '/': (x, y) => {
                    if (!n(x) && !n(y)) {
                        b = x % y;
                        return Math.floor(x / y);
                    }
                    else return x.toUpperCase();
                },
                '%': (x, y) => {
                    if (!n(x) && !n(y)) return x % y;
                    else return x.toLowerCase();
                },
                '&': (x, y) => x & y,
                '^': (x, y) => x | y,
                '=': (x, y) => x ^ y,
                '>': (x, y) => x >> y,
                '<': (x, y) => x << y,
                'E': (x, y) => x ** y,
                'G': (x, y) => (monadSet.F(x)) / (monadSet.F(y) * monadSet.F(x - y)),
                'L': (x, y) => (monadSet.F(x)) / monadSet.F(x - y),
                'R': (x, y) => ~~(Math.random() * (y - x + 1)) + x,
                't': (x, y) => x == y ? x : y,
                'u': (x, y) => Math.log(x) / Math.log(y)
            };
            var monadSet = {
                '$': x => (list.push(x), a),
                '}': x => (result += `${x}\n`, x),
                '~': x => {
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
                },
                'B': x => (fib = z => z < 2 ? z : fib(z - 1) + fib(z - 2))(x),
                'C': x => {
                    if (!n(x)) return Math.ceil(x);
                },
                'D': x => list[x],
                'F': x => (fact = z => z < 2 ? 1 : z * fact(z - 1))(x),
                'H': x => x * 0.5,
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
                'Q': x => x * 0.25,
                'S': x => (-x) ** 0.5,
                'T': x => {
                    ip++;
                    if (program[ip] == 's') return Math.sin(x);
                    else if (program[ip] == 'c') return Math.cos(x);
                    else if (program[ip] == 't') return Math.tan(x);
                    else return x;
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
                'h': x => x * 2,
                'i': x => -x,
                'k': x => 1 / x,
                'l': x => Math.log(x),
                'm': x => (list = list.concat([...tS(x)].map(String)), x),
                'n': x => tS(x),
                'p': x => n(x) ? x.charCodeAt(0) : String.fromCharCode(x),
                's': x => x ** 2,
                'v': x => ma(x),
                'x': x => {
                    for (var l = x; l > 0; l--) list.pop();
                    return x;
                },
                'z': x => x / 10,
            };
            var monadSet_1 = {
                '$': x => (list.push(x), a),
                '}': x => (result += `${x}`, x),
                '~': x => ~x,
                'B': x => (fib = z => z < 2 ? z : fib(z - 1) + fib(z - 2))(x),
                'C': x => {
                    if (!n(x)) return Math.ceil(x);
                },
                'D': x => list[x],
                'F': x => (fact = z => z < 2 ? 1 : z * fact(z - 1))(x),
                'H': x => x * 2,
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
                'Q': x => x * 4,
                'S': x => (-x) ** 0.5,
                'T': x => {
                    ip++;
                    if (program[ip] == 's') return Math.sin(x);
                    else if (program[ip] == 'c') return Math.cos(x);
                    else if (program[ip] == 't') return Math.tan(x);
                    else return x;
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
                'h': x => x * 2,
                'i': x => -x,
                'k': x => 1 / x,
                'l': x => Math.log(x),
                'm': x => (list = list.concat([...tS(x)].map(String)), x),
                'n': x => tS(x),
                'p': x => n(x) ? x.charCodeAt(0) : String.fromCharCode(x),
                's': x => x ** 2,
                'v': x => ma(x),
                'x': x => {
                    for (var l = x; l > 0; l--) list.pop();
                    return x;
                },
                'z': x => x / 10,
            };
            var niladSet = {
                "'": () => eval(`ip++;var comment="";for(;;){var str=program.charAt(ip);if(str=="'")break;comment+=str;ip++}a`),
                '"': () => eval(`ip++;var temp="";for(;;){var str=program.charAt(ip);if(str=='"')break;temp+=str;ip++}temp`),
                '`': () => program[++ip],
                ' ': () => a,
                '\n': () => a,
                '\t': () => a,
                '|': () => a,
                'V': () => {
                    switch (program[++ip]) {
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
                        default:
                            return a;
                    }
                },
                'q': () => program,
                ',': () => {
                    ip = program.length == 1 ? ip : ip + 1;
                    if (monadSet[program.charAt(ip)]) {
                        list.push(monadSet[program.charAt(ip)](list.pull()));
                        return a;
                    }
                    else if (diyadSet[program.charAt(ip)]) {
                        list.push(diyadSet[program.charAt(ip)](list.pull(), list.pull()));
                        return a;
                    }
                    else {
                        ip--;
                        return list.pull();
                    }
                },
                '#': () => (list.pop(), a),
                ':': () => eval("if(list.length!==0){var dup=list.pull();list.push(dup,dup);a}else{b=a;a}"),
                '\\': () => (a = b = 0, a),
                ';': () => (done = true, a),
                '.': () => (list = list.slice(list.length - 1).concat(list.slice(0, list.length - 1)), a),
                '{': () => (reset(), a),
                '?': () => {
                    ip = program.length == 1 ? ip : ip + 1;
                    if (!n(program.charAt(ip))) {
                        cmdStore[program.charAt(ip)] = a;
                        return a;
                    }
                    else if (program.charAt(ip) == '!') {
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
                    if (!n(program.charAt(ip))) {
                        a = cmdStore[program.charAt(ip)];
                        a = !n(a) ? (Number.isInteger(a) ? p(a) : pf(a)) : a;
                        return a;
                    }
                    else if (program.charAt(ip) == '?') {
                        var cmdProgram = tS(cmdStore[funIndex]);
                        for (var ip2 = 0; ip2 < cmdProgram.length; ip2++) {
                            if (done) break;
                            var cc = cmdProgram.charAt(ip2);
                            if (!n(p(cc)) && !n(cmdProgram[ip2])) {
                                if (!n(p(cmdProgram[ip2 - 1])) && !n(a)) {
                                    a *= 10;
                                    a += p(cmdProgram[ip2]);
                                }
                                else a = p(cc);
                            }
                            if (diyadSet[cc]) a = diyad(a, b, c);
                            if (monadSet[cc]) a = monad(a, c);
                            if (niladSet[cc]) a = niladSet[cc]();
                            if (maxLoop >= 999) niladSet[';']();
                        }
                        return a;
                    }
                    else if (program.charAt(ip) == '_') {
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
                        for (var j = ip + 1; j < program.length; j++) {
                            if (program[j] == '_') i--;
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
                        for (var j = ip + 1; j < program.length; j++) {
                            if (program[j] == ')') i--;
                            if (i === 0) {
                                ip = j;
                                break;
                            }
                        }
                    }
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
                'Z': () => (result += `${list}\n`, a),
                'a': () => (list.sort(), a),
                'b': () => (mode = !mode, a),
                'e': () => (list.sort((a, b) => a - b), a),
                'g': () => ([b, a] = [a, b], a),
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
                        if (niladSet[program.charAt(ip)]) list[counter] = niladSet[program.charAt(ip)]();
                        if (monadSet[program.charAt(ip)]) list[counter] = monadSet[program.charAt(ip)](list[counter]);
                        if (diyadSet[program.charAt(ip)]) list[counter] = diyadSet[program.charAt(ip)](list[counter], a);
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
                        if (niladSet[program.charAt(ip)]) list[counter] = niladSet[program.charAt(ip)]();
                        if (monadSet[program.charAt(ip)]) list[counter] = monadSet[program.charAt(ip)](list[counter]);
                        if (diyadSet[program.charAt(ip)]) list[counter] = diyadSet[program.charAt(ip)](list[counter], list[counter]);
                        a = temp;
                    }
                    return a;
                }
            };
            var niladSet_1 = {
                "'": () => eval(`ip++;var comment="";for(;;){var str=program.charAt(ip);if(str=="'")break;comment+=str;ip++}a`),
                '"': () => eval(`ip++;var temp="";for(;;){var str=program.charAt(ip);if(str=='"')break;temp+=str;ip++}temp`),
                '`': () => program[++ip],
                ' ': () => a,
                '\n': () => a,
                '\t': () => a,
                '|': () => a,
                'V': () => {
                    switch (program[++ip]) {
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
                        default:
                            return a;
                    }
                },
                'q': () => program,
                ',': () => {
                    ip = program.length == 1 ? ip : ip + 1;
                    if (monadSet[program.charAt(ip)]) {
                        list.push(monadSet[program.charAt(ip)](list.pull()));
                        return a;
                    }
                    else if (diyadSet[program.charAt(ip)]) {
                        list.push(diyadSet[program.charAt(ip)](list.pull(), list.pull()));
                        return a;
                    }
                    else {
                        ip--;
                        return list.pull();
                    }
                },
                '#': () => (list.pop(), a),
                ':': () => eval("if(list.length!==0){var dup=list.pull();list.push(dup,dup);a}else{b=a;a}"),
                '\\': () => (list = [], a),
                ';': () => (done = true, a),
                '.': () => (list = list.slice(list.length - 1).concat(list.slice(0, list.length - 1)), a),
                '{': () => (reset(), a),
                '?': () => {
                    ip = program.length == 1 ? ip : ip + 1;
                    if (!n(program.charAt(ip))) {
                        cmdStore[program.charAt(ip)] = a;
                        return a;
                    }
                    else if (program.charAt(ip) == '!') {
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
                    if (!n(program.charAt(ip))) {
                        a = cmdStore[program.charAt(ip)];
                        a = !n(a) ? (Number.isInteger(a) ? p(a) : pf(a)) : a;
                        return a;
                    }
                    else if (program.charAt(ip) == '?') {
                        var cmdProgram = tS(cmdStore[funIndex]);
                        for (var ip2 = 0; ip2 < cmdProgram.length; ip2++) {
                            if (done) break;
                            var cc = cmdProgram.charAt(ip2);
                            if (!n(p(cc)) && !n(cmdProgram[ip2])) {
                                if (!n(p(cmdProgram[ip2 - 1])) && !n(a)) {
                                    a *= 10;
                                    a += p(cmdProgram[ip2]);
                                }
                                else a = p(cc);
                            }
                            if (diyadSet[cc]) a = diyad(a, b, c);
                            if (monadSet[cc]) a = monad(a, c);
                            if (niladSet[cc]) a = niladSet[cc]();
                            if (maxLoop >= 999) niladSet[';']();
                        }
                        return a;
                    }
                    else if (program.charAt(ip) == '_') {
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
                        for (var j = ip + 1; j < program.length; j++) {
                            if (program[j] == '_') i--;
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
                        for (var j = ip + 1; j < program.length; j++) {
                            if (program[j] == ')') i--;
                            if (i === 0) {
                                ip = j;
                                break;
                            }
                        }
                    }
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
                'Z': () => (result += `${list}`, a),
                'a': () => (list.sort(), a),
                'b': () => (mode = !mode, a),
                'e': () => (list.sort((a, b) => a - b), a),
                'g': () => ([b, a] = [a, b], a),
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
                        if (niladSet[program.charAt(ip)]) list[counter] = niladSet[program.charAt(ip)]();
                        if (monadSet[program.charAt(ip)]) list[counter] = monadSet[program.charAt(ip)](list[counter]);
                        if (diyadSet[program.charAt(ip)]) list[counter] = diyadSet[program.charAt(ip)](list[counter], a);
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
                        if (niladSet[program.charAt(ip)]) list[counter] = niladSet[program.charAt(ip)]();
                        if (monadSet[program.charAt(ip)]) list[counter] = monadSet[program.charAt(ip)](list[counter]);
                        if (diyadSet[program.charAt(ip)]) list[counter] = diyadSet[program.charAt(ip)](list[counter], list[counter]);
                        a = temp;
                    }
                    return a;
                }
            };
            done = false;
            var result = "",
                info = "";
            cmdStore = [10, 16, 100, 256];
            mode = false;
            list = [];
            if (d(arg1)) {
                list = (arg1.toString().includes(",") ?
                    (n(arg1.toString().split(",")[0]) ?
                        arg1.toString().split(",")
                        : arg1.toString().split(",").map(Number))
                    : []
                );
            }
            reset();
            ip = 0;
            program = program.replace(/\s+(?=([^"]*"[^"]*")*[^"]*$)/g, '');
            program = program.replace(/\t+(?=([^"]*"[^"]*")*[^"]*$)/g, '');
            program = program.replace(/\n+(?=([^"]*"[^"]*")*[^"]*$)/g, '');
            maxLoop = 0;
            if (debug) {
                if (!d(arg1) && !d(arg2)) result += `> debugging program ${program}\n> args = none\n`;
                else if (!d(arg1) && d(arg2)) result += `> debugging program ${program}\n> args = ${arg2}\n`;
                else if (d(arg1) && !d(arg2)) result += `> debugging program ${program}\n> args = ${arg1}\n`;
                else result += `> debugging program ${program}\n> args = ${arg1} ${arg2}\n`;
            }
            for (ip = 0; ip < program.length; ip++) {
                if (done) break;
                c = program.charAt(ip);
                if (debug) {
                    info = `|\t\t${ip} (${c}): `;
                    if (!n(p(c)) && !n(program[ip])) {
                        if (!n(p(program[ip - 1])) && !n(a)) {
                            a *= 10;
                            a += p(program[ip]);
                        }
                        else a = p(c);
                    }
                    parse(c);
                    info += `${a = !d(a) ? "" : a};${b = !d(b) ? "" : b} [${list}] {${cmdStore}}`;
                    if (ip != program.length) result += `${info}\n`;
                    if (maxLoop >= 999) {
                        niladSet[';']();
                        result += "> loop stopped at 1000 cycles\n";
                    }
                }
                else {
                    if (!n(p(c)) && !n(program[ip])) {
                        if (!n(p(program[ip - 1])) && !n(a)) {
                            a *= 10;
                            a += p(program[ip]);
                        }
                        else a = p(c);
                    }
                    parse(c);
                    if (maxLoop >= 999) niladSet[';']();
                }
            }
            if (!d(a)) a = 0;
            if (!done) result += `${a}`;
            if (!done && debug) result += "\n< end";
            return result.replace(/( |{|,)\n( |{|,)/g, "\\n");
        }
        catch (e) {
            var catchedError;
            return catchedError = debug ? `Error with program at ip = ${ip}\n${tS(e)}` : `Error with program at ip = ${ip}`;
        }
    }
});
