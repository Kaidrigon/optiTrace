OptiTrace Regression Test Log
Project: OptiTrace Compiler Optimization Platform
API endpoint: POST /api/compile
Scope: Tests already executed during the current regression session
Test Summary
ID	Test	Result
T01	Constant propagation, folding, and dead-code elimination together	PASS
T02	Constant propagation disabled	PASS
T03	Dead-code elimination disabled	PASS
T04	Constant folding disabled	PASS
T05	Undefined variable error handling	PASS
T06	Division-by-zero error handling	PASS
T07	Invalid syntax error handling	PASS
T08	Output equivalence with optimizations enabled/disabled	PASS
T09	Unsupported logical AND (&&) rejected cleanly	EXPECTED LIMITATION
T10	Nested arithmetic, comparison, and branch elimination	PASS
T11	Scope-aware variable shadowing	PASS
T12	Unused declarations in nested scopes	PASS
T13	Constant-false branch elimination	PASS
T14	Constant-true branch elimination	PASS
T15	Nested scopes with unused declarations	PASS
T16	Empty blocks retained	PASS — intentional current behavior


Detailed Test Cases
T01 — Combined optimizations
Input
let a = 2;
let b = 3;
let c = a + b;
if (c == 5) {
    print(1);
} else {
    print(99);
}
print(7);
Options: Constant propagation ON, constant folding ON, dead-code elimination ON
Expected and observed output: 1, then 7
Result: PASS — constants were propagated and folded, the unreachable branch was removed, and unused declarations were eliminated.
T02 — Constant propagation disabled
Input: Same program as T01.
Options: Constant propagation OFF, constant folding ON, dead-code elimination ON
Observed output: 1, then 7
Observed behavior: Declarations and the print(99) branch remained; no optimization stages were recorded.
Result: PASS — disabled option respected.
T03 — Dead-code elimination disabled
Input: Same program as T01.
Options: Constant propagation ON, constant folding ON, dead-code elimination OFF
Observed output: 1, then 7
Observed behavior: Constant expressions were simplified, but the else branch and declarations remained.
Result: PASS — disabled option respected.
T04 — Constant folding disabled
Input
let a = 2;
let b = 3;
let c = a + b;
print(c);
Options: Constant propagation ON, constant folding OFF, dead-code elimination ON
Expected and observed output: 5
Observed optimized IR
let c = (2 + 3);
print(c);
Result: PASS — constant folding stayed disabled while propagation and dead-code elimination still operated.
T05 — Undefined variable
Input
print(missing);
Observed error
Undefined variable 'missing'. At line 1, column 7.
Result: PASS — compilation and both executions failed cleanly; no IR or optimization stages were produced.
T06 — Division by zero
Input
let a = 10;
let b = 0;
print(a / b);
Observed error
Division by zero. At line 3, column 9.
Result: PASS — the error was reported, with no IR or optimization stages produced.
T07 — Invalid syntax
Input
let a = ;
print(a);
Observed error
Expected an expression: a number, boolean, variable, or parenthesized expression. At line 1, column 9.
Result: PASS — malformed syntax was rejected with a line and column.
T08 — Output equivalence across optimization settings
Input
let a = 4;
let b = 6;
let c = a * b + 2;
if (c > 20) {
    print(c);
} else {
    print(0);
}
Comparison
- All optimizations OFF: output 26
- All optimizations ON: output 26
Result: PASS — both outputs matched.
T09 — Unsupported logical AND operator
Input
let a = 3;
let b = 4;
let result = (a + b) * 2;
if (result == 14 && true) {
    print(result);
} else {
    print(0);
}
Observed error
Unexpected character '&' at line 4, column 18.
Result: EXPECTED LIMITATION — && is not supported by the current language grammar. This is not an optimizer regression.
T10 — Nested arithmetic and comparison
Input
let a = 3;
let b = 4;
let result = (a + b) * 2;
if (result == 14) {
    print(result);
} else {
    print(0);
}
Expected and observed output: 14
Recorded optimization changes: 11
Observed optimized IR
{
  print(14);
}
Result: PASS — nested arithmetic folded to 14, the comparison became true, the else branch was removed, and unused declarations were eliminated. The remaining block is intentionally retained.
T11 — Scope-aware variable shadowing
Input
let x = 10;
{
    let x = 20;
    print(x);
}
print(x);
Expected and observed output: 20, then 10
Result: PASS — inner and outer x values remained distinct.
T12 — Unused declaration in a nested scope
Input
let x = 10;
{
    let x = 20;
}
print(x);
Expected and observed output: 10
Result: PASS — the unused inner declaration was removed without changing the outer value.
T13 — Constant-false branch
Input
if (false) {
    print(99);
}
print(7);
Expected and observed output: 7
Observed optimized IR
print(7);
Result: PASS — the unreachable branch was removed.
T14 — Constant-true branch
Input
if (true) {
    print(5);
} else {
    print(99);
}
print(7);
Expected and observed output: 5, then 7
Result: PASS — the unreachable else branch was removed.
T15 — Nested scopes and unused declarations
Input
let x = 10;
{
    let y = 20;
    {
        let z = 30;
    }
    print(x);
}
print(x);
Expected and observed output: 10, then 10
Observed optimized IR
{
  {
  }
  print(10);
}
print(10);
Result: PASS — unused declarations were removed while preserving scope behavior. Empty blocks remain intentionally.
T16 — Empty blocks
Input
{
}
{
    {
    }
}
print(7);
Expected and observed output: 7
Observed behavior: Empty blocks remained in the IR; no optimization stages were recorded.
Result: PASS — this matches the current project scope because empty-block elimination is not planned yet.
Current Scope Notes
- Logical AND (&&) is not supported by the current grammar.
- Reassignment-based dead-assignment elimination has not been established as a supported feature and is outside this test log.
- Empty-block elimination is intentionally not implemented.
- A nonzero division/modulo regression test was proposed but has not yet been run, so it is not marked as passed here.
Overall
16 test cases recorded. The cases above passed for the tested behavior, with T09 documenting an expected grammar limitation. No code changes were required based on these results.