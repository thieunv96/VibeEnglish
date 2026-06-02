import { describe, it, expect } from "vitest";
import {
  normalize,
  checkAnswer,
  sanitiseQuestion,
} from "../../src/lib/exercise-scoring";
import type { ExerciseQuestion } from "../../src/lib/content";

// ---------------------------------------------------------------------------
// normalize
// ---------------------------------------------------------------------------
describe("normalize", () => {
  it("lowercases input", () => {
    expect(normalize("HELLO")).toBe("hello");
  });

  it("trims whitespace", () => {
    expect(normalize("  hello  ")).toBe("hello");
  });

  it("strips punctuation except allowed chars", () => {
    // comma, period inside a word stays? No — period is in allowed set $€.
    expect(normalize("hello, world!")).toBe("helloworld");
    expect(normalize("it's")).toBe("it's");
    expect(normalize("$100")).toBe("$100");
  });
});

// ---------------------------------------------------------------------------
// checkAnswer — MCQ
// ---------------------------------------------------------------------------
describe("checkAnswer – MCQ", () => {
  const mcq: ExerciseQuestion = {
    id: "q1",
    type: "mcq",
    prompt: "Which is correct?",
    options: ["A", "B", "C"],
    answer: "B",
  };

  it("returns true for the exact correct option", () => {
    expect(checkAnswer(mcq, "B")).toBe(true);
  });

  it("returns false for a wrong option", () => {
    expect(checkAnswer(mcq, "A")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(checkAnswer(mcq, "b")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkAnswer — fill (array answer)
// ---------------------------------------------------------------------------
describe("checkAnswer – fill with array answer", () => {
  const fill: ExerciseQuestion = {
    id: "q2",
    type: "fill",
    prompt: "Type the word",
    answer: ["colour", "color"],
  };

  it("accepts first accepted variant", () => {
    expect(checkAnswer(fill, "colour")).toBe(true);
  });

  it("accepts second accepted variant", () => {
    expect(checkAnswer(fill, "color")).toBe(true);
  });

  it("rejects unaccepted answer", () => {
    expect(checkAnswer(fill, "coloure")).toBe(false);
  });

  it("is case-insensitive for fill", () => {
    expect(checkAnswer(fill, "COLOUR")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkAnswer — match
// ---------------------------------------------------------------------------
describe("checkAnswer – match", () => {
  const match: ExerciseQuestion = {
    id: "q3",
    type: "match",
    prompt: "Match the pairs",
    answer: "",
    pairs: [
      { left: "cat", right: "animal" },
      { left: "oak", right: "tree" },
    ],
  };

  it("returns true when all pairs are correctly matched", () => {
    expect(checkAnswer(match, { cat: "animal", oak: "tree" })).toBe(true);
  });

  it("returns false when one pair is wrong", () => {
    expect(checkAnswer(match, { cat: "tree", oak: "animal" })).toBe(false);
  });

  it("returns false when given a string instead of an object", () => {
    expect(checkAnswer(match, "animal")).toBe(false);
  });

  it("is case-insensitive for match values", () => {
    expect(checkAnswer(match, { cat: "ANIMAL", oak: "TREE" })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sanitiseQuestion
// ---------------------------------------------------------------------------
describe("sanitiseQuestion", () => {
  const source = { slug: "ex-1", skill: "grammar", level: "B1" };

  it("strips the answer field from MCQ", () => {
    const q: ExerciseQuestion = {
      id: "q1",
      type: "mcq",
      prompt: "Choose",
      options: ["A", "B"],
      answer: "A",
    };
    const s = sanitiseQuestion(q, source);
    expect("answer" in s).toBe(false);
    expect(s.options).toEqual(["A", "B"]);
    expect(s.sourceExerciseSlug).toBe("ex-1");
    expect(s.sourceExerciseSkill).toBe("grammar");
    expect(s.sourceExerciseLevel).toBe("B1");
  });

  it("strips pairs[].right for match questions", () => {
    const q: ExerciseQuestion = {
      id: "q2",
      type: "match",
      prompt: "Match",
      answer: "",
      pairs: [
        { left: "cat", right: "animal" },
        { left: "oak", right: "tree" },
      ],
    };
    const s = sanitiseQuestion(q, source);
    expect("answer" in s).toBe(false);
    expect(s.pairs).toEqual([{ left: "cat" }, { left: "oak" }]);
    // right values must not be present in pairs
    s.pairs!.forEach((p) => expect("right" in p).toBe(false));
  });

  it("populates shuffled options from pairs[].right for match questions", () => {
    const q: ExerciseQuestion = {
      id: "q-match",
      type: "match",
      prompt: "Match the words",
      answer: "",
      pairs: [
        { left: "dog", right: "mammal" },
        { left: "eagle", right: "bird" },
        { left: "salmon", right: "fish" },
      ],
    };
    const s = sanitiseQuestion(q, source);
    // options must be populated with the right values
    expect(s.options).toBeDefined();
    expect(s.options).toHaveLength(3);
    // all right values must appear in options
    expect(s.options).toContain("mammal");
    expect(s.options).toContain("bird");
    expect(s.options).toContain("fish");
    // pairs[].right must still be stripped
    s.pairs!.forEach((p) => expect("right" in p).toBe(false));
  });

  it("retains explanation", () => {
    const q: ExerciseQuestion = {
      id: "q3",
      type: "fill",
      prompt: "Fill in",
      answer: "dog",
      explanation: "Hint text",
    };
    const s = sanitiseQuestion(q, source);
    expect(s.explanation).toBe("Hint text");
    expect("answer" in s).toBe(false);
  });

  it("omits sourceExerciseLevel when not provided", () => {
    const q: ExerciseQuestion = {
      id: "q4",
      type: "fill",
      prompt: "Fill",
      answer: "x",
    };
    const s = sanitiseQuestion(q, { slug: "sl", skill: "vocabulary" });
    expect("sourceExerciseLevel" in s).toBe(false);
  });

  it("handles missing optional fields gracefully", () => {
    const q: ExerciseQuestion = {
      id: "q5",
      type: "fill",
      prompt: "Fill",
      answer: "yes",
    };
    const s = sanitiseQuestion(q, { slug: "s", skill: "reading" });
    expect(s.options).toBeUndefined();
    expect(s.pairs).toBeUndefined();
    expect(s.explanation).toBeUndefined();
  });
});
