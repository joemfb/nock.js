##### nock.js

Nock is a combinator interpreter on nouns. A noun is an atom or a cell.
An atom is an unsigned integer of any size; a cell is an ordered pair of nouns.

Nock is the foundational layer of the Urbit platform: http://urbit.org/docs/theory/whitepaper#-nock

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

See `example.js` or `test.js` for detailed examples

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

See http://urbit.org/docs/theory/whitepaper#-syntax-text for an explanation of the naming convention

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
- *evaluate* (2): apply the product of second formula to the product of the first
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
- *extend* (8): evaluate the product of the first formula against the second
- *invoke* (9): evaluate formulas composed right-to-left
- *hint* (10): skip first formula, evaluate second
