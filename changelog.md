**v3.2**
* `{` atom's alternate function prompts the user for input. This works like stdin and uses Window.prompt.
* **v3.2.1**
  * Quick fixes for `O` and `o` atoms to not use b when it is a non integer.
  * `Y` and `y` now use the Array.reduce function.
  * `Y` will still result in `NaN` if a or the list is non-numeric.
  * Interpreter now has a link to mikron's Github.

**v3.1**
* `!` and `?` atoms have had their functional mechanisms removed. They are only used for working with the storing array.

**v3.0**
* Diyads and monads work much more correctly with literals
* Changed the engine for running programs from direct reading to lexing and an atom list
* Source has been refactored more
* `q` atom has been changed from getting source code to enqueue
* `,` atom has a alt function to dequeue
* Errors show the atom that errors out and the number of the atom (0-indexed)
---
**v2.0**
* Diyads now work with strings, characters, and multidigit numbers
* `@` atom now swaps variables
* `g` atom now pushes `[1, 2, ... , length(a)]` to the list
* Source code is now much more readable and polished
* More refactoring may come in the future
---
**v1.1**
* Added `Vd`, `Vm`, and `Vy` atoms
* `Vd` gets the current day of the month
* `Vm` gets the current month as a number from 0 to 11 and `bVm` gets the month as a string
* `Vy` gets the current year

**v1.0**
* Initial polished release.
* All versions after this one are using the following versioning scheme: `major.minor.fixes`