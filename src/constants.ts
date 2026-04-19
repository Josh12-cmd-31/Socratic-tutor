export interface MathTopic {
  icon: string;
  text: string;
  sub: string;
  category: "Foundations" | "Algebra" | "Geometry" | "Calculus" | "Advanced";
}

export const MATH_TOPICS: MathTopic[] = [
  // Foundations
  { icon: "+−", text: "Pre-Algebra", sub: "Fractions, Ratios, Decimals", category: "Foundations" },
  { icon: "%", text: "Percentages", sub: "Interest, Tax, Discounts", category: "Foundations" },
  
  // Algebra
  { icon: "x", text: "Algebra I", sub: "Linear Equations, Graphing", category: "Algebra" },
  { icon: "x²", text: "Algebra II", sub: "Factoring, Polynomials", category: "Algebra" },
  { icon: "log", text: "Logarithms", sub: "Base 10, Natural Logs", category: "Algebra" },
  { icon: "[ ]", text: "Matrices", sub: "Determinants, Inverses", category: "Algebra" },
  
  // Geometry
  { icon: "△", text: "Trigonometry", sub: "Unit Circle, Sine, Cosine", category: "Geometry" },
  { icon: "○", text: "Geometry", sub: "Proofs, Theorems, Circles", category: "Geometry" },
  { icon: "∠", text: "Analytic Geometry", sub: "Conics, Polar Graphs", category: "Geometry" },

  // Calculus
  { icon: "d/dx", text: "Differential Calculus", sub: "Limits, Chain Rule", category: "Calculus" },
  { icon: "∫", text: "Integral Calculus", sub: "Integration, Areas", category: "Calculus" },
  { icon: "Σn", text: "Sequences & Series", sub: "Taylor, Maclaurin", category: "Calculus" },
  { icon: "∇", text: "Vector Calculus", sub: "Gradient, Divergence", category: "Calculus" },

  // Advanced
  { icon: "Δ", text: "Differential Equations", sub: "Linear, Non-linear Systems", category: "Advanced" },
  { icon: "μ", text: "Statistics", sub: "Probability, Z-Scores", category: "Advanced" },
  { icon: "i", text: "Complex Analysis", sub: "Imaginary Numbers", category: "Advanced" },
];
