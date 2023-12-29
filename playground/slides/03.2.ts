const TAX_CODES = ["OT", "COT"] as const; // satisfies readonly string[];

// We get the union string instead of just a string!
type TaxCode = typeof TAX_CODES[number];
