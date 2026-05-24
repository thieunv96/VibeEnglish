#!/usr/bin/env node
// Generates lesson + exercise JSON files under src/content/
// from compact source data below. Idempotent — overwrites files.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "src", "content");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

function splitSegments(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ text: s }));
}

function lesson(category, slug, title, level, body, description) {
  const segments = splitSegments(body);
  return {
    file: path.join(ROOT, "lessons", category, `${slug}.json`),
    data: {
      slug,
      title,
      level,
      category,
      description: description ?? "",
      segments,
      transcript: body,
    },
  };
}

// =============================================
// LESSONS
// =============================================

const LESSONS = [
  // ===== Short Stories =====
  lesson("short-stories", "the-fox-and-the-grapes", "The Fox and the Grapes", "A1",
    "A hungry fox sees some grapes hanging from a high vine. He jumps to reach them. He tries again and again. The grapes are too high. The fox cannot reach them. Finally he gives up. He walks away. He says, “They are probably sour anyway.”",
    "Aesop's classic fable. Perfect for absolute beginners."),
  lesson("short-stories", "the-lion-and-the-mouse", "The Lion and the Mouse", "A1",
    "A lion is sleeping in the forest. A small mouse runs over his paw. The lion wakes up and catches the mouse. The mouse says, “Please let me go. One day I will help you.” The lion laughs but lets him go. Later, the lion is caught in a hunter's net. The little mouse hears him. The mouse chews the rope and frees the lion. Small friends can be great friends.",
    "Kindness pays back. A beginner-friendly fable."),
  lesson("short-stories", "the-tortoise-and-the-hare", "The Tortoise and the Hare", "A2",
    "A fast hare laughs at a slow tortoise. “You are so slow!” he says. The tortoise smiles and says, “Let us have a race.” The race begins. The hare runs fast and is far ahead. He decides to take a nap under a tree. The tortoise walks slowly but never stops. When the hare wakes up, the tortoise is already at the finish line. Slow and steady wins the race.",
    "A classic moral story for early learners."),
  lesson("short-stories", "a-rainy-saturday", "A Rainy Saturday", "A2",
    "It was raining on Saturday morning. Lisa wanted to go to the park, but she could not. She made hot chocolate and read her favourite book by the window. Her cat sat on her lap. The rain made a soft sound on the roof. After lunch, the sun came out. Lisa put on her boots and walked to the park. The grass was wet and the air smelled fresh. It was a good day after all.",
    "A short narrative for A2 learners."),
  lesson("short-stories", "the-lost-key", "The Lost Key", "B1",
    "When Daniel got home from work, he reached into his pocket for his key. It wasn't there. He checked his bag. Nothing. He retraced his steps to the bus stop, then to the café where he had bought coffee. The barista smiled. “Are you looking for this?” she asked, holding up a small silver key. Daniel laughed with relief. He had left it on the counter next to his cup. He thanked her and walked home in the warm afternoon light.",
    "Everyday vocabulary in past tense."),
  lesson("short-stories", "the-night-train", "The Night Train", "B2",
    "The night train pulled out of the station just before midnight. Sofia found her seat by the window and watched the platform slide away. Outside, the city lights blurred into streaks of gold. She had taken this train many times, but tonight felt different. In her bag was a letter she had been carrying for weeks — one she still hadn't read. She took it out and stared at the unfamiliar handwriting on the envelope. Then, slowly, she opened it.",
    "Atmospheric short story. Intermediate vocabulary and pacing."),

  // ===== Conversations =====
  lesson("conversations", "ordering-coffee", "Ordering Coffee", "A1",
    "Hi, can I have a cappuccino, please? Sure. What size would you like? A medium, please. Anything else? No, that's all. That will be three dollars fifty. Here you go. Thank you. Have a nice day!",
    "A simple café dialogue."),
  lesson("conversations", "asking-for-directions", "Asking for Directions", "A2",
    "Excuse me, how do I get to the train station? Go straight for two blocks, then turn left at the bank. The station is on your right. Is it far? About a ten-minute walk. Thank you so much. You're welcome.",
    "Practical street English."),
  lesson("conversations", "at-the-doctors-office", "At the Doctor's Office", "B1",
    "Good morning. What seems to be the problem? I have had a sore throat for three days and a slight fever. Have you been taking anything? Just some warm tea. Let me have a look. Open wide. It does look a bit red. I will prescribe an antibiotic. Take one tablet twice a day with food. Thank you, doctor.",
    "Healthcare conversation. Useful vocabulary for visits."),
  lesson("conversations", "job-interview-intro", "Job Interview — Introductions", "B2",
    "Thank you for coming in today. It's a pleasure to meet you. Tell me a little about your background. Sure. I studied computer science and have been working as a backend engineer for the last four years. What attracted you to this role? Honestly, your team's work on distributed systems is some of the most interesting I have seen. I would love to contribute. That's great to hear. Let me tell you a bit about the team.",
    "Professional English for interviews."),
  lesson("conversations", "small-talk-at-work", "Small Talk at Work", "B1",
    "Morning! How was your weekend? Pretty good, thanks. I finally got around to fixing my bike. Nice. Did you go for a ride? Just a short one. The weather was perfect. I went hiking with my family. Sounds lovely. Where did you go? Up to the lake. The leaves are starting to turn. We should go before they fall.",
    "Casual office conversation."),
  lesson("conversations", "booking-a-hotel", "Booking a Hotel by Phone", "A2",
    "Hello, I would like to book a room for two nights. Of course. When would you like to arrive? Friday the eighth. We have a double room available. How much per night? It's ninety dollars including breakfast. That sounds good. I'll take it. Could I have your name and credit card number, please? Sure.",
    "Phone English for travel."),

  // ===== TED-Ed =====
  lesson("ted-ed", "why-do-we-dream", "Why Do We Dream?", "B1",
    "Every night your brain creates worlds, populates them with people, and writes their dialogue. We call this dreaming, and after thousands of years of wondering, we still don't fully understand why we do it. Some scientists think dreams help us process emotions. Others say they are how our brain consolidates memories from the day. Still others believe dreams are a kind of mental rehearsal for real-world threats. What we know is this: nearly every human dreams, and dreams seem to be essential to a healthy mind.",
    "Inspired by TED-Ed style explainer videos."),
  lesson("ted-ed", "the-power-of-habits", "The Power of Habits", "B2",
    "Habits are routines that we perform almost automatically. Brushing your teeth, checking your phone, taking the same route to work — your brain handles these tasks with very little conscious thought. This is efficient, but it can also be a trap. Bad habits form the same way good ones do, through repetition. The good news is that you can rewire them. The key is identifying the cue that triggers the habit, then replacing the routine while keeping the same reward.",
    "Pop psychology — intermediate vocabulary."),
  lesson("ted-ed", "how-vaccines-work", "How Vaccines Work", "B2",
    "A vaccine teaches your immune system to recognize a threat before it actually arrives. It contains a weakened, dead, or piece-of-a virus or bacterium. When your body encounters it, special cells learn the threat's shape. They produce antibodies, which are tiny proteins that latch onto the invader. Later, if the real pathogen shows up, your immune system already knows what to do. It mounts a fast, targeted response — often before you even feel sick.",
    "Basic immunology, accessible English."),
  lesson("ted-ed", "the-history-of-the-alphabet", "The History of the Alphabet", "B1",
    "The alphabet we use today travelled a long way to reach us. It began with the Egyptians, who drew small pictures to represent sounds. The Phoenicians simplified these into about twenty-two letters. The Greeks borrowed it and added vowels. The Romans adapted the Greek letters into the form we still use. Every letter on this page has been on a journey of thousands of years.",
    "Mini-history of writing systems."),
  lesson("ted-ed", "what-causes-thunder", "What Causes Thunder?", "B1",
    "Thunder is the sound that lightning makes. When lightning flashes, it heats the air around it to incredibly high temperatures in a fraction of a second. The air expands explosively, creating a shockwave we hear as thunder. Because light travels faster than sound, we see the lightning before we hear the thunder. You can roughly estimate the distance: every three seconds between the flash and the boom is about one kilometre.",
    "Simple natural science."),
  lesson("ted-ed", "the-science-of-laughter", "The Science of Laughter", "B2",
    "Laughter looks simple, but it's surprisingly complex. It involves dozens of facial muscles, sudden breathing changes, and a flood of feel-good chemicals in the brain. We rarely laugh alone — most laughter happens in social settings, and it often has nothing to do with humour. It's a kind of social glue. Babies laugh long before they can speak. People laugh more with friends than with strangers. Laughter, it seems, is older and deeper than language.",
    "Behavioural science in plain English."),

  // ===== YouTube Random =====
  lesson("youtube-random", "morning-routines", "Morning Routines of Successful People", "B1",
    "What you do in the first hour after you wake up shapes the rest of your day. Many high-performers share similar habits. They get up early. They drink water before coffee. They move their body, even if only for ten minutes. They write down three things they want to accomplish. None of these habits are magic on their own, but together they build momentum.",
    "Self-improvement video transcript."),
  lesson("youtube-random", "how-to-take-better-photos", "How to Take Better Photos", "A2",
    "You don't need an expensive camera to take great photos. The most important thing is light. Try to shoot during the golden hour — the hour after sunrise or before sunset. Use the rule of thirds. Imagine your image divided into a three-by-three grid and place your subject on one of the lines. Get closer than you think you need to. And keep practicing.",
    "Photography tips video."),
  lesson("youtube-random", "explained-cryptocurrency", "Cryptocurrency, Explained Simply", "B2",
    "Cryptocurrency is digital money that doesn't depend on a bank. Instead, it lives on a network of computers around the world that all keep the same record of transactions. This record is called a blockchain. When you send cryptocurrency, the network confirms the transaction and adds it to this shared ledger. Because no single computer controls it, it's hard for anyone to fake transactions or take your money without permission.",
    "Tech explainer transcript."),
  lesson("youtube-random", "cooking-pasta-perfectly", "How to Cook Pasta Perfectly", "A2",
    "First, use a big pot with plenty of water. The pasta needs room to move. Add a generous amount of salt — the water should taste like the sea. Bring it to a rolling boil before you add the pasta. Stir it once after thirty seconds so the pieces don't stick. Cook until al dente — firm to the bite. Save a cup of pasta water before you drain. It's the secret to a silky sauce.",
    "Cooking video for everyday learners."),
  lesson("youtube-random", "study-tips-college", "Study Tips for College Students", "B1",
    "Don't just read your notes — test yourself. This is called active recall, and it works better than re-reading every time. Use spaced repetition: review material a day later, then three days later, then a week later. Sleep matters more than late-night cramming. And take breaks. Your brain consolidates information when you step away from the desk.",
    "Education video."),
  lesson("youtube-random", "travel-on-a-budget", "Travel on a Budget", "B2",
    "Cheap travel isn't about suffering — it's about being flexible. Book flights mid-week and travel in the shoulder season. Use local public transport instead of taxis. Eat where the locals eat — markets, food courts, neighbourhood diners. Stay in family-run guesthouses or hostels with private rooms. And remember: the best memories almost never come from the most expensive experiences.",
    "Travel YouTuber-style transcript."),

  // ===== TOEIC Listening =====
  lesson("toeic-listening", "office-meeting", "Office Meeting Announcement", "B1",
    "Good morning, everyone. Just a quick reminder that our quarterly review meeting will be held in conference room B at two o'clock this afternoon. Please bring your project updates and any questions you may have. Lunch will not be provided, but coffee and snacks will be available outside the room. The meeting should take about ninety minutes.",
    "TOEIC Part 4 style monologue."),
  lesson("toeic-listening", "phone-message-vendor", "Vendor Phone Message", "B1",
    "Hi, this is David from Acme Supplies returning your call about the order. I checked our inventory, and we do have the items you requested in stock. We can ship them out tomorrow morning by express delivery. The total comes to four hundred and twenty dollars, including shipping. Please give me a call back at your earliest convenience to confirm.",
    "TOEIC Part 4 — voicemail."),
  lesson("toeic-listening", "airport-announcement", "Airport Announcement", "A2",
    "Attention all passengers. Flight DL one zero five to Tokyo will begin boarding shortly at gate fifteen. Passengers travelling with small children or requiring assistance are invited to board first. Please have your boarding pass and identification ready. Thank you for choosing Delta Airlines.",
    "TOEIC Part 4 — announcement."),
  lesson("toeic-listening", "product-launch", "Product Launch Presentation", "B2",
    "Thank you all for joining us today. We're excited to introduce our new line of wireless earbuds. They feature active noise cancellation, eight hours of battery life, and seamless Bluetooth pairing with all major devices. They will retail at one hundred and forty nine dollars and will be available in three colors starting next month. Pre-orders begin today on our website.",
    "TOEIC Part 4 — business talk."),
  lesson("toeic-listening", "training-session", "New Employee Training", "B1",
    "Welcome to your first day at the company. This morning we will cover the basics of our internal software. After lunch, you will meet with your team lead for a one-on-one session. Tomorrow's schedule includes a tour of the building and a meeting with the HR department to complete any remaining paperwork. If you have questions at any point, please don't hesitate to ask.",
    "TOEIC Part 4 — workplace talk."),
  lesson("toeic-listening", "weather-report", "Weather Report", "A2",
    "Good evening. Here is your local forecast. Tonight will be cool and clear with a low of twelve degrees. Tomorrow expect partly cloudy skies in the morning followed by light showers in the afternoon. Highs will reach twenty-one degrees. The weekend looks sunny and warm, with temperatures climbing into the mid-twenties.",
    "TOEIC Part 4 — weather/news."),

  // ===== TOEFL Listening =====
  lesson("toefl-listening", "lecture-on-ecosystems", "Lecture: Ecosystems", "B2",
    "Today we'll discuss ecosystems. An ecosystem is a community of living organisms interacting with their physical environment. It includes plants, animals, microorganisms, and the soil, water, and air around them. Energy enters the system through sunlight, which plants convert into chemical energy through photosynthesis. This energy then moves up the food chain. When organisms die, decomposers break them down, returning nutrients to the soil. The cycle continues.",
    "TOEFL academic lecture excerpt."),
  lesson("toefl-listening", "campus-conversation", "Campus Conversation: Registration", "B1",
    "Hi, can you help me? I'm trying to register for Professor Lin's economics class but it says it's full. Let me check. Yes, the lecture is full, but there's a waitlist. You can add your name and you'll be notified if a spot opens up. How likely is that? Honestly, this class usually has some turnover in the first week. I'd say your chances are reasonable. Okay, please add me. Could I also see the syllabus while I wait?",
    "TOEFL campus dialogue."),
  lesson("toefl-listening", "lecture-on-renaissance", "Lecture: The Renaissance", "C1",
    "The Renaissance was not a sudden event but a gradual cultural transformation that began in Italy in the fourteenth century and spread across Europe over the next three hundred years. It was characterized by a renewed interest in classical antiquity, a flowering of art and science, and the emergence of new ideas about the individual. Figures like Leonardo da Vinci and Michelangelo redefined what an artist could be. Meanwhile, the printing press allowed ideas to spread faster than ever before, accelerating change.",
    "TOEFL humanities lecture."),
  lesson("toefl-listening", "lecture-on-glaciers", "Lecture: Glaciers", "B2",
    "Glaciers are massive bodies of slowly moving ice. They form in regions where snowfall exceeds melting over many years. As new snow accumulates, it compresses the layers below into dense ice. Under their own enormous weight, glaciers begin to flow downhill, often carving deep valleys as they move. As global temperatures rise, many glaciers are retreating at unprecedented rates. This has significant implications for sea levels and freshwater supplies worldwide.",
    "TOEFL earth-science lecture."),
  lesson("toefl-listening", "office-hours", "Professor Office Hours", "B2",
    "Come in. Hi Professor, I had a question about the assignment. Sure, what's on your mind? The prompt asks us to compare two theories, but I'm not sure how detailed the comparison should be. Good question. Don't try to cover everything. Pick two or three specific points where the theories differ, and analyze those in depth. Quality over quantity. Got it. Thank you. Is it okay to use sources beyond the reading list? Yes, as long as they're peer-reviewed.",
    "TOEFL student-professor dialogue."),
  lesson("toefl-listening", "lecture-on-music", "Lecture: Origins of Jazz", "B2",
    "Jazz emerged in the late nineteenth and early twentieth centuries in New Orleans. It grew out of a blend of African rhythms, blues, ragtime, and European harmonic structures. What made jazz distinct was its emphasis on improvisation — musicians would take a melody and reinterpret it in real time. By the nineteen twenties, jazz had spread north to Chicago and New York, and then around the world. It transformed popular music forever.",
    "TOEFL arts lecture."),

  // ===== IELTS Listening =====
  lesson("ielts-listening", "library-tour", "Library Tour for New Students", "B1",
    "Welcome to the university library. The ground floor houses the main collection and study spaces. Reference materials are kept on the first floor, where silence is strictly required. The second floor has group study rooms which can be booked online in two-hour slots. Computers are available on every floor. Printing is on the ground floor and costs five pence per page. The library is open from eight in the morning until midnight, every day during term time.",
    "IELTS Section 1 style monologue."),
  lesson("ielts-listening", "housing-enquiry", "Housing Enquiry", "B1",
    "Hello, I'm calling about the room advertised in the local paper. Of course. Are you a student? Yes, I'm starting at the university in September. The room is on the first floor, fully furnished, and bills are included. The rent is six hundred pounds per month. Is there a deposit? Yes, one month's rent in advance. When can I view the room? Would Saturday at two work for you? Perfect.",
    "IELTS Section 1 — phone call."),
  lesson("ielts-listening", "lecture-on-urban-planning", "Lecture: Urban Planning", "B2",
    "Urban planning is the discipline of shaping cities. It involves decisions about land use, transportation, housing, and public space. Good planning makes cities more livable; poor planning creates congestion, pollution, and inequality. Modern urban planners face new challenges: climate change, ageing populations, and rapid urbanization in developing countries. Many cities are now investing in green spaces, public transit, and mixed-use neighbourhoods.",
    "IELTS Section 4 academic talk."),
  lesson("ielts-listening", "tour-of-castle", "Castle Tour", "B1",
    "Welcome to Edgmont Castle, built in the twelfth century. We will begin in the great hall, where banquets were held. From there we'll move to the kitchens, then up to the chapel. The tour finishes in the gardens. Please stay with the group and do not touch the displays. Photography is permitted everywhere except in the chapel. The tour lasts approximately one hour. Are there any questions before we begin?",
    "IELTS — guided tour transcript."),
  lesson("ielts-listening", "course-registration", "Course Registration Conversation", "B2",
    "I'd like to enrol in the diploma programme. Of course. Have you completed the entry assessment? Yes, I scored seven out of ten. Excellent. You qualify for the standard pathway. The programme is two years, with classes on Tuesday and Thursday evenings. The total fee is three thousand four hundred pounds, payable in instalments. There's also a one hundred pound registration fee due today. Can I pay by card? Yes, that's fine.",
    "IELTS Section 1 dialogue."),
  lesson("ielts-listening", "lecture-on-water", "Lecture: Water Scarcity", "B2",
    "Water scarcity affects more than two billion people around the world. It has two main forms: physical scarcity, where simply not enough water exists, and economic scarcity, where water exists but infrastructure is inadequate. Solutions include better irrigation, desalination, water recycling, and most importantly, changes in agricultural practices. Around seventy percent of all freshwater is used for farming, so even small efficiency improvements can have a major impact.",
    "IELTS environment lecture."),

  // ===== Medical English / OET =====
  lesson("medical-english-oet", "patient-history-chest-pain", "Taking a History — Chest Pain", "B2",
    "Good morning, Mr. Carter. I'm Doctor Lee. Can you tell me what brought you in today? I've been having chest pain for about a week. Can you describe the pain? It's a tight, squeezing feeling, right in the centre. Does anything make it worse? Yes, climbing stairs. And does it go anywhere — your arm, your jaw? Sometimes down my left arm. Any shortness of breath? A little. Okay, we need to run some tests right away.",
    "OET style consultation."),
  lesson("medical-english-oet", "nurse-handover", "Nurse Handover Report", "B2",
    "This is Mrs. Patel in bed four. She was admitted yesterday with pneumonia. Her oxygen saturation has improved overnight, currently at ninety-six percent on two litres. She's afebrile this morning. IV antibiotics are continuing — second dose due at ten. She's eating small meals and tolerating fluids. Her family will visit this afternoon. No social work referral has been made yet.",
    "OET nursing handover."),
  lesson("medical-english-oet", "explaining-diagnosis", "Explaining a Diagnosis", "C1",
    "Mr. Singh, I have your test results. The biopsy confirms that the lump is a type of cancer called ductal carcinoma. I know this is difficult to hear. The good news is that we caught it early, which means treatment options are very good. We typically begin with surgery to remove the affected tissue, followed by either radiation or chemotherapy depending on the final pathology. I'd like to refer you to an oncologist this week to discuss the plan in detail.",
    "OET sensitive communication."),
  lesson("medical-english-oet", "prescribing-medication", "Prescribing Medication", "B2",
    "I'm prescribing an antibiotic called amoxicillin. You'll take five hundred milligrams three times a day with food. The full course is seven days. It's important to finish all the tablets, even if you start feeling better. Possible side effects include mild stomach upset or diarrhoea. If you develop a rash or have difficulty breathing, stop the medication immediately and contact us. Do you have any allergies I should know about?",
    "OET prescribing dialogue."),
  lesson("medical-english-oet", "discharge-instructions", "Discharge Instructions", "B2",
    "Before you leave, I want to go over your discharge instructions. Continue the pain medication as prescribed, but try to wean off it within a week. Keep the wound dry for forty-eight hours. After that, you can shower normally. Avoid heavy lifting for two weeks. We've scheduled a follow-up appointment for next Tuesday. If you notice increased redness, swelling, or fever, please contact us straight away.",
    "OET post-procedure communication."),
  lesson("medical-english-oet", "discussing-symptoms", "Discussing Vague Symptoms", "B2",
    "I just haven't been feeling right for a few weeks. Can you tell me more? It's hard to describe. I'm tired all the time, even after sleeping. I've lost a bit of weight without trying. How much weight? About four kilos. Any other changes — appetite, mood, bowel habits? My appetite is okay, but I've felt more anxious than usual. Okay, let's run some blood work and see what we find. There are several possibilities, and we'll work through them step by step.",
    "OET — open-ended consultation."),

  // ===== Stories for Kids =====
  lesson("stories-for-kids", "the-little-red-hen", "The Little Red Hen", "A1",
    "Once upon a time, a little red hen found some wheat. Who will help me plant it? she asked. Not I, said the cat. Not I, said the dog. Then I will do it myself, she said. She planted, watered, and cut the wheat. She baked the bread. Who will help me eat it? she asked. I will, said the cat. I will, said the dog. No, said the little red hen. I will eat it all by myself. And she did.",
    "Classic children's tale."),
  lesson("stories-for-kids", "goldilocks-and-the-three-bears", "Goldilocks and the Three Bears", "A1",
    "A little girl named Goldilocks walked into a house in the forest. On the table were three bowls of porridge. She tasted them. One was too hot. One was too cold. One was just right. She ate it all up. Then she sat in three chairs. One was too big. One was too small. One was just right. But it broke! Tired, she went upstairs and lay on three beds. One was too hard. One was too soft. One was just right. She fell asleep. Then the bears came home!",
    "Classic fairy tale, simple English."),
  lesson("stories-for-kids", "the-three-little-pigs", "The Three Little Pigs", "A1",
    "Three little pigs left home to build their own houses. The first pig built a house of straw. The second pig built a house of sticks. The third pig built a strong house of bricks. A big bad wolf came. He blew down the straw house. He blew down the stick house. But the brick house was strong. He could not blow it down. The pigs were safe inside.",
    "Beloved children's story."),
  lesson("stories-for-kids", "the-ugly-duckling", "The Ugly Duckling", "A2",
    "Once a baby bird was born in a duck family. He looked different from his brothers and sisters. They laughed at him and called him ugly. He felt sad and ran away. He spent the long winter alone. When spring came, he saw beautiful white birds on the lake. To his surprise, his reflection in the water was also a beautiful white swan. He had grown into the most beautiful bird of all.",
    "Hans Christian Andersen retold simply."),
  lesson("stories-for-kids", "jack-and-the-beanstalk", "Jack and the Beanstalk", "A2",
    "Jack lived with his mother. They were very poor. One day, Jack traded their cow for five magic beans. His mother was angry and threw the beans out of the window. In the morning, a giant beanstalk had grown up to the sky. Jack climbed up. At the top, he found a giant's castle. He took a golden harp and ran back down. The giant chased him. Jack chopped down the beanstalk and the giant fell. Jack and his mother were never poor again.",
    "Classic children's adventure."),
  lesson("stories-for-kids", "the-gingerbread-man", "The Gingerbread Man", "A1",
    "An old woman baked a gingerbread man. When she opened the oven, he jumped out and ran away. Run, run, as fast as you can! You can't catch me, I'm the gingerbread man! He ran past a cow. He ran past a horse. They all chased him. He came to a river. A fox said, I will carry you across. The gingerbread man climbed on. In the middle of the river, the fox ate him. And that was the end of the gingerbread man.",
    "Famous children's chase story."),
];

// =============================================
// EXERCISES
// =============================================

function exercise(skill, slug, title, level, type, questions, description) {
  return {
    file: path.join(ROOT, "exercises", skill, `${slug}.json`),
    data: {
      slug,
      title,
      level,
      skill,
      type,
      description: description ?? "",
      questions,
    },
  };
}

const EXERCISES = [
  // ===== Grammar =====
  exercise("grammar", "present-simple-vs-continuous", "Present Simple vs Present Continuous", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "She ____ to work every day.", options: ["go", "goes", "is going", "gone"], answer: "goes", explanation: "Present simple for habitual actions." },
    { id: "q2", type: "mcq", prompt: "Right now, I ____ a book.", options: ["read", "reads", "am reading", "have read"], answer: "am reading", explanation: "Present continuous for now." },
    { id: "q3", type: "mcq", prompt: "Water ____ at 100°C.", options: ["boils", "is boiling", "boil", "boiling"], answer: "boils", explanation: "General truth → present simple." },
    { id: "q4", type: "mcq", prompt: "Look! It ____.", options: ["rains", "is raining", "rain", "rained"], answer: "is raining", explanation: "Happening now → present continuous." },
    { id: "q5", type: "mcq", prompt: "They usually ____ dinner at 7 pm.", options: ["have", "are having", "has", "having"], answer: "have", explanation: "Routine → present simple." },
  ], "Practice the two most common present tenses."),

  exercise("grammar", "past-simple-irregular-verbs", "Past Simple: Irregular Verbs", "A2", "fill", [
    { id: "q1", type: "fill", prompt: "Yesterday I ____ (go) to the cinema.", answer: "went" },
    { id: "q2", type: "fill", prompt: "She ____ (see) him last week.", answer: "saw" },
    { id: "q3", type: "fill", prompt: "We ____ (eat) pizza for dinner.", answer: "ate" },
    { id: "q4", type: "fill", prompt: "He ____ (take) the bus home.", answer: "took" },
    { id: "q5", type: "fill", prompt: "They ____ (buy) a new car.", answer: "bought" },
  ]),

  exercise("grammar", "articles-a-an-the", "Articles: a / an / the", "A1", "mcq", [
    { id: "q1", type: "mcq", prompt: "I saw ____ elephant at the zoo.", options: ["a", "an", "the", "—"], answer: "an" },
    { id: "q2", type: "mcq", prompt: "She is ____ best singer in the school.", options: ["a", "an", "the", "—"], answer: "the" },
    { id: "q3", type: "mcq", prompt: "I'd like ____ apple, please.", options: ["a", "an", "the", "—"], answer: "an" },
    { id: "q4", type: "mcq", prompt: "He plays ____ guitar every weekend.", options: ["a", "an", "the", "—"], answer: "the" },
    { id: "q5", type: "mcq", prompt: "There is ____ man at the door.", options: ["a", "an", "the", "—"], answer: "a" },
  ]),

  exercise("grammar", "conditionals-first-and-second", "First & Second Conditionals", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "If it rains tomorrow, we ____ at home.", options: ["stay", "will stay", "would stay", "stayed"], answer: "will stay" },
    { id: "q2", type: "mcq", prompt: "If I ____ rich, I would travel the world.", options: ["am", "was", "were", "will be"], answer: "were" },
    { id: "q3", type: "mcq", prompt: "She ____ pass if she studies.", options: ["will", "would", "is", "did"], answer: "will" },
    { id: "q4", type: "mcq", prompt: "If you heated ice, it ____.", options: ["melts", "would melt", "melted", "is melting"], answer: "would melt" },
    { id: "q5", type: "mcq", prompt: "If I ____ you, I would apologize.", options: ["am", "was", "were", "be"], answer: "were" },
  ]),

  exercise("grammar", "prepositions-of-time", "Prepositions of Time: in / on / at", "A2", "fill", [
    { id: "q1", type: "fill", prompt: "I was born ____ April.", answer: "in" },
    { id: "q2", type: "fill", prompt: "The meeting is ____ Monday.", answer: "on" },
    { id: "q3", type: "fill", prompt: "We arrived ____ 7 o'clock.", answer: "at" },
    { id: "q4", type: "fill", prompt: "She works ____ the morning.", answer: "in" },
    { id: "q5", type: "fill", prompt: "He'll call you ____ the weekend.", answer: "at" },
  ]),

  exercise("grammar", "modal-verbs-must-have-to", "Modal Verbs: must, have to, should", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "You ____ wear a helmet when riding a bike.", options: ["should", "could", "would", "might"], answer: "should" },
    { id: "q2", type: "mcq", prompt: "I ____ work tomorrow — it's my day off.", options: ["must", "have to", "don't have to", "should"], answer: "don't have to" },
    { id: "q3", type: "mcq", prompt: "The sign says you ____ smoke here.", options: ["mustn't", "don't have to", "couldn't", "wouldn't"], answer: "mustn't" },
    { id: "q4", type: "mcq", prompt: "You ____ try the new café — it's amazing.", options: ["must", "had to", "are", "would"], answer: "must" },
    { id: "q5", type: "mcq", prompt: "She ____ leave early because her train was at six.", options: ["had to", "must", "could", "would"], answer: "had to" },
  ]),

  // ===== Vocabulary =====
  exercise("vocabulary", "everyday-objects", "Everyday Objects", "A1", "match", [
    { id: "q1", type: "match", prompt: "Match each object with its use.", pairs: [
      { left: "pen", right: "to write" },
      { left: "umbrella", right: "for rain" },
      { left: "key", right: "to open doors" },
      { left: "phone", right: "to call people" },
    ], answer: "auto" },
  ]),

  exercise("vocabulary", "synonyms-basic", "Synonyms — Basic", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Choose the synonym of \"happy\".", options: ["sad", "angry", "glad", "tired"], answer: "glad" },
    { id: "q2", type: "mcq", prompt: "Choose the synonym of \"big\".", options: ["small", "large", "tiny", "short"], answer: "large" },
    { id: "q3", type: "mcq", prompt: "Choose the synonym of \"quick\".", options: ["slow", "fast", "loud", "quiet"], answer: "fast" },
    { id: "q4", type: "mcq", prompt: "Choose the synonym of \"begin\".", options: ["end", "stop", "start", "finish"], answer: "start" },
    { id: "q5", type: "mcq", prompt: "Choose the synonym of \"smart\".", options: ["clever", "kind", "tall", "weak"], answer: "clever" },
  ]),

  exercise("vocabulary", "phrasal-verbs-everyday", "Common Phrasal Verbs", "B1", "fill", [
    { id: "q1", type: "fill", prompt: "I usually wake ____ at 7 am.", answer: "up" },
    { id: "q2", type: "fill", prompt: "Please turn ____ the lights when you leave.", answer: "off" },
    { id: "q3", type: "fill", prompt: "We need to look ____ the kids tonight.", answer: "after" },
    { id: "q4", type: "fill", prompt: "She gave ____ smoking last year.", answer: "up" },
    { id: "q5", type: "fill", prompt: "I ran ____ an old friend yesterday.", answer: "into" },
  ]),

  exercise("vocabulary", "food-and-drink", "Food and Drink", "A1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Which is a fruit?", options: ["carrot", "apple", "potato", "onion"], answer: "apple" },
    { id: "q2", type: "mcq", prompt: "Which is a drink?", options: ["bread", "rice", "tea", "cheese"], answer: "tea" },
    { id: "q3", type: "mcq", prompt: "Which is a vegetable?", options: ["banana", "milk", "broccoli", "yogurt"], answer: "broccoli" },
    { id: "q4", type: "mcq", prompt: "Which is a meat?", options: ["lettuce", "chicken", "pasta", "honey"], answer: "chicken" },
    { id: "q5", type: "mcq", prompt: "Which is a dessert?", options: ["soup", "salad", "ice cream", "sandwich"], answer: "ice cream" },
  ]),

  exercise("vocabulary", "weather-adjectives", "Weather Adjectives", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "It's 35°C outside. The weather is ____.", options: ["freezing", "hot", "windy", "snowy"], answer: "hot" },
    { id: "q2", type: "mcq", prompt: "There are no clouds. The sky is ____.", options: ["clear", "rainy", "foggy", "stormy"], answer: "clear" },
    { id: "q3", type: "mcq", prompt: "The wind is very strong. It's ____.", options: ["calm", "humid", "windy", "icy"], answer: "windy" },
    { id: "q4", type: "mcq", prompt: "Water is falling from the sky. It's ____.", options: ["sunny", "raining", "snowing", "freezing"], answer: "raining" },
    { id: "q5", type: "mcq", prompt: "It's -10°C. The weather is ____.", options: ["mild", "warm", "freezing", "humid"], answer: "freezing" },
  ]),

  exercise("vocabulary", "office-vocabulary", "Office Vocabulary", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Where do you usually have meetings?", options: ["conference room", "kitchen", "garage", "bathroom"], answer: "conference room" },
    { id: "q2", type: "mcq", prompt: "A document you send by email is an ____.", options: ["attachment", "envelope", "stamp", "package"], answer: "attachment" },
    { id: "q3", type: "mcq", prompt: "Your boss is also called your ____.", options: ["client", "manager", "vendor", "competitor"], answer: "manager" },
    { id: "q4", type: "mcq", prompt: "A scheduled work appointment is an ____.", options: ["agenda", "meeting", "outage", "expense"], answer: "meeting" },
    { id: "q5", type: "mcq", prompt: "Pay you receive every month is your ____.", options: ["salary", "bill", "loan", "tax"], answer: "salary" },
  ]),

  // ===== Listening =====
  exercise("listening", "numbers-and-prices", "Numbers and Prices", "A1", "fill", [
    { id: "q1", type: "fill", prompt: "Type the number you hear: \"fifteen\"", answer: "15" },
    { id: "q2", type: "fill", prompt: "Type the number you hear: \"forty-two\"", answer: "42" },
    { id: "q3", type: "fill", prompt: "Type the price you hear: \"nine dollars fifty\"", answer: "$9.50" },
    { id: "q4", type: "fill", prompt: "Type the number you hear: \"one hundred and twenty\"", answer: "120" },
    { id: "q5", type: "fill", prompt: "Type the price you hear: \"twelve euros\"", answer: "€12" },
  ]),

  exercise("listening", "everyday-conversations", "Listening: Everyday Conversations", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "In a café: \"I'd like a cappuccino, please.\" — what did the customer order?", options: ["espresso", "cappuccino", "latte", "tea"], answer: "cappuccino" },
    { id: "q2", type: "mcq", prompt: "\"Turn left at the bank.\" — which direction was given?", options: ["right", "left", "straight", "back"], answer: "left" },
    { id: "q3", type: "mcq", prompt: "\"The train leaves at 8:45.\" — at what time?", options: ["8:15", "8:30", "8:45", "9:00"], answer: "8:45" },
    { id: "q4", type: "mcq", prompt: "\"I'll have the chicken salad.\" — what did they order?", options: ["beef burger", "vegetable soup", "chicken salad", "pasta"], answer: "chicken salad" },
    { id: "q5", type: "mcq", prompt: "\"It's about a ten-minute walk.\" — how long does it take?", options: ["5 min", "10 min", "15 min", "30 min"], answer: "10 min" },
  ]),

  exercise("listening", "weather-forecast", "Listening: Weather Forecast", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Tonight will be cool and ____.", options: ["rainy", "clear", "windy", "snowy"], answer: "clear" },
    { id: "q2", type: "mcq", prompt: "The low tonight is ____ degrees.", options: ["12", "21", "5", "0"], answer: "12" },
    { id: "q3", type: "mcq", prompt: "Tomorrow afternoon there will be ____.", options: ["snow", "fog", "showers", "thunder"], answer: "showers" },
    { id: "q4", type: "mcq", prompt: "The weekend will be sunny and ____.", options: ["cold", "warm", "windy", "humid"], answer: "warm" },
    { id: "q5", type: "mcq", prompt: "Weekend temperatures will be in the ____.", options: ["low teens", "high teens", "mid-twenties", "thirties"], answer: "mid-twenties" },
  ]),

  exercise("listening", "phone-message", "Listening: Phone Message", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Who is calling?", options: ["John from Acme", "David from Acme Supplies", "Sarah from Sales", "Mike from Support"], answer: "David from Acme Supplies" },
    { id: "q2", type: "mcq", prompt: "What is in stock?", options: ["nothing", "some items", "all items requested", "only one item"], answer: "all items requested" },
    { id: "q3", type: "mcq", prompt: "When will they ship?", options: ["today", "tomorrow morning", "next week", "Friday"], answer: "tomorrow morning" },
    { id: "q4", type: "mcq", prompt: "What is the total amount?", options: ["$320", "$420", "$520", "$620"], answer: "$420" },
    { id: "q5", type: "mcq", prompt: "What should you do next?", options: ["wait", "call back", "send an email", "visit the office"], answer: "call back" },
  ]),

  exercise("listening", "airport-announcements", "Listening: Airport Announcements", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Which flight is being announced?", options: ["DL 105", "DL 150", "DL 510", "DL 015"], answer: "DL 105" },
    { id: "q2", type: "mcq", prompt: "Where is the destination?", options: ["Seoul", "Tokyo", "Beijing", "Bangkok"], answer: "Tokyo" },
    { id: "q3", type: "mcq", prompt: "Which gate is it?", options: ["5", "15", "50", "55"], answer: "15" },
    { id: "q4", type: "mcq", prompt: "Who boards first?", options: ["business class only", "passengers with kids or assistance", "frequent flyers", "everyone"], answer: "passengers with kids or assistance" },
    { id: "q5", type: "mcq", prompt: "What do you need ready?", options: ["passport only", "ticket only", "boarding pass and ID", "nothing"], answer: "boarding pass and ID" },
  ]),

  exercise("listening", "lecture-on-ecosystems", "Listening: Lecture on Ecosystems", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "What is an ecosystem?", options: ["a single species", "a community of organisms with their environment", "a national park", "a food chain only"], answer: "a community of organisms with their environment" },
    { id: "q2", type: "mcq", prompt: "How does energy enter the system?", options: ["from soil", "from animals", "from sunlight", "from water"], answer: "from sunlight" },
    { id: "q3", type: "mcq", prompt: "What process do plants use?", options: ["respiration", "photosynthesis", "fermentation", "decomposition"], answer: "photosynthesis" },
    { id: "q4", type: "mcq", prompt: "Decomposers do what?", options: ["eat plants", "produce oxygen", "break down dead matter", "predate small animals"], answer: "break down dead matter" },
    { id: "q5", type: "mcq", prompt: "What returns to the soil?", options: ["sunlight", "nutrients", "predators", "carbon dioxide"], answer: "nutrients" },
  ]),

  // ===== Reading =====
  exercise("reading", "short-story-comprehension", "Reading: A Rainy Saturday", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "What was the weather like on Saturday morning?", options: ["sunny", "snowy", "rainy", "windy"], answer: "rainy" },
    { id: "q2", type: "mcq", prompt: "What did Lisa want to do?", options: ["read a book", "go to the park", "visit friends", "cook lunch"], answer: "go to the park" },
    { id: "q3", type: "mcq", prompt: "Where did her cat sit?", options: ["on the couch", "by the window", "on her lap", "in the kitchen"], answer: "on her lap" },
    { id: "q4", type: "mcq", prompt: "What did Lisa make in the morning?", options: ["coffee", "tea", "hot chocolate", "juice"], answer: "hot chocolate" },
    { id: "q5", type: "mcq", prompt: "What happened after lunch?", options: ["it kept raining", "the sun came out", "the cat ran away", "she went shopping"], answer: "the sun came out" },
  ]),

  exercise("reading", "informational-text-vaccines", "Reading: How Vaccines Work", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "What does a vaccine teach the body?", options: ["to ignore threats", "to recognize threats early", "to produce sugar", "to make hormones"], answer: "to recognize threats early" },
    { id: "q2", type: "mcq", prompt: "Vaccines may contain:", options: ["only live viruses", "weakened, dead, or piece-of-a virus", "antibiotics", "stem cells"], answer: "weakened, dead, or piece-of-a virus" },
    { id: "q3", type: "mcq", prompt: "What do antibodies do?", options: ["heal wounds", "latch onto invaders", "create new cells", "digest food"], answer: "latch onto invaders" },
    { id: "q4", type: "mcq", prompt: "What happens when the real pathogen appears?", options: ["the body is helpless", "the immune system reacts quickly", "the body needs another vaccine", "you get sick anyway"], answer: "the immune system reacts quickly" },
    { id: "q5", type: "mcq", prompt: "The article's main idea is:", options: ["vaccines are dangerous", "vaccines train the immune system", "antibiotics replace vaccines", "vaccines have no side effects"], answer: "vaccines train the immune system" },
  ]),

  exercise("reading", "ad-and-inference", "Reading: Job Advert Inference", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "The advert says \"native speaker preferred\". The job:", options: ["requires fluent English", "requires writing in Spanish", "is unpaid", "is remote only"], answer: "requires fluent English" },
    { id: "q2", type: "mcq", prompt: "Salary is \"competitive\". This means:", options: ["very low", "exact amount given", "in line with the market", "negotiable but minimum wage"], answer: "in line with the market" },
    { id: "q3", type: "mcq", prompt: "\"Hybrid working\" means:", options: ["fully office", "fully remote", "a mix of remote and office", "part-time only"], answer: "a mix of remote and office" },
    { id: "q4", type: "mcq", prompt: "\"Applications close on the 15th\" means:", options: ["interviews start the 15th", "you must apply by the 15th", "the job starts the 15th", "you must call on the 15th"], answer: "you must apply by the 15th" },
    { id: "q5", type: "mcq", prompt: "\"Three years' experience required\" suggests:", options: ["entry level", "junior level", "mid-level", "executive level"], answer: "mid-level" },
  ]),

  exercise("reading", "news-headline-meaning", "Reading: News Headlines", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "\"Tech giant slashes prices ahead of holiday\" — what does \"slashes\" mean?", options: ["raises", "removes", "lowers sharply", "keeps the same"], answer: "lowers sharply" },
    { id: "q2", type: "mcq", prompt: "\"Government to unveil new climate plan\" — \"unveil\" means:", options: ["cancel", "introduce publicly", "vote against", "delay"], answer: "introduce publicly" },
    { id: "q3", type: "mcq", prompt: "\"Talks stall as deadline looms\" — \"stall\" means:", options: ["accelerate", "stop progressing", "improve", "finish successfully"], answer: "stop progressing" },
    { id: "q4", type: "mcq", prompt: "\"Storm batters coast\" — \"batters\" means:", options: ["lightly touches", "hits violently", "avoids", "warms"], answer: "hits violently" },
    { id: "q5", type: "mcq", prompt: "\"Inflation eases for third month\" — \"eases\" means:", options: ["worsens", "ends", "lessens", "doubles"], answer: "lessens" },
  ]),

  exercise("reading", "instructions-following", "Reading: Following Instructions", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "\"Preheat the oven to 180°C before baking.\" What do you do first?", options: ["mix the batter", "heat the oven", "open the oven", "wash the pan"], answer: "heat the oven" },
    { id: "q2", type: "mcq", prompt: "\"Plug in the device for at least 30 minutes before first use.\" You should:", options: ["use it immediately", "charge for half an hour", "skip charging", "wash it first"], answer: "charge for half an hour" },
    { id: "q3", type: "mcq", prompt: "\"Apply twice daily after meals.\" When do you take it?", options: ["before breakfast only", "two times a day, after eating", "once a week", "before sleep only"], answer: "two times a day, after eating" },
    { id: "q4", type: "mcq", prompt: "\"Do not exceed three tablets per day.\" The max per day is:", options: ["1", "2", "3", "4"], answer: "3" },
    { id: "q5", type: "mcq", prompt: "\"Hand wash only — do not tumble dry.\" You can:", options: ["machine wash", "tumble dry", "hand wash", "iron at high heat"], answer: "hand wash" },
  ]),

  exercise("reading", "letter-of-complaint", "Reading: A Letter of Complaint", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "The writer is mainly:", options: ["happy", "asking for information", "complaining", "thanking the company"], answer: "complaining" },
    { id: "q2", type: "mcq", prompt: "What outcome do they want?", options: ["a job", "a refund", "a discount on next purchase", "an apology only"], answer: "a refund" },
    { id: "q3", type: "mcq", prompt: "The tone is best described as:", options: ["angry and rude", "firm but polite", "joking", "uncertain"], answer: "firm but polite" },
    { id: "q4", type: "mcq", prompt: "They mention attaching:", options: ["a photo", "a video", "a receipt", "a contract"], answer: "a receipt" },
    { id: "q5", type: "mcq", prompt: "If unresolved, they will:", options: ["forget about it", "post on social media", "contact a consumer protection agency", "buy another product"], answer: "contact a consumer protection agency" },
  ]),

  // ===== Speaking =====
  exercise("speaking", "introducing-yourself", "Introducing Yourself", "A1", "fill", [
    { id: "q1", type: "fill", prompt: "Complete: \"Hello, my name ____ Maria.\"", answer: "is" },
    { id: "q2", type: "fill", prompt: "Complete: \"I'm ____ Spain.\"", answer: "from" },
    { id: "q3", type: "fill", prompt: "Complete: \"I ____ in Madrid.\"", answer: "live" },
    { id: "q4", type: "fill", prompt: "Complete: \"I ____ 27 years old.\"", answer: "am" },
    { id: "q5", type: "fill", prompt: "Complete: \"Nice to ____ you.\"", answer: "meet" },
  ]),

  exercise("speaking", "describing-people", "Describing People", "A2", "fill", [
    { id: "q1", type: "fill", prompt: "My sister has long ____ hair (color: yellow).", answer: "blonde" },
    { id: "q2", type: "fill", prompt: "He's quite ____ (opposite of short).", answer: "tall" },
    { id: "q3", type: "fill", prompt: "She has blue ____.", answer: "eyes" },
    { id: "q4", type: "fill", prompt: "He always wears ____ (eye accessory).", answer: "glasses" },
    { id: "q5", type: "fill", prompt: "She is very ____ — she always helps others.", answer: "kind" },
  ]),

  exercise("speaking", "asking-for-clarification", "Asking for Clarification", "B1", "match", [
    { id: "q1", type: "match", prompt: "Match the situation with the right response.", pairs: [
      { left: "You didn't hear them", right: "Sorry, could you repeat that?" },
      { left: "You don't understand a word", right: "What does that mean?" },
      { left: "They spoke too fast", right: "Could you slow down, please?" },
      { left: "You need confirmation", right: "Just to confirm: did you say…?" },
    ], answer: "auto" },
  ]),

  exercise("speaking", "giving-opinions", "Giving Opinions", "B2", "fill", [
    { id: "q1", type: "fill", prompt: "\"In my ____, this is the best option.\"", answer: "opinion" },
    { id: "q2", type: "fill", prompt: "\"As ____ as I'm concerned, the data is clear.\"", answer: "far" },
    { id: "q3", type: "fill", prompt: "\"It seems to ____ that we need more time.\"", answer: "me" },
    { id: "q4", type: "fill", prompt: "\"From my ____ of view, it's a fair offer.\"", answer: "point" },
    { id: "q5", type: "fill", prompt: "\"I'd say it's ____ a great idea.\" (filler/intensifier)", answer: "really" },
  ]),

  exercise("speaking", "small-talk", "Small Talk Starters", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Best small-talk opener at work on Monday?", options: ["What are your political views?", "How was your weekend?", "How much do you earn?", "Why are you late?"], answer: "How was your weekend?" },
    { id: "q2", type: "mcq", prompt: "Polite weather opener:", options: ["The weather is terrible, isn't it?", "Lovely day, isn't it?", "Why is it so hot in here?", "Don't talk to me about weather."], answer: "Lovely day, isn't it?" },
    { id: "q3", type: "mcq", prompt: "Safe travel question:", options: ["Why did you go alone?", "Have you been on holiday recently?", "How much did your trip cost?", "Did you cheat on your taxes?"], answer: "Have you been on holiday recently?" },
    { id: "q4", type: "mcq", prompt: "Friendly response to \"How are you?\":", options: ["None of your business.", "Pretty good, thanks. You?", "What do you mean?", "I'd rather not say."], answer: "Pretty good, thanks. You?" },
    { id: "q5", type: "mcq", prompt: "Good way to end a chat politely:", options: ["I have to go now, nice talking to you!", "Bye, I'm bored.", "Stop talking to me.", "I don't want to talk."], answer: "I have to go now, nice talking to you!" },
  ]),

  exercise("speaking", "phone-english", "Phone English Phrases", "B1", "match", [
    { id: "q1", type: "match", prompt: "Match the phone phrase with its meaning.", pairs: [
      { left: "Hold on a moment", right: "Please wait" },
      { left: "Could I take a message?", right: "Offering to write a note" },
      { left: "I'll put you through", right: "Connecting your call" },
      { left: "Speaking", right: "I am the person you asked for" },
    ], answer: "auto" },
  ]),

  // ===== Writing =====
  exercise("writing", "sentence-punctuation", "Sentence Punctuation", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Which is correctly punctuated?", options: ["where are you going", "Where are you going?", "where are you going.", "Where are you going!"], answer: "Where are you going?" },
    { id: "q2", type: "mcq", prompt: "Which uses a comma correctly?", options: ["I bought apples bananas, and oranges.", "I bought apples, bananas and oranges.", "I bought, apples bananas and oranges.", "I bought apples bananas and, oranges."], answer: "I bought apples, bananas and oranges." },
    { id: "q3", type: "mcq", prompt: "Which is a complete sentence?", options: ["Because it rained.", "Running fast.", "She smiled.", "The cat under."], answer: "She smiled." },
    { id: "q4", type: "mcq", prompt: "Which sentence is correctly capitalized?", options: ["i live in london.", "I live in London.", "I live in london.", "i Live In London."], answer: "I live in London." },
    { id: "q5", type: "mcq", prompt: "Where does the question mark go? \"Are you coming\"", options: ["?", ".", "!", ","], answer: "?" },
  ]),

  exercise("writing", "linking-words", "Linking Words", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "I was tired, ____ I kept working.", options: ["because", "however", "so", "and"], answer: "however" },
    { id: "q2", type: "mcq", prompt: "It was cold, ____ we wore coats.", options: ["but", "however", "so", "because"], answer: "so" },
    { id: "q3", type: "mcq", prompt: "She studies hard ____ she wants to pass.", options: ["because", "but", "however", "so"], answer: "because" },
    { id: "q4", type: "mcq", prompt: "____ the rain, we went out.", options: ["Because of", "Despite", "So", "Therefore"], answer: "Despite" },
    { id: "q5", type: "mcq", prompt: "____, the train was delayed.", options: ["Because", "Furthermore", "Despite", "So"], answer: "Furthermore" },
  ]),

  exercise("writing", "formal-vs-informal", "Formal vs Informal", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Formal version of \"Hi\":", options: ["Hey", "Yo", "Dear Sir/Madam", "Sup"], answer: "Dear Sir/Madam" },
    { id: "q2", type: "mcq", prompt: "Formal version of \"Thanks\":", options: ["Cheers", "Ta", "Thank you very much", "TY"], answer: "Thank you very much" },
    { id: "q3", type: "mcq", prompt: "Formal version of \"I want to\":", options: ["I wanna", "I would like to", "I'd like 2", "I gotta"], answer: "I would like to" },
    { id: "q4", type: "mcq", prompt: "Formal way to end an email:", options: ["Bye!", "Later", "Yours sincerely,", "Peace out"], answer: "Yours sincerely," },
    { id: "q5", type: "mcq", prompt: "Formal version of \"Sorry about that\":", options: ["My bad", "Oops", "I apologise for the inconvenience", "Whoops"], answer: "I apologise for the inconvenience" },
  ]),

  exercise("writing", "essay-structure", "Essay Structure Basics", "B2", "match", [
    { id: "q1", type: "match", prompt: "Match each essay part with its purpose.", pairs: [
      { left: "Introduction", right: "States your topic and thesis" },
      { left: "Body paragraph", right: "Develops one main point with evidence" },
      { left: "Topic sentence", right: "States the main idea of a paragraph" },
      { left: "Conclusion", right: "Summarises and restates the thesis" },
    ], answer: "auto" },
  ]),

  exercise("writing", "email-greetings-closings", "Email Greetings & Closings", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Best opening for a job application:", options: ["Hey there", "Dear Hiring Manager,", "Yo", "Hi y'all"], answer: "Dear Hiring Manager," },
    { id: "q2", type: "mcq", prompt: "Best closing for a formal email:", options: ["TTYL", "Cheers!", "Kind regards,", "Bye"], answer: "Kind regards," },
    { id: "q3", type: "mcq", prompt: "Informal greeting to a colleague:", options: ["To whom it may concern", "Hi James,", "Esteemed Mr. James,", "Greetings"], answer: "Hi James," },
    { id: "q4", type: "mcq", prompt: "Polite ask in email body:", options: ["Send me this now.", "Could you please send it?", "I want it now.", "Where is it?!"], answer: "Could you please send it?" },
    { id: "q5", type: "mcq", prompt: "Closing if you don't know the recipient's name:", options: ["Yours sincerely,", "Yours faithfully,", "Love,", "XOXO,"], answer: "Yours faithfully," },
  ]),

  exercise("writing", "paragraph-coherence", "Paragraph Coherence", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Which sentence best follows: \"Exercise has many benefits.\"", options: ["I love pizza.", "First, it improves your physical health.", "My cat is cute.", "The weather is nice today."], answer: "First, it improves your physical health." },
    { id: "q2", type: "mcq", prompt: "Which word adds an example?", options: ["however", "for instance", "therefore", "instead"], answer: "for instance" },
    { id: "q3", type: "mcq", prompt: "Which word shows contrast?", options: ["moreover", "in addition", "however", "as a result"], answer: "however" },
    { id: "q4", type: "mcq", prompt: "Which word shows result?", options: ["meanwhile", "similarly", "for example", "therefore"], answer: "therefore" },
    { id: "q5", type: "mcq", prompt: "A topic sentence should:", options: ["be a question", "introduce the paragraph's main idea", "be the last sentence", "never appear"], answer: "introduce the paragraph's main idea" },
  ]),

  // ===== Word Skills =====
  exercise("word-skills", "collocations-make-do", "Collocations: make vs do", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "We need to ____ a decision.", options: ["make", "do", "have", "take"], answer: "make" },
    { id: "q2", type: "mcq", prompt: "She has to ____ her homework.", options: ["make", "do", "have", "take"], answer: "do" },
    { id: "q3", type: "mcq", prompt: "I always ____ my bed in the morning.", options: ["make", "do", "have", "take"], answer: "make" },
    { id: "q4", type: "mcq", prompt: "Please ____ me a favor.", options: ["make", "do", "have", "take"], answer: "do" },
    { id: "q5", type: "mcq", prompt: "They will ____ a profit this year.", options: ["make", "do", "have", "take"], answer: "make" },
  ]),

  exercise("word-skills", "word-formation-noun-adj", "Word Formation: Noun ↔ Adjective", "B2", "fill", [
    { id: "q1", type: "fill", prompt: "danger → adjective: ____", answer: "dangerous" },
    { id: "q2", type: "fill", prompt: "beauty → adjective: ____", answer: "beautiful" },
    { id: "q3", type: "fill", prompt: "decide → noun: ____", answer: "decision" },
    { id: "q4", type: "fill", prompt: "happy → noun: ____", answer: "happiness" },
    { id: "q5", type: "fill", prompt: "create → noun: ____", answer: "creation" },
  ]),

  exercise("word-skills", "prefixes-un-in-dis", "Prefixes: un- / in- / dis-", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Opposite of \"happy\":", options: ["unhappy", "inhappy", "dishappy", "anhappy"], answer: "unhappy" },
    { id: "q2", type: "mcq", prompt: "Opposite of \"agree\":", options: ["unagree", "inagree", "disagree", "misagree"], answer: "disagree" },
    { id: "q3", type: "mcq", prompt: "Opposite of \"possible\":", options: ["unpossible", "impossible", "dispossible", "anpossible"], answer: "impossible" },
    { id: "q4", type: "mcq", prompt: "Opposite of \"like\":", options: ["unlike", "dislike", "inlike", "mislike"], answer: "dislike" },
    { id: "q5", type: "mcq", prompt: "Opposite of \"polite\":", options: ["unpolite", "impolite", "dispolite", "anpolite"], answer: "impolite" },
  ]),

  exercise("word-skills", "idioms-common", "Common Idioms", "B2", "match", [
    { id: "q1", type: "match", prompt: "Match each idiom with its meaning.", pairs: [
      { left: "Hit the books", right: "Study hard" },
      { left: "Piece of cake", right: "Very easy" },
      { left: "Under the weather", right: "Feeling ill" },
      { left: "Cost an arm and a leg", right: "Very expensive" },
    ], answer: "auto" },
  ]),

  exercise("word-skills", "false-friends-en-es", "False Friends (EN↔ES)", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "\"Embarrassed\" in English means:", options: ["pregnant", "ashamed", "bored", "tired"], answer: "ashamed" },
    { id: "q2", type: "mcq", prompt: "\"Actually\" means:", options: ["currently", "in reality", "presently", "annually"], answer: "in reality" },
    { id: "q3", type: "mcq", prompt: "\"Library\" means:", options: ["bookshop", "place to borrow books", "stationery store", "newspaper office"], answer: "place to borrow books" },
    { id: "q4", type: "mcq", prompt: "\"Carpet\" means:", options: ["folder", "rug for the floor", "briefcase", "paper file"], answer: "rug for the floor" },
    { id: "q5", type: "mcq", prompt: "\"Assist\" means:", options: ["attend", "help", "watch", "register"], answer: "help" },
  ]),

  exercise("word-skills", "homophones", "Homophones", "A2", "mcq", [
    { id: "q1", type: "mcq", prompt: "I can ____ you clearly. (hear/here)", options: ["hear", "here", "heir", "ear"], answer: "hear" },
    { id: "q2", type: "mcq", prompt: "I have ____ books. (two/to/too)", options: ["to", "too", "two", "tow"], answer: "two" },
    { id: "q3", type: "mcq", prompt: "It's ____ cold today. (to/too/two)", options: ["to", "too", "two", "tow"], answer: "too" },
    { id: "q4", type: "mcq", prompt: "We will go ____ the park. (their/there)", options: ["their", "there", "they're", "thier"], answer: "there" },
    { id: "q5", type: "mcq", prompt: "Please write ____ your name. (your/you're)", options: ["your", "you're", "yore", "you'r"], answer: "your" },
  ]),

  // ===== Business English =====
  exercise("business", "meeting-vocabulary", "Meeting Vocabulary", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "The list of topics for a meeting is the ____.", options: ["minutes", "agenda", "memo", "brief"], answer: "agenda" },
    { id: "q2", type: "mcq", prompt: "The written record of what was said is the ____.", options: ["minutes", "agenda", "report", "diary"], answer: "minutes" },
    { id: "q3", type: "mcq", prompt: "A list of tasks to complete after a meeting are ____.", options: ["action items", "headlines", "captions", "summaries"], answer: "action items" },
    { id: "q4", type: "mcq", prompt: "The person leading the meeting is the ____.", options: ["chair", "stool", "table", "host"], answer: "chair" },
    { id: "q5", type: "mcq", prompt: "When you can't attend, you send ____.", options: ["regrets", "apologies", "RSVP", "love"], answer: "apologies" },
  ]),

  exercise("business", "email-tone", "Email Tone", "B2", "mcq", [
    { id: "q1", type: "mcq", prompt: "Most professional opening:", options: ["Hey,", "Hi there!", "Dear Mr. Lee,", "Yo Lee"], answer: "Dear Mr. Lee," },
    { id: "q2", type: "mcq", prompt: "Best way to follow up after no response:", options: ["WHY HAVEN'T YOU REPLIED?!", "I'm following up on my email below.", "Are you ignoring me?", "Just checking — did you see it lol"], answer: "I'm following up on my email below." },
    { id: "q3", type: "mcq", prompt: "Best way to decline politely:", options: ["No way.", "I'm afraid we'll have to pass on this one.", "Nope.", "Hard pass."], answer: "I'm afraid we'll have to pass on this one." },
    { id: "q4", type: "mcq", prompt: "Best way to apologise for a late reply:", options: ["Sorry I forgot.", "Apologies for the delayed response.", "My bad.", "Whoops."], answer: "Apologies for the delayed response." },
    { id: "q5", type: "mcq", prompt: "Best way to confirm next step:", options: ["See ya.", "I will send the report by Friday.", "K thx.", "Maybe later."], answer: "I will send the report by Friday." },
  ]),

  exercise("business", "presentation-language", "Presentation Language", "B2", "fill", [
    { id: "q1", type: "fill", prompt: "\"____ everyone, thank you for coming.\"", answer: "Welcome" },
    { id: "q2", type: "fill", prompt: "\"Today I'd like to ____ our Q3 results.\"", answer: "present" },
    { id: "q3", type: "fill", prompt: "\"As you can ____ from this slide, sales grew 15%.\"", answer: "see" },
    { id: "q4", type: "fill", prompt: "\"To ____ up, our priorities for next quarter are…\"", answer: "sum" },
    { id: "q5", type: "fill", prompt: "\"Are there any ____?\" (to invite Q&A)", answer: "questions" },
  ]),

  exercise("business", "negotiation-phrases", "Negotiation Phrases", "C1", "match", [
    { id: "q1", type: "match", prompt: "Match each phrase with its purpose.", pairs: [
      { left: "Would you consider…?", right: "Suggesting an alternative" },
      { left: "I'm afraid that won't work for us.", right: "Polite refusal" },
      { left: "Let me get back to you on that.", right: "Buying time" },
      { left: "What if we…?", right: "Proposing a compromise" },
    ], answer: "auto" },
  ]),

  exercise("business", "job-titles-departments", "Job Titles & Departments", "B1", "mcq", [
    { id: "q1", type: "mcq", prompt: "Who designs the brand and ad campaigns?", options: ["Engineering", "Marketing", "Finance", "Legal"], answer: "Marketing" },
    { id: "q2", type: "mcq", prompt: "Who handles employee benefits and hiring?", options: ["HR", "Sales", "IT", "Operations"], answer: "HR" },
    { id: "q3", type: "mcq", prompt: "Who writes the code?", options: ["Engineering", "Marketing", "HR", "Procurement"], answer: "Engineering" },
    { id: "q4", type: "mcq", prompt: "Who handles money matters?", options: ["Finance", "Sales", "Legal", "HR"], answer: "Finance" },
    { id: "q5", type: "mcq", prompt: "The top executive of a company is the ____.", options: ["CEO", "CIO", "CTO", "CMO"], answer: "CEO" },
  ]),

  exercise("business", "report-writing-phrases", "Report Writing Phrases", "C1", "fill", [
    { id: "q1", type: "fill", prompt: "\"This report ____ to analyze our Q3 performance.\"", answer: "aims" },
    { id: "q2", type: "fill", prompt: "\"The data was ____ from three sources.\"", answer: "gathered" },
    { id: "q3", type: "fill", prompt: "\"In ____, sales increased by 12%.\"", answer: "conclusion" },
    { id: "q4", type: "fill", prompt: "\"We ____ that the company invest in marketing.\"", answer: "recommend" },
    { id: "q5", type: "fill", prompt: "\"Further ____ is needed to confirm these results.\"", answer: "research" },
  ]),
];

// =============================================
// WRITE EVERYTHING
// =============================================

let lessonCount = 0;
let exerciseCount = 0;

for (const { file, data } of LESSONS) {
  writeJson(file, data);
  lessonCount++;
}

for (const { file, data } of EXERCISES) {
  writeJson(file, data);
  exerciseCount++;
}

console.log(`✓ Wrote ${lessonCount} lessons and ${exerciseCount} exercises.`);
