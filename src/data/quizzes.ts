export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  successMessage: string;
  failureMessage: string;
}

export const QUIZZES: Record<string, QuizQuestion> = {
  LevelMona: {
    prompt:
      "What makes GitHub Copilot Proficiency different from a traditional certification?",
    options: [
      "It requires completing a timed coding assessment.",
      "It verifies proficiency based on how you use GitHub Copilot in real-world workflows.",
      "It awards credentials based on completed GitHub Learn courses.",
      "It requires a manager to validate your technical skills.",
    ],
    correctIndex: 1,
    successMessage:
      "Correct! GitHub Copilot Proficiency is based on verified product usage rather than a traditional exam, providing a new way to demonstrate your experience with AI-assisted development.",
    failureMessage:
      "Not quite — GitHub Copilot Proficiency is based on verified product usage rather than a traditional exam.",
  },
  LevelDucky: {
    prompt:
      "Which GitHub Copilot Proficiency levels are eligible for a Microsoft Pro Badge credential?",
    options: [
      "Beginner, Intermediate, and Proficient",
      "All five proficiency levels",
      "Proficient, Advanced, and Expert",
      "Only Expert",
    ],
    correctIndex: 2,
    successMessage:
      "Correct! While the proficiency model includes five levels, Microsoft Pro Badge credentials recognize users who achieve Proficient, Advanced, or Expert.",
    failureMessage:
      "Not quite — Microsoft Pro Badge credentials recognize Proficient, Advanced, or Expert.",
  },
  LevelCopilot: {
    prompt:
      "You've earned a Microsoft Pro Badge for GitHub Copilot. What does this credential represent?",
    options: [
      "You've completed every available GitHub Copilot training course.",
      "You're certified to administer GitHub Copilot for an entire organization.",
      "You've demonstrated a verified level of proficiency using GitHub Copilot.",
      "You've achieved the highest possible proficiency in all AI development tools.",
    ],
    correctIndex: 2,
    successMessage:
      "Correct! Microsoft Pro Badge recognizes verified proficiency with GitHub Copilot, without requiring a traditional certification exam.",
    failureMessage:
      "Not quite — it recognizes verified proficiency with GitHub Copilot, not a traditional certification.",
  },
};
