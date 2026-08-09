/**
 * Structured subject metadata for every exam exercise.
 * day = piscine C-day when it maps; otherwise Poolers custom.
 */
const { buildSubjectData } = require("./subject-format");

const META = {
  ft_putchar: {
    day: "C00",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_putchar(char c);",
    description:
      "Write a function that displays the character passed as a parameter to the standard output.",
    examples: "Calling `ft_putchar('A')` prints:\n\n    A",
    notes: ["Use `write(1, &c, 1)`.", "One character only — no extra spaces or newlines unless asked."],
  },
  ft_print_alphabet: {
    day: "C00",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_print_alphabet(void);",
    description:
      "Display the alphabet in lowercase, on a single line, in ascending order, starting from `a`.",
    examples: "Expected output:\n\n    abcdefghijklmnopqrstuvwxyz",
  },
  ft_print_numbers: {
    day: "C00",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_print_numbers(void);",
    description: "Display all digits (`0` to `9`) on a single line, in ascending order.",
    examples: "Expected output:\n\n    0123456789",
  },
  ft_print_reverse_alphabet: {
    day: "C00",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_print_reverse_alphabet(void);",
    description:
      "Display the alphabet in lowercase, on a single line, in descending order, starting from `z`.",
    examples: "Expected output:\n\n    zyxwvutsrqponmlkjihgfedcba",
  },
  ft_is_negative: {
    day: "C00",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_is_negative(int n);",
    description: "Display `N` if the integer is negative, otherwise display `P`.",
    examples: "`ft_is_negative(-1)` → `N` · `ft_is_negative(0)` → `P`",
  },
  ft_print_comb: {
    day: "C00",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_print_comb(void);",
    description:
      "Display all different combinations of three different digits in ascending order, separated by `, ` (comma then space).",
    examples: "Starts like:\n\n    012, 013, 014, …, 789",
    notes: ["Digits in a combination are unique and sorted.", "This is a classic early exam killer — stay calm and nest loops carefully."],
    hint: "Think `i < j < k` over digits `0..9`.",
  },
  ft_putstr: {
    day: "C01 / exam",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_putstr(char *str);",
    description: "Display a string to the standard output (no automatic newline unless the string contains one).",
  },
  ft_strlen: {
    day: "C01",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_strlen(char *str);",
    description: "Return the length of the string (not counting the terminating `\\0`).",
  },
  ft_swap: {
    day: "C01",
    origin: "piscine",
    allowed: "None",
    prototype: "void\tft_swap(int *a, int *b);",
    description: "Swap the contents of two integers whose addresses are given as parameters.",
  },
  ft_ft: {
    day: "C01",
    origin: "piscine",
    allowed: "None",
    prototype: "void\tft_ft(int *nbr);",
    description: "Set the integer pointed to by `nbr` to `42`.",
  },
  ft_div_mod: {
    day: "C01",
    origin: "piscine",
    allowed: "None",
    prototype: "void\tft_div_mod(int a, int b, int *div, int *mod);",
    description: "Divide `a` by `b` and store the quotient in `*div` and the remainder in `*mod`.",
  },
  ft_ultimate_div_mod: {
    day: "C01",
    origin: "piscine",
    allowed: "None",
    prototype: "void\tft_ultimate_div_mod(int *a, int *b);",
    description: "Divide `*a` by `*b`. Store the quotient in `*a` and the remainder in `*b`.",
  },
  ft_strcpy: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "char\t*ft_strcpy(char *dest, char *src);",
    description: "Reproduce the behavior of `strcpy`. Copy `src` into `dest` including the terminating null. Return `dest`.",
  },
  ft_strncpy: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "char\t*ft_strncpy(char *dest, char *src, unsigned int n);",
    description: "Reproduce the behavior of `strncpy`.",
    notes: ["If `src` is shorter than `n`, pad with `\\0`.", "If `src` is longer, `dest` may not be null-terminated after `n` bytes."],
  },
  ft_strcmp: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_strcmp(char *s1, char *s2);",
    description: "Reproduce the behavior of `strcmp` (compare lexicographically).",
  },
  ft_strcat: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "char\t*ft_strcat(char *dest, char *src);",
    description: "Reproduce the behavior of `strcat`. Append `src` to `dest`. Return `dest`.",
  },
  ft_str_is_alpha: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_str_is_alpha(char *str);",
    description: "Return `1` if the string contains only alphabetical characters (or is empty), otherwise `0`.",
  },
  ft_str_is_numeric: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_str_is_numeric(char *str);",
    description: "Return `1` if the string contains only digits (or is empty), otherwise `0`.",
  },
  ft_str_is_lowercase: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_str_is_lowercase(char *str);",
    description: "Return `1` if the string contains only lowercase letters (or is empty), otherwise `0`.",
  },
  ft_str_is_printable: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_str_is_printable(char *str);",
    description: "Return `1` if every character is printable (ASCII 32–126) or the string is empty, otherwise `0`.",
  },
  ft_strupcase: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "char\t*ft_strupcase(char *str);",
    description: "Transform every letter to uppercase. Return `str`.",
  },
  ft_strlowcase: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "char\t*ft_strlowcase(char *str);",
    description: "Transform every letter to lowercase. Return `str`.",
  },
  ft_strcapitalize: {
    day: "C02",
    origin: "piscine",
    allowed: "None",
    prototype: "char\t*ft_strcapitalize(char *str);",
    description:
      "Capitalize the first letter of each word and put the rest in lowercase. A word starts after a non-alphanumeric character.",
    hint: "Track whether the previous character was alphanumeric.",
  },
  ft_atoi: {
    day: "C04",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_atoi(char *str);",
    description:
      "Convert the initial portion of the string to an integer (skip spaces, handle `+`/`-`, then parse digits). Behavior similar to `atoi`.",
  },
  ft_putnbr: {
    day: "C00 / C04",
    origin: "piscine",
    allowed: "write",
    prototype: "void\tft_putnbr(int nb);",
    description: "Display the number passed as a parameter. Must handle `INT_MIN` (`-2147483648`).",
    hint: "Use a wider type (`long`) or special-case `INT_MIN`.",
  },
  ft_iterative_factorial: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_iterative_factorial(int nb);",
    description:
      "Return the factorial of `nb` iteratively. Return `0` if the argument is invalid (negative, or too large — treat `nb > 12` as invalid here).",
  },
  ft_recursive_factorial: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_recursive_factorial(int nb);",
    description: "Same rules as iterative factorial, but implemented recursively. Invalid args return `0`.",
  },
  ft_iterative_power: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_iterative_power(int nb, int power);",
    description: "Return `nb` raised to `power` iteratively. Negative power → `0`. Power `0` → `1`.",
  },
  ft_recursive_power: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_recursive_power(int nb, int power);",
    description: "Return `nb` raised to `power` recursively. Negative power → `0`. Power `0` → `1`.",
  },
  ft_fibonacci: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_fibonacci(int index);",
    description: "Return the Fibonacci number at `index` (`0` → `0`, `1` → `1`). Negative index → `-1`.",
  },
  ft_sqrt: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_sqrt(int nb);",
    description: "Return the integer square root of `nb` if it is a perfect square, otherwise `0`.",
  },
  ft_is_prime: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_is_prime(int nb);",
    description: "Return `1` if `nb` is a prime number, otherwise `0`.",
  },
  ft_find_next_prime: {
    day: "C05",
    origin: "piscine",
    allowed: "None",
    prototype: "int\tft_find_next_prime(int nb);",
    description: "Return the next prime greater than or equal to `nb`.",
  },
};

function applySubjects(bank) {
  const { parseAllowedList } = require("./cheat-check");
  let EXTRA_META = {};
  try {
    EXTRA_META = require("./bank-extra").EXTRA_META || {};
  } catch (_) { /* optional */ }
  const allMeta = { ...EXTRA_META, ...META };
  for (const [id, exercise] of Object.entries(bank)) {
    const meta = allMeta[id];
    if (!meta) continue;
    exercise.subject = buildSubjectData({
      name: exercise.name || id,
      filename: exercise.filename || `${id}.c`,
      ...meta,
    });
    exercise.day = meta.day;
    exercise.origin = meta.origin || "poolers";
    exercise.allowedFuncs = parseAllowedList(meta.allowed);
  }
  return bank;
}

module.exports = { META, applySubjects, buildSubjectData };
