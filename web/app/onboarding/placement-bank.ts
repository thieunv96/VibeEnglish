// Static placement bank for phase 1. Pha 2 sẽ thay bằng AI customize theo mục tiêu.
export type PlacementQuestion = {
  id: string;
  skill: "vocabulary" | "grammar" | "reading" | "listening";
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  question: string;
  options: string[];
  correctIndex: number;
};

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "p1",
    skill: "vocabulary",
    level: "A1",
    question: "What is the opposite of 'happy'?",
    options: ["Sad", "Tall", "Fast", "Old"],
    correctIndex: 0,
  },
  {
    id: "p2",
    skill: "grammar",
    level: "A1",
    question: "She ___ to school every day.",
    options: ["go", "goes", "going", "gone"],
    correctIndex: 1,
  },
  {
    id: "p3",
    skill: "reading",
    level: "A2",
    question: "Read: 'Tom usually drinks coffee in the morning.' When does Tom drink coffee?",
    options: ["At night", "In the afternoon", "In the morning", "At noon"],
    correctIndex: 2,
  },
  {
    id: "p4",
    skill: "listening",
    level: "A2",
    question: "Which sentence means 'Tôi đã ăn sáng rồi'?",
    options: ["I will eat breakfast", "I am eating breakfast", "I had breakfast already", "I want breakfast"],
    correctIndex: 2,
  },
  {
    id: "p5",
    skill: "grammar",
    level: "B1",
    question: "If I ___ more time, I would learn another language.",
    options: ["have", "had", "would have", "having"],
    correctIndex: 1,
  },
  {
    id: "p6",
    skill: "vocabulary",
    level: "B1",
    question: "Choose the word closest in meaning to 'reluctant':",
    options: ["Eager", "Hesitant", "Confident", "Excited"],
    correctIndex: 1,
  },
  {
    id: "p7",
    skill: "reading",
    level: "B1",
    question: "'Sales rose by 15% last quarter, driven mainly by overseas demand.' What pushed sales up?",
    options: ["Local demand", "Price cuts", "Demand from abroad", "Marketing"],
    correctIndex: 2,
  },
  {
    id: "p8",
    skill: "listening",
    level: "B2",
    question: "In a meeting, 'Let's circle back to that next week' likely means:",
    options: [
      "Let's repeat that now",
      "Let's discuss it later",
      "Let's stop discussing it",
      "Let's vote on it",
    ],
    correctIndex: 1,
  },
  {
    id: "p9",
    skill: "grammar",
    level: "B2",
    question: "By the time we arrived, the meeting ___.",
    options: ["has started", "had started", "starts", "is starting"],
    correctIndex: 1,
  },
  {
    id: "p10",
    skill: "vocabulary",
    level: "B2",
    question: "An 'ambiguous' statement is one that:",
    options: ["Is clear", "Has multiple meanings", "Is wrong", "Is short"],
    correctIndex: 1,
  },
  {
    id: "p11",
    skill: "reading",
    level: "C1",
    question:
      "'The proposal, albeit controversial, garnered support from a slim majority.' This means support was:",
    options: ["Very strong", "Unanimous", "Barely enough", "Non-existent"],
    correctIndex: 2,
  },
  {
    id: "p12",
    skill: "grammar",
    level: "C1",
    question: "Hardly ___ when the phone rang.",
    options: ["had he sat down", "he had sat down", "he sat down", "did he sat down"],
    correctIndex: 0,
  },
  {
    id: "p13",
    skill: "vocabulary",
    level: "C1",
    question: "To 'mitigate' a risk means to:",
    options: ["Increase it", "Ignore it", "Reduce its severity", "Document it"],
    correctIndex: 2,
  },
  {
    id: "p14",
    skill: "listening",
    level: "B1",
    question: "Choose the politest version:",
    options: [
      "Give me the report.",
      "I want the report now.",
      "Could you send me the report when you have a moment?",
      "Report. Now.",
    ],
    correctIndex: 2,
  },
  {
    id: "p15",
    skill: "vocabulary",
    level: "A2",
    question: "Pick the word that does NOT belong:",
    options: ["Apple", "Banana", "Carrot", "Orange"],
    correctIndex: 2,
  },
  {
    id: "p16",
    skill: "grammar",
    level: "A2",
    question: "There ___ many people at the party last night.",
    options: ["was", "were", "is", "are"],
    correctIndex: 1,
  },
  {
    id: "p17",
    skill: "reading",
    level: "B2",
    question:
      "'Despite missing the deadline, the team delivered a polished product.' What is implied?",
    options: [
      "The team delivered on time",
      "The product was poor",
      "The product was good even though late",
      "The team gave up",
    ],
    correctIndex: 2,
  },
  {
    id: "p18",
    skill: "listening",
    level: "C1",
    question: "'Read between the lines' means:",
    options: [
      "Skim quickly",
      "Understand the implicit meaning",
      "Read aloud",
      "Read only headings",
    ],
    correctIndex: 1,
  },
  {
    id: "p19",
    skill: "grammar",
    level: "B1",
    question: "She suggested ___ a break.",
    options: ["to take", "taking", "take", "takes"],
    correctIndex: 1,
  },
  {
    id: "p20",
    skill: "vocabulary",
    level: "B2",
    question: "A 'meticulous' person is:",
    options: ["Careless", "Very detail-oriented", "Loud", "Generous"],
    correctIndex: 1,
  },
];
