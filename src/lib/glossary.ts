export interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
}

export const MATHEMATICAL_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Derivative",
    definition: "A measure of how a function changes as its input changes. Geometrically, the slope of the tangent line to the graph of the function at a point.",
    category: "Calculus"
  },
  {
    term: "Integral",
    definition: "A mathematical object that can be interpreted as an area under a curve or a cumulative sum. The inverse operation of differentiation.",
    category: "Calculus"
  },
  {
    term: "Chain Rule",
    definition: "A formula for calculating the derivative of a composite function. If h(x) = f(g(x)), then h'(x) = f'(g(x)) * g'(x).",
    category: "Calculus"
  },
  {
    term: "Product Rule",
    definition: "A rule used to find the derivative of a product of two or more functions. (fg)' = f'g + fg'.",
    category: "Calculus"
  },
  {
    term: "Limit",
    definition: "The value that a function 'approaches' as the input approaches some value. The core foundation of calculus.",
    category: "Calculus"
  },
  {
    term: "Function",
    definition: "A relation between a set of inputs and a set of outputs where each input is related to exactly one output.",
    category: "Algebra"
  },
  {
    term: "Polynomial",
    definition: "An expression consisting of variables and coefficients, that involves only the operations of addition, subtraction, multiplication, and non-negative integer exponents.",
    category: "Algebra"
  },
  {
    term: "Logarithm",
    definition: "The inverse function to exponentiation. It tells you what exponent a base must be raised to to get a certain number.",
    category: "Algebra"
  },
  {
    term: "Sine",
    definition: "In a right triangle, the ratio of the length of the side opposite an angle to the length of the hypotenuse.",
    category: "Trigonometry"
  },
  {
    term: "Unit Circle",
    definition: "A circle with a radius of one, centered at the origin (0,0) in the Cartesian coordinate system.",
    category: "Trigonometry"
  },
  {
    term: "Differentiation",
    definition: "The process of finding a derivative of a function.",
    category: "Calculus"
  },
  {
    term: "Asymptote",
    definition: "A line that a curve approaches as it heads towards infinity.",
    category: "Algebra"
  },
  {
    term: "Vector",
    definition: "An object that has both magnitude and direction.",
    category: "Geometry"
  },
  {
    term: "Matrix",
    definition: "A rectangular array of numbers, symbols, or expressions, arranged in rows and columns.",
    category: "Algebra"
  }
];
