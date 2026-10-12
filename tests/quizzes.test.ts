import { describe, it, expect } from "vitest";
import { QUIZZES } from "../src/data/quizzes";

describe("QUIZZES dataset", () => {
  it("has a question for each of the three story levels", () => {
    expect(Object.keys(QUIZZES).sort()).toEqual([
      "LevelCopilot",
      "LevelDucky",
      "LevelMona",
    ]);
  });

  for (const [key, q] of Object.entries(QUIZZES)) {
    describe(key, () => {
      it("has a non-empty prompt", () => {
        expect(q.prompt.trim().length).toBeGreaterThan(10);
      });
      it("has at least two distinct options", () => {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size).toBe(q.options.length);
      });
      it("correctIndex points to a real option", () => {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      });
      it("provides success and failure feedback", () => {
        expect(q.successMessage.length).toBeGreaterThan(0);
        expect(q.failureMessage.length).toBeGreaterThan(0);
      });
    });
  }

  it("uses the verified Copilot Proficiency answers", () => {
    const pick = (k: string) => QUIZZES[k].options[QUIZZES[k].correctIndex];
    expect(pick("LevelMona")).toBe(
      "It verifies proficiency based on how you use GitHub Copilot in real-world workflows.",
    );
    expect(pick("LevelDucky")).toBe("Proficient, Advanced, and Expert");
    expect(pick("LevelCopilot")).toBe(
      "You've demonstrated a verified level of proficiency using GitHub Copilot.",
    );
  });
});
