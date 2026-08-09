/**
 * Exam exercise bank — 42-style examshell pools.
 * Solutions / expected outputs stay server-side; subjects go to the client.
 */

const EXERCISES_PER_LEVEL = 2;

const PUTCHAR_HELPER = `
#include <unistd.h>
void\tft_putchar(char c)
{
\twrite(1, &c, 1);
}
`.trim();

function ex(def) {
  return def;
}

const BANK = {
  ft_putchar: ex({
    id: "ft_putchar",
    name: "ft_putchar",
    filename: "ft_putchar.c",
    allowedFiles: ["ft_putchar.c"],
    subject: `# ft_putchar

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_putchar(char c);
\`\`\`

## Description
Write a function that displays the character passed as a parameter.

## Submission
Submit a file named \`ft_putchar.c\`.
`,
    starter: `void\tft_putchar(char c)
{
\t(void)c;
}
`,
    helpers: [],
    grader: `
void ft_putchar(char c);
int main(void)
{
\tft_putchar('4');
\tft_putchar('2');
\tft_putchar('\\n');
\treturn (0);
}
`,
    expected: "42\n",
  }),

  ft_print_alphabet: ex({
    id: "ft_print_alphabet",
    name: "ft_print_alphabet",
    filename: "ft_print_alphabet.c",
    allowedFiles: ["ft_print_alphabet.c"],
    subject: `# ft_print_alphabet

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_print_alphabet(void);
\`\`\`

## Description
Write a function that displays the alphabet in lowercase, on a single line, in ascending order, starting from \`a\`.

## Submission
\`ft_print_alphabet.c\`
`,
    starter: `void\tft_print_alphabet(void)
{
}
`,
    helpers: [PUTCHAR_HELPER],
    grader: `
void ft_print_alphabet(void);
int main(void)
{
\tft_print_alphabet();
\treturn (0);
}
`,
    expected: "abcdefghijklmnopqrstuvwxyz",
  }),

  ft_print_numbers: ex({
    id: "ft_print_numbers",
    name: "ft_print_numbers",
    filename: "ft_print_numbers.c",
    allowedFiles: ["ft_print_numbers.c"],
    subject: `# ft_print_numbers

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_print_numbers(void);
\`\`\`

## Description
Display all digits, on a single line, in ascending order.

## Submission
\`ft_print_numbers.c\`
`,
    starter: `void\tft_print_numbers(void)
{
}
`,
    helpers: [PUTCHAR_HELPER],
    grader: `
void ft_print_numbers(void);
int main(void)
{
\tft_print_numbers();
\treturn (0);
}
`,
    expected: "0123456789",
  }),

  ft_print_reverse_alphabet: ex({
    id: "ft_print_reverse_alphabet",
    name: "ft_print_reverse_alphabet",
    filename: "ft_print_reverse_alphabet.c",
    allowedFiles: ["ft_print_reverse_alphabet.c"],
    subject: `# ft_print_reverse_alphabet

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_print_reverse_alphabet(void);
\`\`\`

## Description
Display the alphabet in lowercase, on a single line, in descending order, starting from \`z\`.

## Submission
\`ft_print_reverse_alphabet.c\`
`,
    starter: `void\tft_print_reverse_alphabet(void)
{
}
`,
    helpers: [PUTCHAR_HELPER],
    grader: `
void ft_print_reverse_alphabet(void);
int main(void)
{
\tft_print_reverse_alphabet();
\treturn (0);
}
`,
    expected: "zyxwvutsrqponmlkjihgfedcba",
  }),

  ft_is_negative: ex({
    id: "ft_is_negative",
    name: "ft_is_negative",
    filename: "ft_is_negative.c",
    allowedFiles: ["ft_is_negative.c"],
    subject: `# ft_is_negative

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_is_negative(int n);
\`\`\`

## Description
Display \`N\` if the integer is negative, otherwise \`P\`.

## Submission
\`ft_is_negative.c\`
`,
    starter: `void\tft_is_negative(int n)
{
\t(void)n;
}
`,
    helpers: [PUTCHAR_HELPER],
    grader: `
void ft_is_negative(int n);
int main(void)
{
\tft_is_negative(-1);
\tft_is_negative(0);
\tft_is_negative(42);
\treturn (0);
}
`,
    expected: "NPP",
  }),

  ft_print_comb: ex({
    id: "ft_print_comb",
    name: "ft_print_comb",
    filename: "ft_print_comb.c",
    allowedFiles: ["ft_print_comb.c"],
    subject: `# ft_print_comb

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_print_comb(void);
\`\`\`

## Description
Display all different combinations of 3 different digits in ascending order,
separated by \`, \` (comma then space).

Example start: \`012, 013, 014, ...\`

## Submission
\`ft_print_comb.c\`
`,
    starter: `void\tft_print_comb(void)
{
}
`,
    helpers: [PUTCHAR_HELPER],
    grader: `
void ft_print_comb(void);
int main(void)
{
\tft_print_comb();
\treturn (0);
}
`,
    expected:
      "012, 013, 014, 015, 016, 017, 018, 019, 023, 024, 025, 026, 027, 028, 029, 034, 035, 036, 037, 038, 039, 045, 046, 047, 048, 049, 056, 057, 058, 059, 067, 068, 069, 078, 079, 089, 123, 124, 125, 126, 127, 128, 129, 134, 135, 136, 137, 138, 139, 145, 146, 147, 148, 149, 156, 157, 158, 159, 167, 168, 169, 178, 179, 189, 234, 235, 236, 237, 238, 239, 245, 246, 247, 248, 249, 256, 257, 258, 259, 267, 268, 269, 278, 279, 289, 345, 346, 347, 348, 349, 356, 357, 358, 359, 367, 368, 369, 378, 379, 389, 456, 457, 458, 459, 467, 468, 469, 478, 479, 489, 567, 568, 569, 578, 579, 589, 678, 679, 689, 789",
  }),

  ft_strlen: ex({
    id: "ft_strlen",
    name: "ft_strlen",
    filename: "ft_strlen.c",
    allowedFiles: ["ft_strlen.c"],
    subject: `# ft_strlen

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_strlen(char *str);
\`\`\`

## Description
Return the length of the string (not counting the terminating \`\\0\`).

## Submission
\`ft_strlen.c\`
`,
    starter: `int\tft_strlen(char *str)
{
\t(void)str;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_strlen(char *str);
int main(void)
{
\tprintf("%d\\n", ft_strlen(""));
\tprintf("%d\\n", ft_strlen("42"));
\tprintf("%d\\n", ft_strlen("Poolers"));
\treturn (0);
}
`,
    expected: "0\n2\n7\n",
  }),

  ft_swap: ex({
    id: "ft_swap",
    name: "ft_swap",
    filename: "ft_swap.c",
    allowedFiles: ["ft_swap.c"],
    subject: `# ft_swap

## Allowed functions
None

## Prototype
\`\`\`c
void\tft_swap(int *a, int *b);
\`\`\`

## Description
Swap the values of two integers whose addresses are given.

## Submission
\`ft_swap.c\`
`,
    starter: `void\tft_swap(int *a, int *b)
{
\t(void)a;
\t(void)b;
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
void ft_swap(int *a, int *b);
int main(void)
{
\tint a = 1;
\tint b = 2;
\tft_swap(&a, &b);
\tprintf("%d %d\\n", a, b);
\treturn (0);
}
`,
    expected: "2 1\n",
  }),

  ft_ft: ex({
    id: "ft_ft",
    name: "ft_ft",
    filename: "ft_ft.c",
    allowedFiles: ["ft_ft.c"],
    subject: `# ft_ft

## Allowed functions
None

## Prototype
\`\`\`c
void\tft_ft(int *nbr);
\`\`\`

## Description
Set the integer pointed to by \`nbr\` to \`42\`.

## Submission
\`ft_ft.c\`
`,
    starter: `void\tft_ft(int *nbr)
{
\t(void)nbr;
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
void ft_ft(int *nbr);
int main(void)
{
\tint n = 0;
\tft_ft(&n);
\tprintf("%d\\n", n);
\treturn (0);
}
`,
    expected: "42\n",
  }),

  ft_strcpy: ex({
    id: "ft_strcpy",
    name: "ft_strcpy",
    filename: "ft_strcpy.c",
    allowedFiles: ["ft_strcpy.c"],
    subject: `# ft_strcpy

## Allowed functions
None

## Prototype
\`\`\`c
char\t*ft_strcpy(char *dest, char *src);
\`\`\`

## Description
Copy the string \`src\` into \`dest\` (including the terminating null). Return \`dest\`.

## Submission
\`ft_strcpy.c\`
`,
    starter: `char\t*ft_strcpy(char *dest, char *src)
{
\t(void)src;
\treturn (dest);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
char *ft_strcpy(char *dest, char *src);
int main(void)
{
\tchar buf[32];
\tprintf("%s\\n", ft_strcpy(buf, "exam"));
\tprintf("%s\\n", buf);
\treturn (0);
}
`,
    expected: "exam\nexam\n",
  }),

  ft_strcmp: ex({
    id: "ft_strcmp",
    name: "ft_strcmp",
    filename: "ft_strcmp.c",
    allowedFiles: ["ft_strcmp.c"],
    subject: `# ft_strcmp

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_strcmp(char *s1, char *s2);
\`\`\`

## Description
Reproduce the behavior of \`strcmp\`.

## Submission
\`ft_strcmp.c\`
`,
    starter: `int\tft_strcmp(char *s1, char *s2)
{
\t(void)s1;
\t(void)s2;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_strcmp(char *s1, char *s2);
int main(void)
{
\tprintf("%d\\n", ft_strcmp("abc", "abc") == 0);
\tprintf("%d\\n", ft_strcmp("abc", "abd") < 0);
\tprintf("%d\\n", ft_strcmp("abd", "abc") > 0);
\tprintf("%d\\n", ft_strcmp("", "") == 0);
\treturn (0);
}
`,
    expected: "1\n1\n1\n1\n",
  }),

  ft_strcat: ex({
    id: "ft_strcat",
    name: "ft_strcat",
    filename: "ft_strcat.c",
    allowedFiles: ["ft_strcat.c"],
    subject: `# ft_strcat

## Allowed functions
None

## Prototype
\`\`\`c
char\t*ft_strcat(char *dest, char *src);
\`\`\`

## Description
Reproduce the behavior of \`strcat\`.

## Submission
\`ft_strcat.c\`
`,
    starter: `char\t*ft_strcat(char *dest, char *src)
{
\t(void)src;
\treturn (dest);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
char *ft_strcat(char *dest, char *src);
int main(void)
{
\tchar buf[32] = "Hello";
\tprintf("%s\\n", ft_strcat(buf, "42"));
\treturn (0);
}
`,
    expected: "Hello42\n",
  }),

  ft_atoi: ex({
    id: "ft_atoi",
    name: "ft_atoi",
    filename: "ft_atoi.c",
    allowedFiles: ["ft_atoi.c"],
    subject: `# ft_atoi

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_atoi(char *str);
\`\`\`

## Description
Convert the initial portion of \`str\` to an integer (spaces, signs, digits).
Behavior similar to \`atoi\`.

## Submission
\`ft_atoi.c\`
`,
    starter: `int\tft_atoi(char *str)
{
\t(void)str;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_atoi(char *str);
int main(void)
{
\tprintf("%d\\n", ft_atoi("42"));
\tprintf("%d\\n", ft_atoi("  -12a"));
\tprintf("%d\\n", ft_atoi("--+-+-123"));
\tprintf("%d\\n", ft_atoi("0"));
\treturn (0);
}
`,
    expected: "42\n-12\n-123\n0\n",
  }),

  ft_putnbr: ex({
    id: "ft_putnbr",
    name: "ft_putnbr",
    filename: "ft_putnbr.c",
    allowedFiles: ["ft_putnbr.c"],
    subject: `# ft_putnbr

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_putnbr(int nb);
\`\`\`

## Description
Display the number passed as a parameter. Handle \`INT_MIN\`.

## Submission
\`ft_putnbr.c\`
`,
    starter: `void\tft_putnbr(int nb)
{
\t(void)nb;
}
`,
    helpers: [PUTCHAR_HELPER],
    grader: `
void ft_putchar(char c);
void ft_putnbr(int nb);
int main(void)
{
\tft_putnbr(42);
\tft_putchar('\\n');
\tft_putnbr(-12);
\tft_putchar('\\n');
\tft_putnbr(0);
\tft_putchar('\\n');
\tft_putnbr(-2147483648);
\tft_putchar('\\n');
\treturn (0);
}
`,
    expected: "42\n-12\n0\n-2147483648\n",
  }),

  ft_iterative_factorial: ex({
    id: "ft_iterative_factorial",
    name: "ft_iterative_factorial",
    filename: "ft_iterative_factorial.c",
    allowedFiles: ["ft_iterative_factorial.c"],
    subject: `# ft_iterative_factorial

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_iterative_factorial(int nb);
\`\`\`

## Description
Return the factorial of \`nb\` iteratively. Return 0 if the argument is invalid
(negative, or overflow risk for large values — treat \`nb > 12\` as invalid for this exam).

## Submission
\`ft_iterative_factorial.c\`
`,
    starter: `int\tft_iterative_factorial(int nb)
{
\t(void)nb;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_iterative_factorial(int nb);
int main(void)
{
\tprintf("%d\\n", ft_iterative_factorial(0));
\tprintf("%d\\n", ft_iterative_factorial(1));
\tprintf("%d\\n", ft_iterative_factorial(5));
\tprintf("%d\\n", ft_iterative_factorial(-1));
\tprintf("%d\\n", ft_iterative_factorial(13));
\treturn (0);
}
`,
    expected: "1\n1\n120\n0\n0\n",
  }),

  ft_recursive_factorial: ex({
    id: "ft_recursive_factorial",
    name: "ft_recursive_factorial",
    filename: "ft_recursive_factorial.c",
    allowedFiles: ["ft_recursive_factorial.c"],
    subject: `# ft_recursive_factorial

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_recursive_factorial(int nb);
\`\`\`

## Description
Same as iterative factorial, but recursive. Invalid args return 0.

## Submission
\`ft_recursive_factorial.c\`
`,
    starter: `int\tft_recursive_factorial(int nb)
{
\t(void)nb;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_recursive_factorial(int nb);
int main(void)
{
\tprintf("%d\\n", ft_recursive_factorial(0));
\tprintf("%d\\n", ft_recursive_factorial(4));
\tprintf("%d\\n", ft_recursive_factorial(-3));
\treturn (0);
}
`,
    expected: "1\n24\n0\n",
  }),

  ft_fibonacci: ex({
    id: "ft_fibonacci",
    name: "ft_fibonacci",
    filename: "ft_fibonacci.c",
    allowedFiles: ["ft_fibonacci.c"],
    subject: `# ft_fibonacci

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_fibonacci(int index);
\`\`\`

## Description
Return the Fibonacci number at \`index\` (0 → 0, 1 → 1). Negative index → -1.

## Submission
\`ft_fibonacci.c\`
`,
    starter: `int\tft_fibonacci(int index)
{
\t(void)index;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_fibonacci(int index);
int main(void)
{
\tprintf("%d\\n", ft_fibonacci(0));
\tprintf("%d\\n", ft_fibonacci(1));
\tprintf("%d\\n", ft_fibonacci(7));
\tprintf("%d\\n", ft_fibonacci(-1));
\treturn (0);
}
`,
    expected: "0\n1\n13\n-1\n",
  }),

  ft_sqrt: ex({
    id: "ft_sqrt",
    name: "ft_sqrt",
    filename: "ft_sqrt.c",
    allowedFiles: ["ft_sqrt.c"],
    subject: `# ft_sqrt

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_sqrt(int nb);
\`\`\`

## Description
Return the integer square root of \`nb\` if it is a perfect square, otherwise 0.

## Submission
\`ft_sqrt.c\`
`,
    starter: `int\tft_sqrt(int nb)
{
\t(void)nb;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_sqrt(int nb);
int main(void)
{
\tprintf("%d\\n", ft_sqrt(0));
\tprintf("%d\\n", ft_sqrt(1));
\tprintf("%d\\n", ft_sqrt(16));
\tprintf("%d\\n", ft_sqrt(15));
\tprintf("%d\\n", ft_sqrt(-4));
\treturn (0);
}
`,
    expected: "0\n1\n4\n0\n0\n",
  }),

  ft_iterative_power: ex({
    id: "ft_iterative_power",
    name: "ft_iterative_power",
    filename: "ft_iterative_power.c",
    allowedFiles: ["ft_iterative_power.c"],
    subject: `# ft_iterative_power

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_iterative_power(int nb, int power);
\`\`\`

## Description
Return \`nb\` raised to \`power\` iteratively. Negative power → 0. Power 0 → 1.

## Submission
\`ft_iterative_power.c\`
`,
    starter: `int\tft_iterative_power(int nb, int power)
{
\t(void)nb;
\t(void)power;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_iterative_power(int nb, int power);
int main(void)
{
\tprintf("%d\\n", ft_iterative_power(2, 0));
\tprintf("%d\\n", ft_iterative_power(2, 3));
\tprintf("%d\\n", ft_iterative_power(5, -1));
\tprintf("%d\\n", ft_iterative_power(-2, 3));
\treturn (0);
}
`,
    expected: "1\n8\n0\n-8\n",
  }),

  ft_str_is_alpha: ex({
    id: "ft_str_is_alpha",
    name: "ft_str_is_alpha",
    filename: "ft_str_is_alpha.c",
    allowedFiles: ["ft_str_is_alpha.c"],
    subject: `# ft_str_is_alpha

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_str_is_alpha(char *str);
\`\`\`

## Description
Return 1 if the string contains only alphabetical characters (or is empty), else 0.

## Submission
\`ft_str_is_alpha.c\`
`,
    starter: `int\tft_str_is_alpha(char *str)
{
\t(void)str;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_str_is_alpha(char *str);
int main(void)
{
\tprintf("%d\\n", ft_str_is_alpha("AbCd"));
\tprintf("%d\\n", ft_str_is_alpha("A1"));
\tprintf("%d\\n", ft_str_is_alpha(""));
\treturn (0);
}
`,
    expected: "1\n0\n1\n",
  }),

  ft_strupcase: ex({
    id: "ft_strupcase",
    name: "ft_strupcase",
    filename: "ft_strupcase.c",
    allowedFiles: ["ft_strupcase.c"],
    subject: `# ft_strupcase

## Allowed functions
None

## Prototype
\`\`\`c
char\t*ft_strupcase(char *str);
\`\`\`

## Description
Transform every letter to uppercase. Return \`str\`.

## Submission
\`ft_strupcase.c\`
`,
    starter: `char\t*ft_strupcase(char *str)
{
\treturn (str);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
char *ft_strupcase(char *str);
int main(void)
{
\tchar s1[] = "Hello42";
\tchar s2[] = "";
\tprintf("%s\\n", ft_strupcase(s1));
\tprintf("%s\\n", ft_strupcase(s2));
\treturn (0);
}
`,
    expected: "HELLO42\n\n",
  }),

  ft_putstr: ex({
    id: "ft_putstr",
    name: "ft_putstr",
    filename: "ft_putstr.c",
    allowedFiles: ["ft_putstr.c"],
    subject: `# ft_putstr

## Allowed functions
\`write\`

## Prototype
\`\`\`c
void\tft_putstr(char *str);
\`\`\`

## Description
Display a string to stdout.

## Submission
\`ft_putstr.c\`
`,
    starter: `void\tft_putstr(char *str)
{
\t(void)str;
}
`,
    helpers: [],
    grader: `
void ft_putstr(char *str);
int main(void)
{
\tft_putstr("42");
\tft_putstr("\\n");
\tft_putstr("ok");
\treturn (0);
}
`,
    expected: "42\nok",
  }),

  ft_div_mod: ex({
    id: "ft_div_mod",
    name: "ft_div_mod",
    filename: "ft_div_mod.c",
    allowedFiles: ["ft_div_mod.c"],
    subject: `# ft_div_mod

## Allowed functions
None

## Prototype
\`\`\`c
void\tft_div_mod(int a, int b, int *div, int *mod);
\`\`\`

## Description
Divide \`a\` by \`b\` and store the result in \`*div\` and the remainder in \`*mod\`.

## Submission
\`ft_div_mod.c\`
`,
    starter: `void\tft_div_mod(int a, int b, int *div, int *mod)
{
\t(void)a;
\t(void)b;
\t(void)div;
\t(void)mod;
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
void ft_div_mod(int a, int b, int *div, int *mod);
int main(void)
{
\tint d = 0, m = 0;
\tft_div_mod(42, 10, &d, &m);
\tprintf("%d %d\\n", d, m);
\treturn (0);
}
`,
    expected: "4 2\n",
  }),

  ft_ultimate_div_mod: ex({
    id: "ft_ultimate_div_mod",
    name: "ft_ultimate_div_mod",
    filename: "ft_ultimate_div_mod.c",
    allowedFiles: ["ft_ultimate_div_mod.c"],
    subject: `# ft_ultimate_div_mod

## Allowed functions
None

## Prototype
\`\`\`c
void\tft_ultimate_div_mod(int *a, int *b);
\`\`\`

## Description
Divide \`*a\` by \`*b\`. Store quotient in \`*a\` and remainder in \`*b\`.

## Submission
\`ft_ultimate_div_mod.c\`
`,
    starter: `void\tft_ultimate_div_mod(int *a, int *b)
{
\t(void)a;
\t(void)b;
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
void ft_ultimate_div_mod(int *a, int *b);
int main(void)
{
\tint a = 42, b = 10;
\tft_ultimate_div_mod(&a, &b);
\tprintf("%d %d\\n", a, b);
\treturn (0);
}
`,
    expected: "4 2\n",
  }),

  ft_strncpy: ex({
    id: "ft_strncpy",
    name: "ft_strncpy",
    filename: "ft_strncpy.c",
    allowedFiles: ["ft_strncpy.c"],
    subject: `# ft_strncpy

## Allowed functions
None

## Prototype
\`\`\`c
char\t*ft_strncpy(char *dest, char *src, unsigned int n);
\`\`\`

## Description
Reproduce the behavior of \`strncpy\`.

## Submission
\`ft_strncpy.c\`
`,
    starter: `char\t*ft_strncpy(char *dest, char *src, unsigned int n)
{
\t(void)src;
\t(void)n;
\treturn (dest);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
char *ft_strncpy(char *dest, char *src, unsigned int n);
int main(void)
{
\tchar a[8];
\tchar b[8];
\tint i;
\tfor (i = 0; i < 8; i++) { a[i] = 'X'; b[i] = 'X'; }
\tft_strncpy(a, "hi", 5);
\tprintf("%d%d%d\\n", a[0] == 'h', a[1] == 'i', a[2] == '\\0' && a[3] == '\\0' && a[4] == '\\0');
\tft_strncpy(b, "hello", 2);
\tprintf("%c%c%c\\n", b[0], b[1], b[2]);
\treturn (0);
}
`,
    expected: "111\nheX\n",
  }),

  ft_strlowcase: ex({
    id: "ft_strlowcase",
    name: "ft_strlowcase",
    filename: "ft_strlowcase.c",
    allowedFiles: ["ft_strlowcase.c"],
    subject: `# ft_strlowcase

## Allowed functions
None

## Prototype
\`\`\`c
char\t*ft_strlowcase(char *str);
\`\`\`

## Description
Transform every letter to lowercase. Return \`str\`.

## Submission
\`ft_strlowcase.c\`
`,
    starter: `char\t*ft_strlowcase(char *str)
{
\treturn (str);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
char *ft_strlowcase(char *str);
int main(void)
{
\tchar s[] = "HeLLo42";
\tprintf("%s\\n", ft_strlowcase(s));
\treturn (0);
}
`,
    expected: "hello42\n",
  }),

  ft_str_is_numeric: ex({
    id: "ft_str_is_numeric",
    name: "ft_str_is_numeric",
    filename: "ft_str_is_numeric.c",
    allowedFiles: ["ft_str_is_numeric.c"],
    subject: `# ft_str_is_numeric

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_str_is_numeric(char *str);
\`\`\`

## Description
Return 1 if the string contains only digits (or is empty), else 0.

## Submission
\`ft_str_is_numeric.c\`
`,
    starter: `int\tft_str_is_numeric(char *str)
{
\t(void)str;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_str_is_numeric(char *str);
int main(void)
{
\tprintf("%d\\n", ft_str_is_numeric("42"));
\tprintf("%d\\n", ft_str_is_numeric("4a"));
\tprintf("%d\\n", ft_str_is_numeric(""));
\treturn (0);
}
`,
    expected: "1\n0\n1\n",
  }),

  ft_str_is_lowercase: ex({
    id: "ft_str_is_lowercase",
    name: "ft_str_is_lowercase",
    filename: "ft_str_is_lowercase.c",
    allowedFiles: ["ft_str_is_lowercase.c"],
    subject: `# ft_str_is_lowercase

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_str_is_lowercase(char *str);
\`\`\`

## Description
Return 1 if only lowercase letters (or empty), else 0.

## Submission
\`ft_str_is_lowercase.c\`
`,
    starter: `int\tft_str_is_lowercase(char *str)
{
\t(void)str;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_str_is_lowercase(char *str);
int main(void)
{
\tprintf("%d\\n", ft_str_is_lowercase("abc"));
\tprintf("%d\\n", ft_str_is_lowercase("abC"));
\tprintf("%d\\n", ft_str_is_lowercase(""));
\treturn (0);
}
`,
    expected: "1\n0\n1\n",
  }),

  ft_recursive_power: ex({
    id: "ft_recursive_power",
    name: "ft_recursive_power",
    filename: "ft_recursive_power.c",
    allowedFiles: ["ft_recursive_power.c"],
    subject: `# ft_recursive_power

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_recursive_power(int nb, int power);
\`\`\`

## Description
Return \`nb\` raised to \`power\` recursively. Negative power → 0. Power 0 → 1.

## Submission
\`ft_recursive_power.c\`
`,
    starter: `int\tft_recursive_power(int nb, int power)
{
\t(void)nb;
\t(void)power;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_recursive_power(int nb, int power);
int main(void)
{
\tprintf("%d\\n", ft_recursive_power(2, 0));
\tprintf("%d\\n", ft_recursive_power(2, 4));
\tprintf("%d\\n", ft_recursive_power(3, -1));
\treturn (0);
}
`,
    expected: "1\n16\n0\n",
  }),

  ft_is_prime: ex({
    id: "ft_is_prime",
    name: "ft_is_prime",
    filename: "ft_is_prime.c",
    allowedFiles: ["ft_is_prime.c"],
    subject: `# ft_is_prime

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_is_prime(int nb);
\`\`\`

## Description
Return 1 if \`nb\` is prime, otherwise 0.

## Submission
\`ft_is_prime.c\`
`,
    starter: `int\tft_is_prime(int nb)
{
\t(void)nb;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_is_prime(int nb);
int main(void)
{
\tprintf("%d\\n", ft_is_prime(0));
\tprintf("%d\\n", ft_is_prime(1));
\tprintf("%d\\n", ft_is_prime(2));
\tprintf("%d\\n", ft_is_prime(4));
\tprintf("%d\\n", ft_is_prime(17));
\treturn (0);
}
`,
    expected: "0\n0\n1\n0\n1\n",
  }),

  ft_find_next_prime: ex({
    id: "ft_find_next_prime",
    name: "ft_find_next_prime",
    filename: "ft_find_next_prime.c",
    allowedFiles: ["ft_find_next_prime.c"],
    subject: `# ft_find_next_prime

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_find_next_prime(int nb);
\`\`\`

## Description
Return the next prime greater than or equal to \`nb\`.

## Submission
\`ft_find_next_prime.c\`
`,
    starter: `int\tft_find_next_prime(int nb)
{
\t(void)nb;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_find_next_prime(int nb);
int main(void)
{
\tprintf("%d\\n", ft_find_next_prime(0));
\tprintf("%d\\n", ft_find_next_prime(2));
\tprintf("%d\\n", ft_find_next_prime(14));
\treturn (0);
}
`,
    expected: "2\n2\n17\n",
  }),

  ft_strcapitalize: ex({
    id: "ft_strcapitalize",
    name: "ft_strcapitalize",
    filename: "ft_strcapitalize.c",
    allowedFiles: ["ft_strcapitalize.c"],
    subject: `# ft_strcapitalize

## Allowed functions
None

## Prototype
\`\`\`c
char\t*ft_strcapitalize(char *str);
\`\`\`

## Description
Capitalize the first letter of each word and lowercase the rest.

## Submission
\`ft_strcapitalize.c\`
`,
    starter: `char\t*ft_strcapitalize(char *str)
{
\treturn (str);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
char *ft_strcapitalize(char *str);
int main(void)
{
\tchar s[] = "salut, comment tu vas ? 42mots quarante-deux; cinquante+et+un";
\tprintf("%s\\n", ft_strcapitalize(s));
\treturn (0);
}
`,
    expected: "Salut, Comment Tu Vas ? 42mots Quarante-Deux; Cinquante+Et+Un\n",
  }),

  ft_str_is_printable: ex({
    id: "ft_str_is_printable",
    name: "ft_str_is_printable",
    filename: "ft_str_is_printable.c",
    allowedFiles: ["ft_str_is_printable.c"],
    subject: `# ft_str_is_printable

## Allowed functions
None

## Prototype
\`\`\`c
int\tft_str_is_printable(char *str);
\`\`\`

## Description
Return 1 if every character is printable (ASCII 32–126) or the string is empty, else 0.

## Submission
\`ft_str_is_printable.c\`
`,
    starter: `int\tft_str_is_printable(char *str)
{
\t(void)str;
\treturn (0);
}
`,
    helpers: [],
    grader: `
#include <stdio.h>
int ft_str_is_printable(char *str);
int main(void)
{
\tchar bad[] = { 'a', 1, 0 };
\tprintf("%d\\n", ft_str_is_printable("Ab 9~"));
\tprintf("%d\\n", ft_str_is_printable(bad));
\tprintf("%d\\n", ft_str_is_printable(""));
\treturn (0);
}
`,
    expected: "1\n0\n1\n",
  }),
};

/* Merge ~80+ extra subjects (display, strings, bits, malloc, exam classics). */
const { EXTRA_BANK, EXTRA_HARDNESS } = require("./bank-extra");
Object.assign(BANK, EXTRA_BANK);

// Apply polished piscine-style subjects (C-day origin + layout).
require("./subjects-meta").applySubjects(BANK);

/** Pool size for exam00/01/02, captured before the final-only bank merges in. */
const POOL_BANK_SIZE = Object.keys(BANK).length;

/**
 * `final` exam: a fixed, ordered 15-level progression (not a random pool
 * like exam00/01/02) — every exercise in a level must be cleared to
 * advance. Subjects are pre-rendered in the plain 42-style format by the
 * generator that produced final-bank-data.json (real output captured by
 * actually compiling & running each reference solution).
 */
const FINAL_BANK_DATA = require("./final-bank-data.json");
Object.assign(BANK, FINAL_BANK_DATA.exercises);
{
  const { parseAllowedList } = require("./cheat-check");
  for (const ex of Object.values(FINAL_BANK_DATA.exercises)) {
    ex.origin = "poolers-final";
    ex.allowedFuncs = parseAllowedList(ex.allowed);
  }
}
const FINAL_LEVELS = FINAL_BANK_DATA.levels;

/** Level count: all difficulties run 10 levels (0–9). */
const LEVEL_COUNT = 10;
const EXERCISES_ASSIGNED_PER_LEVEL = 2;
const DIFFICULTIES = {
  normal: { id: "normal", title: "Normal", exercisesPerLevel: EXERCISES_ASSIGNED_PER_LEVEL },
  hard: { id: "hard", title: "Hard", exercisesPerLevel: EXERCISES_ASSIGNED_PER_LEVEL },
  extreme: { id: "extreme", title: "Extreme", exercisesPerLevel: EXERCISES_ASSIGNED_PER_LEVEL },
};

/** Exam duration: final = 8h, all others = 4h */
const DURATION_MS = {
  exam00: 4 * 60 * 60 * 1000,
  exam01: 4 * 60 * 60 * 1000,
  exam02: 4 * 60 * 60 * 1000,
  final: 8 * 60 * 60 * 1000,
};

function getExamDurationMs(examId) {
  return DURATION_MS[examId] || DURATION_MS.exam00;
}

/** Rough hardness 1 (easy) … 6 (brutal) — used from level 5+ */
const HARDNESS = {
  ft_putchar: 1,
  ft_print_alphabet: 1,
  ft_print_numbers: 1,
  ft_print_reverse_alphabet: 2,
  ft_is_negative: 1,
  ft_putstr: 2,
  ft_strlen: 2,
  ft_ft: 2,
  ft_swap: 2,
  ft_div_mod: 3,
  ft_ultimate_div_mod: 3,
  ft_print_comb: 4,
  ft_strcpy: 3,
  ft_strncpy: 4,
  ft_strcat: 3,
  ft_strcmp: 3,
  ft_str_is_alpha: 3,
  ft_str_is_numeric: 3,
  ft_str_is_lowercase: 3,
  ft_str_is_printable: 3,
  ft_strupcase: 3,
  ft_strlowcase: 3,
  ft_strcapitalize: 5,
  ft_putnbr: 4,
  ft_atoi: 5,
  ft_iterative_factorial: 3,
  ft_recursive_factorial: 4,
  ft_iterative_power: 3,
  ft_recursive_power: 4,
  ft_fibonacci: 4,
  ft_sqrt: 5,
  ft_is_prime: 5,
  ft_find_next_prime: 6,
  ...EXTRA_HARDNESS,
};

function hardnessOf(id) {
  return HARDNESS[id] || 2;
}

/** From level 5: bias pools toward harder exercises by difficulty mode. */
function preferHarderPool(pool, level, diff) {
  if (level < 5) return pool;
  const minH = diff === "extreme" ? 5 : diff === "hard" ? 4 : 3;
  const hard = pool.filter((id) => hardnessOf(id) >= minH);
  if (hard.length >= 2) return hard;
  // Not enough tagged-hard items — take the toughest half of the pool
  const sorted = [...pool].sort((a, b) => hardnessOf(b) - hardnessOf(a));
  const top = sorted.slice(0, Math.max(2, Math.ceil(pool.length * 0.6)));
  return [...new Set([...hard, ...top])];
}

/** Large themed pools — each level draws 2 random exercises from its pool. */
const POOLS = {
  /* Exam 00 — C00-style display / write */
  e00_hello: [
    "ft_putchar", "ft_print_alphabet", "ft_print_numbers", "ft_print_reverse_alphabet",
    "ft_putstr", "ft_is_negative",
    "ft_countdown", "ft_aff_a", "ft_aff_z", "ft_hello", "ft_print_digits_nl",
    "ft_print_alphabet_nl", "ft_putchar_nl",
  ],
  e00_display: [
    "ft_putchar", "ft_putstr", "ft_print_alphabet", "ft_print_numbers",
    "ft_print_reverse_alphabet", "ft_is_negative", "ft_print_comb",
    "ft_countdown", "ft_maff_alpha", "ft_maff_revalpha", "ft_hello",
    "ft_print_digits_nl", "ft_print_alphabet_nl", "ft_aff_a", "ft_aff_z",
  ],
  e00_comb: [
    "ft_print_comb", "ft_print_comb2", "ft_putstr", "ft_is_negative",
    "ft_print_alphabet", "ft_print_numbers", "ft_print_reverse_alphabet", "ft_putchar",
    "ft_maff_alpha", "ft_maff_revalpha", "ft_countdown",
  ],
  e00_mini_ptr: [
    "ft_ft", "ft_swap", "ft_strlen", "ft_putstr", "ft_putchar", "ft_is_negative",
    "ft_abs", "ft_sign", "ft_even", "ft_odd", "ft_ultimate_ft",
  ],
  e00_hard_cap: [
    "ft_print_comb", "ft_print_comb2", "ft_strlen", "ft_swap", "ft_ft", "ft_putstr",
    "ft_is_negative", "ft_print_reverse_alphabet", "ft_print_numbers",
    "ft_maff_alpha", "ft_maff_revalpha", "ft_ultimate_ft", "ft_rev_int_tab",
  ],

  print_basics: [
    "ft_putchar", "ft_print_alphabet", "ft_print_numbers", "ft_print_reverse_alphabet",
    "ft_putstr", "ft_is_negative",
    "ft_countdown", "ft_hello", "ft_aff_a", "ft_aff_z", "ft_print_digits_nl",
    "ft_print_alphabet_nl", "ft_putchar_nl", "ft_maff_alpha",
  ],
  print_combos: [
    "ft_print_comb", "ft_print_comb2", "ft_putchar", "ft_putstr", "ft_is_negative",
    "ft_print_alphabet", "ft_print_numbers", "ft_print_reverse_alphabet",
    "ft_maff_revalpha", "ft_fizzbuzz_line", "ft_tab_mult",
  ],
  pointers_intro: [
    "ft_ft", "ft_swap", "ft_div_mod", "ft_ultimate_div_mod", "ft_strlen", "ft_putstr",
    "ft_ultimate_ft", "ft_rev_int_tab", "ft_sort_int_tab", "ft_abs", "ft_sign",
    "ft_even", "ft_odd", "ft_clamp", "ft_max", "ft_min",
  ],
  ctype_basics: [
    "ft_isalpha", "ft_isdigit", "ft_isalnum", "ft_isascii", "ft_isprint",
    "ft_toupper", "ft_tolower", "ft_str_is_alpha", "ft_str_is_numeric",
    "ft_str_is_lowercase", "ft_str_is_uppercase", "ft_str_is_printable",
  ],
  strings_copy: [
    "ft_strcpy", "ft_strncpy", "ft_strcat", "ft_strcmp", "ft_strlen", "ft_putstr",
    "ft_strncmp", "ft_strncat", "ft_strlcpy_simple", "ft_strstr", "ft_strchr", "ft_strrchr",
  ],
  strings_check: [
    "ft_str_is_alpha", "ft_str_is_numeric", "ft_str_is_lowercase", "ft_str_is_printable",
    "ft_str_is_uppercase", "ft_strcmp", "ft_strlen", "ft_strncmp",
    "ft_isalpha", "ft_isdigit", "ft_isalnum", "ft_str_is_palindrome",
  ],
  strings_case: [
    "ft_strupcase", "ft_strlowcase", "ft_strcapitalize", "ft_strcat", "ft_strcpy",
    "ft_str_is_alpha", "ft_toupper", "ft_tolower", "rot_13", "rotone", "ulstr",
    "alpha_mirror", "ft_snake_to_camel", "ft_camel_to_snake",
  ],
  strings_exam: [
    "ft_strrev", "ft_strstr", "ft_strchr", "ft_strrchr", "ft_search_and_replace",
    "ft_strcmp_ignore_case", "ft_count_words", "ft_is_anagram", "ft_wdmatch",
    "ft_hidenp", "ft_inter", "ft_union", "ft_first_word", "ft_last_word",
    "ft_epur_str", "ft_repeat_alpha", "ft_putstr_non_printable",
  ],
  /* Exam 01 may introduce putnbr late; atoi stays exam02+. */
  e01_putnbr: [
    "ft_putnbr", "ft_strlen", "ft_strcpy", "ft_strcmp", "ft_is_negative", "ft_swap",
    "ft_print_hex", "ft_abs", "ft_max", "ft_min", "ft_sum_tab", "ft_average",
  ],
  atoi_putnbr: [
    "ft_atoi", "ft_putnbr", "ft_strlen", "ft_strcpy", "ft_strcmp", "ft_is_negative",
    "ft_atoi_simple", "ft_itoa", "ft_print_hex", "ft_print_bits",
  ],
  recursion_easy: [
    "ft_iterative_factorial", "ft_recursive_factorial", "ft_iterative_power",
    "ft_recursive_power", "ft_fibonacci", "ft_putnbr",
    "ft_is_power_of_2", "ft_gcd", "ft_lcm",
  ],
  math_mid: [
    "ft_sqrt", "ft_fibonacci", "ft_iterative_power", "ft_recursive_power",
    "ft_iterative_factorial", "ft_putnbr",
    "ft_gcd", "ft_lcm", "ft_is_power_of_2", "ft_max", "ft_min", "ft_sum_tab",
  ],
  primes_hard: [
    "ft_is_prime", "ft_find_next_prime", "ft_sqrt", "ft_fibonacci",
    "ft_atoi", "ft_putnbr", "ft_print_comb",
    "ft_gcd", "ft_lcm", "ft_ten_queens_count", "ft_print_comb2",
  ],
  bits_exam: [
    "ft_print_bits", "ft_reverse_bits", "ft_swap_bits", "ft_print_hex",
    "ft_is_power_of_2", "ft_putnbr", "ft_atoi_simple",
  ],
  malloc_exam: [
    "ft_strdup", "ft_strndup", "ft_range", "ft_rrange", "ft_itoa", "ft_strjoin",
    "ft_map", "ft_foreach", "ft_any", "ft_count_if",
  ],
  mem_libft: [
    "ft_memcmp", "ft_memcpy", "ft_memset", "ft_bzero", "ft_memchr",
    "ft_strlcpy_simple", "ft_strlen", "ft_strcpy",
  ],
  final_mix_easy: [
    "ft_putchar", "ft_strlen", "ft_swap", "ft_ft", "ft_putstr", "ft_print_alphabet",
    "ft_strcpy", "ft_strcmp",
    "ft_countdown", "ft_hello", "ft_abs", "ft_isalpha", "ft_toupper", "ft_isdigit",
    "ft_strchr", "ft_strrev", "ft_max", "ft_min",
  ],
  final_mix_hard: [
    "ft_print_comb", "ft_putnbr", "ft_atoi", "ft_strcapitalize", "ft_find_next_prime",
    "ft_recursive_power", "ft_is_prime", "ft_strncpy", "ft_sqrt",
    "ft_print_comb2", "ft_itoa", "ft_strjoin", "ft_range", "rot_13", "ft_inter",
    "ft_union", "ft_wdmatch", "ft_hidenp", "ft_epur_str", "ft_ten_queens_count",
  ],
  extreme_e00: [
    "ft_print_comb", "ft_print_comb2", "ft_strlen", "ft_swap", "ft_ft", "ft_putstr",
    "ft_is_negative", "ft_print_reverse_alphabet", "ft_print_numbers", "ft_putchar",
    "ft_maff_alpha", "ft_maff_revalpha", "ft_ultimate_ft", "ft_sort_int_tab",
  ],
  extreme_strings: [
    "ft_strcapitalize", "ft_strncpy", "ft_strcmp", "ft_strcat", "ft_str_is_printable",
    "ft_strupcase", "ft_putnbr",
    "ft_snake_to_camel", "ft_camel_to_snake", "ft_is_anagram", "ft_search_and_replace",
    "ft_inter", "ft_union", "ft_wdmatch", "ft_hidenp", "ft_epur_str", "alpha_mirror",
  ],
  extreme_math: [
    "ft_find_next_prime", "ft_is_prime", "ft_recursive_power", "ft_recursive_factorial",
    "ft_sqrt", "ft_fibonacci", "ft_atoi", "ft_putnbr", "ft_print_comb",
    "ft_ten_queens_count", "ft_gcd", "ft_lcm", "ft_itoa", "ft_print_comb2",
    "ft_reverse_bits", "ft_swap_bits",
  ],
  extreme_final: [
    "ft_ten_queens_count", "ft_strjoin", "ft_itoa", "ft_range", "ft_rrange",
    "ft_map", "ft_any", "ft_count_if", "ft_is_anagram", "ft_inter", "ft_union",
    "ft_find_next_prime", "ft_strcapitalize", "ft_print_comb2", "ft_atoi",
  ],
};

function levelsFrom(...poolKeys) {
  return poolKeys.map((key) => {
    const pool = POOLS[key];
    if (!pool) throw new Error(`Unknown pool: ${key}`);
    return [...pool];
  });
}

/**
 * Build 10 progressive pools per difficulty.
 * exam00 = C00 display · exam01 = pointers/strings · exam02 = atoi/recursion · final = mix
 */
function buildExam(id, title, normalKeys, hardKeys, extremeKeys) {
  return {
    id,
    title,
    levels: {
      normal: levelsFrom(...normalKeys),
      hard: levelsFrom(...hardKeys),
      extreme: levelsFrom(...(extremeKeys || hardKeys)),
    },
  };
}

const EXAMS = {
  exam00: buildExam(
    "exam00",
    "Exam 00",
    [
      "e00_hello", "e00_hello", "e00_display", "e00_display", "e00_comb",
      /* L5+ — harder (print_comb / ptrs) */
      "e00_hard_cap", "e00_hard_cap", "e00_comb", "e00_hard_cap", "e00_hard_cap",
    ],
    [
      "e00_hello", "e00_display", "e00_comb", "e00_mini_ptr", "e00_comb",
      /* L5+ — very hard */
      "e00_hard_cap", "extreme_e00", "e00_hard_cap", "extreme_e00", "e00_hard_cap",
    ],
    [
      "e00_display", "e00_comb", "e00_comb", "e00_hard_cap", "extreme_e00",
      /* L5+ — very extreme */
      "extreme_e00", "extreme_e00", "extreme_e00", "extreme_e00", "extreme_e00",
    ]
  ),
  exam01: buildExam(
    "exam01",
    "Exam 01",
    [
      "pointers_intro", "ctype_basics", "strings_copy", "strings_check", "strings_case",
      /* L5+ — harder strings / putnbr / exam strings */
      "e01_putnbr", "strings_exam", "e01_putnbr", "strings_case", "strings_exam",
    ],
    [
      "pointers_intro", "strings_copy", "strings_case", "strings_exam", "e01_putnbr",
      /* L5+ — very hard */
      "extreme_strings", "strings_exam", "extreme_strings", "e01_putnbr", "extreme_strings",
    ],
    [
      "strings_copy", "extreme_strings", "strings_exam", "extreme_strings", "e01_putnbr",
      /* L5+ — very extreme */
      "extreme_strings", "extreme_strings", "strings_exam", "extreme_strings", "extreme_strings",
    ]
  ),
  exam02: buildExam(
    "exam02",
    "Exam 02",
    [
      "atoi_putnbr", "strings_exam", "recursion_easy", "math_mid", "bits_exam",
      /* L5+ — harder math / primes / malloc */
      "primes_hard", "malloc_exam", "primes_hard", "final_mix_hard", "bits_exam",
    ],
    [
      "atoi_putnbr", "recursion_easy", "math_mid", "bits_exam", "malloc_exam",
      /* L5+ — very hard */
      "final_mix_hard", "primes_hard", "extreme_math", "malloc_exam", "final_mix_hard",
    ],
    [
      "atoi_putnbr", "extreme_math", "bits_exam", "extreme_math", "malloc_exam",
      /* L5+ — very extreme */
      "extreme_math", "extreme_final", "extreme_math", "extreme_final", "extreme_math",
    ]
  ),
  final: buildExam(
    "final",
    "Exam Final",
    [
      "final_mix_easy", "ctype_basics", "strings_copy", "pointers_intro", "atoi_putnbr",
      /* L5+ — harder mix */
      "primes_hard", "final_mix_hard", "malloc_exam", "bits_exam", "mem_libft",
    ],
    [
      "final_mix_hard", "strings_exam", "atoi_putnbr", "recursion_easy", "malloc_exam",
      /* L5+ — very hard */
      "final_mix_hard", "primes_hard", "extreme_final", "extreme_math", "mem_libft",
    ],
    [
      "extreme_math", "extreme_strings", "extreme_final", "malloc_exam", "bits_exam",
      /* L5+ — very extreme */
      "extreme_final", "extreme_math", "extreme_strings", "extreme_final", "extreme_math",
    ]
  ),
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeDifficulty(d) {
  const key = String(d || "normal").toLowerCase();
  return DIFFICULTIES[key] ? key : "normal";
}

function listExams() {
  const bankSize = POOL_BANK_SIZE;
  return Object.values(EXAMS).map((e) => {
    if (e.id === "final") {
      const finalExerciseCount = FINAL_LEVELS.reduce((n, lv) => n + lv.exerciseIds.length, 0);
      return {
        id: e.id,
        title: e.title,
        levels: FINAL_LEVELS.length,
        exercisesPerLevel: EXERCISES_ASSIGNED_PER_LEVEL,
        durationMs: getExamDurationMs(e.id),
        durationHours: getExamDurationMs(e.id) / (60 * 60 * 1000),
        bankSize: finalExerciseCount,
        poolHint: `${finalExerciseCount} fixed exercises across ${FINAL_LEVELS.length} levels · 2 random / level`,
        difficulties: Object.values(DIFFICULTIES),
      };
    }
    return {
      id: e.id,
      title: e.title,
      levels: LEVEL_COUNT,
      exercisesPerLevel: EXERCISES_ASSIGNED_PER_LEVEL,
      durationMs: getExamDurationMs(e.id),
      durationHours: getExamDurationMs(e.id) / (60 * 60 * 1000),
      bankSize,
      poolHint: `${bankSize} subjects · 2 random / level · L5+ harder by difficulty`,
      difficulties: Object.values(DIFFICULTIES),
    };
  });
}

function listDifficulties() {
  return Object.values(DIFFICULTIES);
}

function getExam(examId) {
  return EXAMS[examId] || null;
}

function getExercise(id) {
  return BANK[id] || null;
}

function pickLevelAssignments(examId, difficulty = "normal") {
  const exam = getExam(examId);
  if (!exam) return null;
  if (examId === "final") {
    // Fixed, ordered level list — but like exam00/01/02, only 2 exercises
    // per level are actually assigned, picked at random from that level's
    // pool (same for every difficulty).
    return FINAL_LEVELS.map((lv) => {
      const pool = lv.exerciseIds;
      const picked = shuffle(pool).slice(0, Math.min(EXERCISES_ASSIGNED_PER_LEVEL, pool.length));
      return {
        level: lv.level,
        pool,
        poolSize: pool.length,
        assigned: picked,
        passed: [],
        currentIndex: 0,
      };
    });
  }
  const diff = normalizeDifficulty(difficulty);
  const pools = exam.levels[diff] || exam.levels.normal;
  const perLevel = EXERCISES_ASSIGNED_PER_LEVEL;
  const used = new Set();

  return pools.slice(0, LEVEL_COUNT).map((pool, level) => {
    const uniquePool = [...new Set(pool.filter((id) => BANK[id]))];
    const biased = preferHarderPool(uniquePool, level, diff);
    const available = shuffle(biased.filter((id) => !used.has(id)));
    const fallback = shuffle(biased.length >= perLevel ? biased : uniquePool);
    const source = available.length >= perLevel ? available : fallback;
    const picked = source.slice(0, Math.min(perLevel, source.length));
    picked.forEach((id) => used.add(id));
    return {
      level,
      pool: uniquePool,
      poolSize: uniquePool.length,
      assigned: picked,
      passed: [],
      currentIndex: 0,
    };
  });
}

function publicExercise(ex) {
  if (!ex) return null;
  return {
    id: ex.id,
    name: ex.name,
    filename: ex.filename,
    allowedFiles: ex.allowedFiles,
    allowedFuncs: ex.allowedFuncs || [],
    subject: ex.subject,
    starter: "",
    day: ex.day || null,
    origin: ex.origin || "poolers",
  };
}

module.exports = {
  EXERCISES_PER_LEVEL: EXERCISES_ASSIGNED_PER_LEVEL,
  LEVEL_COUNT,
  DIFFICULTIES,
  listExams,
  listDifficulties,
  getExam,
  getExercise,
  pickLevelAssignments,
  publicExercise,
  normalizeDifficulty,
  getExamDurationMs,
  checkCodeIntegrity: require("./cheat-check").checkCodeIntegrity,
};
