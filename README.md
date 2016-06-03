### nock.js

Nock is a combinator interpreter on nouns. A noun is an atom or a cell.
An atom is an unsigned integer of any size; a cell is an ordered pair of nouns.

[Nock](//urbit.org/docs/nock/definition/) is the foundational layer of [Urbit](//urbit.org/posts/overview/).

`nock.js` is a toy interpreter, built for the fun of it.

#### usage

- install from npm: `npm install nock.js`

```js
var nock = require('nock.js')
nock.nock(1, [0, 1])
// => 1
```

- or, clone and run

```sh
git clone https://github.com/joemfb/nock.js.git
cd nock.js
node example.js
```

- run unit tests

```sh
npm install
npm test
```

- load it in the browser (`nock.js` is a UMD module):

```html
<script src="./nock.js"></script>
<script>
  nock.nock(1, [0, 1])
  // => 1
</script>
```

#### methods

*See [urbit.org/docs/nock/definition](//urbit.org/docs/nock/definition/) for an explanation of the pseudocode reduction rules that make up the Nock spec.*

##### nock

```
nock(a)          *a
[a b c]          [a [b c]]
*[a [b c] d]     [*[a b c] *[a d]]
*a               *a
```

`nock()` recursively applies formulas (tail of its argument) to the subject (head of its argument).

```js
nock.nock(1, [0, 1])
// 1
```

Nock nouns are always atoms (unsigned integers) or cells (a pair of nouns). The JS analogue to a cell is `Array(2)`, so `nock()` converts `Array` arguments into nouns, associating right:

```js
nock.nock([1, 2, 3], [0, 1])
// [1,[2,3]]
```

The subject can be omitted if the formula doesn't reference it:

```js
nock.nock([1, 1])
// 1
```

*Formulas without a subject are evaluated against `[1, 0]`, which is Hoon null (`~`).*

For convenience in evaluating generated formulas, arguments can be passed as strings (see [**generating formulas**](#generating-formulas) below):

```js
nock.nock("[1 2 3]", "[0 1]")
// [1,[2,3]]
```

##### operators

Nock defines four operators:

```
?[a b]           0
?a               1
+[a b]           +[a b]
+a               1 + a
=[a a]           0
=[a b]           1
=a               =a

/[1 a]           a
/[2 a b]         a
/[3 a b]         b
/[(a + a) b]     /[2 /[a b]]
/[(a + a + 1) b] /[3 /[a b]]
/a               /a
```

- *wut* (?): test for an atom (1) or cell (0)
- *lus* (+): increment an atom
- *tis* (=): test equality
- *fas* (/): resolve a tree address

_See [urbit.org/docs/hoon/syntax](//urbit.org/docs/hoon/syntax/#-glyphs-and-characters) for an explanation of the the method names_

Operators are exported in the `nock.operators` namespace:

```js
nock.operators.fas(2, [5, 9])
// 5
```

Unlike `nock()`, operators require both arguments to be present and valid nouns.

##### formulas

Nock defines 6 primitive formulas:

```
*[a 0 b]         /[b a]
*[a 1 b]         b
*[a 2 b c]       *[*[a b] *[a c]]
*[a 3 b]         ?*[a b]
*[a 4 b]         +*[a b]
*[a 5 b]         =*[a b]
```

- *slot* (0): resolve a tree address
- *constant* (1): return the formula regardless of subject
- *evaluate* (2): evaluate the product of second formula against the product of the first
- *cell* (3): test if the product is a cell
- *incr* (4): increment the product
- *eq* (5): test for equality between nouns in the product

And five additional formulas, reducible to the 6 above:

```
*[a 6 b c d]     *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
*[a 7 b c]       *[a 2 b 1 c]
*[a 8 b c]       *[a 7 [[7 [0 1] b] 0 1] c]
*[a 9 b c]       *[a 7 c 2 [0 1] 0 b]
*[a 10 [b c] d]  *[a 8 c 7 [0 3] d]
*[a 10 b c]      *[a c]
```

- *ife* (6): if/then/else
- *compose* (7): evaluate formulas composed left-to-right
- *extend* (8): evaluate the second formula against [product of first, subject]
- *invoke* (9): construct a core and evaluate one of it's arms against it
- *hint* (10): skip first formula, evaluate second

Formulas are exported in the `nock.formulas` namespace:

```js
nock.nock(2, [8, [[4, [1, 1]], [0, 1]]])
// [2, 2]
nock.formulas.eq(2, [8, [[4, [1, 1]], [0, 1]]])
// 0
```

As in the case of `nock.operators`, formulas require both arguments to be present and valid nouns.

Formulas 6-10 are implemented in two ways: directly by the interpreter, and as evaluated macro expansions:

```js
nock.formulas.extend(42, [[4, [0, 1]], [0, 1]])
// [43, 42]
nock.formulas.macroExtend(42, [[4, [0, 1]], [0, 1]])
// [43, 42]
```

By default, the direct implementations are used. To use the macro expansions instead:

```js
nock.useMacros()
nock.nock(42, [8, [[4, [0, 1]], [0, 1]]])
// [43, 42]
```

#### generating formulas

Hoon, the native language of Urbit, is also the language of [`dojo`](//urbit.org/docs/using/shell/), the Urbit shell. Hoon expressions are compiled into Nock formulas, which are interpreted.

```
~novlen-hanweb:dojo> 1
1
```

Hoon -> Nock compilation is a first class primitive in Hoon *([`:code` or `!=`](//urbit.org/docs/hoon/twig/zap-wild/tis-code/))*:

```
~novlen-hanweb:dojo> !=(1)
[1 1]
```

as is the Nock formula itself *([`:nock` or `.*`](//urbit.org/docs/hoon/twig/dot-nock/tar-nock/))*:

```
~novlen-hanweb:dojo> .*(~ [1 1])
1
~novlen-hanweb:dojo> .*(~ !=(1))
1
```

As previously noted, `nock()` can evaluate formulas passed as strings:

```js
nock.nock('[1 1]')
// => 1
```

For convenience, convert your Nock formula to a string directly in `dojo` (technically, print your `noun` to a `tape`):

```
~novlen-hanweb:dojo> <!=(1)>
"[1 1]"
```

#### generating `decrement`

Hoon provides a decrement function in it's standard library:

```
~novlen-hanweb:dojo> (dec 10)
9
```

The implemention for `dec` is in a [`core`](//urbit.org/docs/hoon/basic/#-core-p-span-q-map-term-span) - compiling it to Nock results in a formula that references that `core`, not a standalone decrement implementation:

```
~novlen-hanweb:dojo> !=((dec 10))
[8 [9 24.834.031 0 31] 9 2 [0 4] [7 [0 3] 1 10] 0 11]
```

There's probably a way to de-reference that `core` address *(`24.834.031`)* and compile the implementation - but I don't know it... Instead, we can evaluate the standard-library decrement implementation directly:

```
++  dec                                                 ::  decrement
  ~/  %dec
  |=  a/@
  ~|  %decrement-underflow
  ?<  =(0 a)
  =+  b=0
  |-  ^-  @
  ?:  =(a +(b))  b
  $(b +(b))
```

*from [urbit.org/docs/hoon/library/1a/#-dec](//urbit.org/docs/hoon/library/1a/#-dec)*

Converting the linked implementation from [tall-form to flat-form](//urbit.org/docs/hoon/syntax/#-tall-and-flat-forms) (and removing the `hint` instructions) results in this expression:

```
|=(a/@ ?<(=(0 a) =+(b=0 |-(^-(@ ?:(=(a +(b)) b $(b +(b))))))))
```

which we can evaluate:

```
~novlen-hanweb:dojo> (|=(a/@ ?<(=(0 a) =+(b=0 |-(^-(@ ?:(=(a +(b)) b $(b +(b)))))))) 10)
9
```

compile to Nock (with `!=`):

```
~novlen-hanweb:dojo> !=((|=(a/@ ?<(=(0 a) =+(b=0 |-(^-(@ ?:(=(a +(b)) b $(b +(b)))))))) 10))
[ 8
  [8 [1 0] [1 6 [5 [1 0] 0 6] [0 0] 8 [1 0] 8 [1 6 [5 [0 30] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1] 0 1]
  9
  2
  [0 4]
  [7 [0 3] 1 10]
  0
  11
]
```

evaluate the compiled Nock (with `.*`):

```
~novlen-hanweb:dojo> .*(~ !=((|=(a/@ ?<(=(0 a) =+(b=0 |-(^-(@ ?:(=(a +(b)) b $(b +(b)))))))) 10)))
9
```

print to a `tape` (with `<...>`):

```
~novlen-hanweb:dojo> <!=((|=(a/@ ?<(=(0 a) =+(b=0 |-(^-(@ ?:(=(a +(b)) b $(b +(b)))))))) 10))>
"[8 [8 [1 0] [1 6 [5 [1 0] 0 6] [0 0] 8 [1 0] 8 [1 6 [5 [0 30] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1] 0 1] 9 2 [0 4] [7 [0 3] 1 10] 0 11]"
```

and, _**finally**_, evaluate in `nock.js`:

```js
nock.nock("[8 [8 [1 0] [1 6 [5 [1 0] 0 6] [0 0] 8 [1 0] 8 [1 6 [5 [0 30] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1] 0 1] 9 2 [0 4] [7 [0 3] 1 10] 0 11]")
// 9
```

To get up and and running with an urbit, see [github.com/urbit/urbit](//github.com/urbit/urbit) and [urbit.org/docs/using/install](//urbit.org/docs/using/install/).
