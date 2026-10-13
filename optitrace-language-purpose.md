# OptiTrace Language --- Purpose and Design Brief

> **Status:** Initial proposal\
> **Project:** OptiTrace\
> **Implementation language:** TypeScript\
> **Paradigm:** Procedural / declarative; **not object-oriented**\
> **Time constraint:** One-day prototype

## 1. What are we building?

OptiTrace will have a small, purpose-built language: a **domain-specific
language (DSL)** designed to express OptiTrace tasks clearly and
consistently.

Instead of asking users to write general-purpose TypeScript or configure
every operation through a complicated UI, the language will give them a
compact way to describe what they want OptiTrace to do. A
TypeScript-based interpreter will read that language, validate it, and
translate it into actions supported by OptiTrace.

The exact commands and runtime behavior should follow the real OptiTrace
feature set. The syntax examples in this document are illustrative
starting points, not a finalized specification.

## 2. Why does OptiTrace need its own language?

A custom language is worth building only if it makes a recurring
OptiTrace task easier than the existing alternatives. It should not
exist just because creating a language is interesting.

A dedicated DSL can help OptiTrace by:

-   **Making intent readable:** Users can express a task in terms of
    OptiTrace concepts instead of low-level implementation details.
-   **Reducing repetitive setup:** Common workflows can be described
    with short, reusable instructions.
-   **Making configuration consistent:** The same syntax and rules can
    be used across a project.
-   **Providing useful errors:** The interpreter can point out invalid
    commands, missing values, and unsupported operations before
    execution.
-   **Supporting automation:** Text-based instructions can be saved,
    reviewed, version-controlled, and run again.
-   **Creating a focused interface:** Users only need to learn the
    concepts that matter to OptiTrace, rather than an entire
    general-purpose programming language.

These are goals to validate, not benefits we should claim before the
prototype demonstrates them.

## 3. What does the language do?

At a high level, a program written in the OptiTrace language should pass
through this pipeline:

1.  **Read** the source text.
2.  **Tokenize** the text into meaningful pieces such as keywords,
    names, strings, numbers, and punctuation.
3.  **Parse** those tokens into a structured representation.
4.  **Validate** syntax and meaning, including required arguments and
    supported operations.
5.  **Execute or interpret** the valid program using OptiTrace
    functionality.
6.  **Report** results and helpful errors in a predictable format.

For the first prototype, these stages can be small and deliberately
limited. We do not need a compiler, bytecode, a virtual machine, or a
large standard library on day one.

## 4. Who would use it, and why?

The most likely users depend on what OptiTrace ultimately does.
Potential audiences include:

-   **OptiTrace users** who want a concise way to describe common tasks.
-   **Developers** who need repeatable, reviewable workflows.
-   **Teams** that want shared configuration rather than scattered
    manual steps.
-   **Advanced users** who want to automate supported OptiTrace
    operations.

A custom language is less useful if every user must learn a new syntax
for a task that is already simple in the UI. We should prioritize
workflows that are frequent, repetitive, error-prone, or difficult to
express through existing controls.

## 5. Why not just use TypeScript?

TypeScript is the implementation language for the interpreter; it does
not have to be the language that OptiTrace users write.

Keeping those roles separate gives us two advantages:

-   **TypeScript builds the machinery:** tokenization, parsing,
    validation, execution, and integration with the application.
-   **The OptiTrace language describes the task:** a smaller,
    domain-focused syntax with fewer concepts and stricter rules.

For example, a user-facing language might eventually support a short
instruction such as:

``` text
# Illustrative syntax only — not finalized
trace "checkout"
show summary
```

The TypeScript implementation would decide what `trace` and `show` mean,
which arguments are valid, and what application functions to call. These
example commands must be replaced or confirmed once OptiTrace's actual
domain and features are defined.

## 6. The language will not be object-oriented

The language will **not use object-oriented programming as its
user-facing paradigm**. There will be no user-defined classes,
inheritance, constructors, or `this`-based method calls in the initial
design.

Instead, the language should favor a small set of concepts:

-   **Commands** that perform a specific supported action.
-   **Values** such as strings, numbers, booleans, and lists where
    needed.
-   **Named options or arguments** when a command needs extra
    information.
-   **Variables**, only if they provide clear value for real workflows.
-   **Conditions and repetition**, only if the first use cases genuinely
    need them.
-   **Readable output and errors** so users can understand what
    happened.

The implementation inside TypeScript may use interfaces, types,
functions, and internal data structures where useful. The
non-object-oriented requirement applies to the **language's design and
user-facing syntax**, not to a prohibition on TypeScript's internal
implementation techniques.

## 7. Design principles

The language should follow these principles from the beginning:

1.  **Readable before clever.** A new user should be able to infer what
    a short program does.
2.  **Small before powerful.** Add a feature only when a real use case
    needs it.
3.  **Explicit behavior.** Commands should not perform surprising or
    hidden actions.
4.  **Helpful errors.** Explain what is wrong and, where possible, how
    to fix it.
5.  **Predictable execution.** The same input and context should produce
    consistent behavior.
6.  **Safe by default.** Validate input and restrict execution to
    operations intentionally exposed by OptiTrace. Never evaluate
    arbitrary source text as JavaScript.
7.  **Easy to test.** Tokenization, parsing, validation, and execution
    should be testable independently.
8.  **Room to grow.** Keep the grammar and runtime organized without
    building unnecessary infrastructure.

## 8. One-day MVP: what we should actually build

The first day should produce a working vertical slice, not a complete
programming language.

### Minimum scope

-   A documented, tiny grammar.
-   A tokenizer (lexer).
-   A parser for the selected syntax.
-   A small structured representation of parsed commands.
-   Basic syntax and argument validation.
-   An interpreter for a few real OptiTrace operations.
-   Clear error messages, including a location in the source when
    practical.
-   Tests for valid programs, invalid syntax, and invalid arguments.
-   A small example program that demonstrates the complete flow.

### Explicitly out of scope for day one

Unless the core use case requires them, defer:

-   Classes, inheritance, and object-oriented syntax.
-   A full type system.
-   User-defined functions and modules.
-   Complex scope rules and closures.
-   A package manager or external plugin ecosystem.
-   A bytecode compiler or virtual machine.
-   Arbitrary JavaScript execution.
-   Premature optimization.

A narrow language that reliably completes one useful task is a better
first result than a broad language that only parses impressive-looking
examples.

## 9. Suggested implementation layout

A simple TypeScript structure could look like this:

``` text
src/
  language/
    tokens.ts       # Token kinds and token types
    lexer.ts        # Source text -> tokens
    ast.ts          # Parsed program types
    parser.ts       # Tokens -> structured program
    validate.ts     # Semantic and argument checks
    interpreter.ts  # Execute supported commands
    errors.ts       # Consistent language errors
    index.ts        # Public entry point
  ...
tests/
  language/
    lexer.test.ts
    parser.test.ts
    interpreter.test.ts
```

This is a suggested starting layout, not a requirement to create every
file before the first test. If time is tight, begin with the smallest
files that support one end-to-end example and split them as the
implementation grows.

## 10. How we will know it is useful

The prototype should answer these questions:

-   Can a user express a real OptiTrace task with fewer steps or less
    ambiguity?
-   Can the interpreter reject invalid input without crashing?
-   Are error messages clear enough to help the user correct a program?
-   Can we test the behavior without running the entire application?
-   Is the custom syntax genuinely easier for the intended user than a
    UI form or a TypeScript script?

If the answer to these questions is no, we should revise the language or
reconsider whether a custom DSL is the right interface.

## 11. Decisions to settle before implementation

Before writing the lexer, confirm:

1.  **The domain:** What concrete OptiTrace operation will the language
    control?
2.  **The first user:** Who is expected to write these programs?
3.  **The first three commands:** Which useful operations must the MVP
    support?
4.  **The execution model:** Will programs run locally, on a server, or
    only inside the application?
5.  **The input/output contract:** What data can commands receive, and
    how will results be shown?

These decisions determine the grammar. We should not finalize keywords
or syntax before we know what the language must express.

## 12. Final direction

The goal is not to build a general-purpose competitor to TypeScript,
Python, or JavaScript. The goal is to build a **small,
non-object-oriented language that makes meaningful OptiTrace workflows
easier to describe, validate, and repeat**.

We will start with one real use case, define the smallest useful syntax,
and implement the full path from source text to a working OptiTrace
action. Everything else can wait until the first slice works.


OTL Language Reference

OTL (OptiTrace Language) is the small procedural language used by OptiTrace. Programs are lexed, parsed into an AST, converted to IR, and then run through the optimization passes.

Quick facts: file extension .otl · case-sensitive · statements end with ; · whitespace is ignored · // line comments · no strings, loops, or functions.

Contents: Example · Statements · Expressions · Lexical rules · Errors · Common mistakes

Example
let base = 6;
let scale = 7;
let total = base * scale;

if (total > 40) {
  print (total);
} else {
  print (0);
}

After constant propagation and folding, total becomes 42 and the computation disappears:

let x = 6;          let z = 42;
let y = 7;
let z = x * y;
Statements
Statement	Syntax	Notes
Declaration	let name = expr;	
Assignment	name = expr;	
Print	print (expr);	parentheses required
If	if (expr) { ... }	braces required
If / else	if (expr) { ... } else { ... }	
Else if	if (a) { ... } else if (b) { ... } else { ... }	chains; final else optional
Block	{ ... }	can nest

Expression-only statements such as x + 1; are not allowed.

<details> <summary>Grammar</summary>
program      := statement* EOF
statement    := let_stmt | assign_stmt | print_stmt | if_stmt | block

let_stmt     := "let" IDENT "=" expr ";"
assign_stmt  := IDENT "=" expr ";"
print_stmt   := "print" "(" expr ")" ";"
if_stmt      := "if" "(" expr ")" block ( "else" ( if_stmt | block ) )?
block        := "{" statement* "}"

expr         := equality
equality     := comparison ( ("==" | "!=") comparison )*
comparison   := term ( ("<" | ">" | "<=" | ">=") term )*
term         := factor ( ("+" | "-") factor )*
factor       := unary ( ("*" | "/" | "%") unary )*
unary        := ("-" | "!") unary | primary
primary      := NUMBER | "true" | "false" | IDENT | "(" expr ")"
</details>
Expressions

Operator precedence (lowest to highest):

Level	Operators	Associativity
1	== !=	left
2	< > <= >=	left
3	+ -	left
4	* / %	left
5	- ! (prefix)	right
6	number, true, false, name, ( expr )	

Grouping examples:

1 + 2 * 3        ->  1 + (2 * 3)
10 - 4 - 3       ->  (10 - 4) - 3
-2 * 3           ->  (-2) * 3
a == b < c       ->  a == (b < c)
a < b < c        ->  (a < b) < c     (not a range check)

Literals: 42, 3.14, true, false

Lexical rules
<details> <summary>Keywords, identifiers, numbers, operators</summary>

Keywords (lowercase only): let print if else true false

Identifiers: [A-Za-z_][A-Za-z0-9_]*, case-sensitive.

Numbers: integers (42) and decimals (3.14). A decimal needs a digit after the dot, so 7. and .5 are errors. There are no negative literals: -5 is unary minus applied to 5. Numbers are 64-bit floats.

Operators and punctuation:

Symbol	Meaning	Symbol	Meaning
+ - * / %	arithmetic	== !=	equality
< > <= >=	comparison	!	logical not
=	assignment	;	statement end
( )	grouping	{ }	blocks

Comments: // to end of line. Block comments /* */ are not supported.

Whitespace: space, tab, carriage return, newline.

Invalid characters: anything not listed above, including &, | (no logical and/or operators), quotes (no strings), , : . [ ] ? @ # $ ^ ~ \.

</details>
Errors

Lexer errors stop at the first bad character; parser errors stop at the first problem. Both report a 1-based line and column.

Unexpected character '@' at line 3, column 5.
Expected ';' after the variable declaration. At line 4, column 1.

A missing ; is reported at the next token, so the line number may point one line below the actual mistake.

<details> <summary>All parser error messages</summary>
Situation	Message
Bad start of statement	Expected a statement: let, print, if, a block, or an assignment.
let without a name	Expected a variable name after 'let'.
let x 5;	Expected '=' after the variable name.
Missing ; after let	Expected ';' after the variable declaration.
Missing ; after assignment	Expected ';' after the assignment.
print x;	Expected '(' after 'print'.
Missing ) in print	Expected ')' after the print expression.
Missing ; after print	Expected ';' after the print statement.
if x {	Expected '(' after 'if'.
Missing ) in if	Expected ')' after the if condition.
No { after if	Expected '{' before the if body.
No { after else	Expected '{' before the else body.
Unclosed block	Expected '}' after the block.
Missing ) in grouping	Expected ')' after the expression.
No expression found	Expected an expression: a number, boolean, variable, or parenthesized expression.
Number too large	Number is outside the supported range.
</details>
Common mistakes
Mistake	Why it fails
print x;	print needs parentheses: print (x);
if (a > b) print (a);	braces are required
if a > b { ... }	the condition needs parentheses
x + 1;	expression statements are not allowed
let s = "hi";	there are no strings
if (a && b)	there are no logical and/or operators
let x = 5.;	a decimal needs a digit after the dot
Let x = 1;	keywords are lowercase
/* note */	only // comments exist


