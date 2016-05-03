#### nock.js

Nock is a combinator interpreter on nouns. A noun is an atom or a cell.
An atom is an unsigned integer of any size; a cell is an ordered pair of nouns.

Nock is the foundational layer of the Urbit platform: http://urbit.org/docs/theory/whitepaper#-nock.

nock.js is a toy Nock interpreter, built for the fun of it.

##### usage

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

- unit tests

```sh
npm install
npm test
```

##### methods

See `example.js` or `test.js` for detailed examples.

###### nock

```
nock(a)          *a
[a b c]          [a [b c]]
*[a [b c] d]     [*[a b c] *[a d]]
*a               *a
```

`nock()` recursively applies formulas (tail of its argument) to the subject (head of its argument).

###### operators

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

See http://urbit.org/docs/theory/whitepaper#-syntax-text for an explanation of the naming convention.

###### formulas

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

##### generating formulas

Hoon, the native language of Urbit, is also the language of `dojo`, the Urbit shell. Hoon expressions are compiled into Nock formulas, which are interpreted.

```
~novlen-hanweb:dojo> 1
1
```

Compilation is a first class primitive in Hoon (`!=`):

```
~novlen-hanweb:dojo> !=(1)
[1 1]
```

As is the Nock formula itself (`.*`):

```
~novlen-hanweb:dojo> .*(. !=(1))
1
```

nock.js evaluates abitrary compiled Nock formulas; just pass them as a string:

```js
var nock = require('nock.js')
nock.nock('[1 1]')
// => 1
```

string formulas are evaluated against the default subject `[0, 1]` (`.` in Hoon):

```
~novlen-hanweb:dojo> !=(.)
[0 1]
```

For convenience, convert your Nock formula to a string directly in `dojo` (technically, print your `noun` to a `tape`):

```
~novlen-hanweb:dojo> <!=(1)>
"[1 1]"
```

Now, with a more interesting Hoon expression (courtesy of `~fyr` in `~doznec/urbit-meta`; see [`:talk`](http://urbit.org/docs/user/talk):

```
~novlen-hanweb:dojo> =+([a="abc" b="cde"] |-(?~(a b [i.a $(a t.a)])))
['a' ['b' ['c' ['c' ['d' ['e' ""]]]]]]
```

compiled to Nock,

```
~novlen-hanweb:dojo> !=(=+([a="abc" b="cde"] |-(?~(a b [i.a $(a t.a)]))))
[ 8
  [[7 [0 1] 8 [1 1 97 98 99 0] 9 2 0 1] 7 [0 1] 8 [1 1 99 100 101 0] 9 2 0 1]
  8
  [1 6 [5 [1 0] 0 12] [0 13] [0 24] 9 2 [0 2] [[0 25] 0 13] 0 7]
  9
  2
  0
  1
]
```

evaluated in `dojo`,

```
~novlen-hanweb:dojo> .*(. !=(=+([a="abc" b="cde"] |-(?~(a b [i.a $(a t.a)])))))
[97 98 99 99 100 101 0]
```

printed to a `tape`,

```
~novlen-hanweb:dojo> <.*(. !=(=+([a="abc" b="cde"] |-(?~(a b [i.a $(a t.a)])))))>
"[8 [[7 [0 1] 8 [1 1 97 98 99 0] 9 2 0 1] 7 [0 1] 8 [1 1 99 100 101 0] 9 2 0 1] 8 [1 6 [5 [1 0] 0 12] [0 13] [0 24] 9 2 [0 2] [[0 25] 0 13] 0 7] 9 2 0 1]"
```

and, finally, evaluated in nock.js:

```js
var nock = require('nock.js')
var f = "[8 [[7 [0 1] 8 [1 1 97 98 99 0] 9 2 0 1] 7 [0 1] 8 [1 1 99 100 101 0] 9 2 0 1] 8 [1 6 [5 [1 0] 0 12] [0 13] [0 24] 9 2 [0 2] [[0 25] 0 13] 0 7] 9 2 0 1]"
var p = nock.nock(f)
console.log(JSON.stringify(p))
// => [97,[98,[99,[99,[100,[101,0]]]]]]
```

To get up and and running with an urbit, see [https://github.com/urbit/urbit](https://github.com/urbit/urbit) and [http://urbit.org/docs/user/basic](http://urbit.org/docs/user/basic).
