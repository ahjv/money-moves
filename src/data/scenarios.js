const scenarios = [
  {
    id: 1,
    title: "You Got Your First Job!",
    description:
      "You just started a part-time job earning $500/month. What will you do with your first paycheck?",
    choices: [
      {
        text: "Buy new clothes and gadgets ($400), save $100",
        impact: { savings: 100, spending: 400 },
        result:
          "You treated yourself — but didn’t build much of a savings buffer.",
      },
      {
        text: "Save $300, spend $200 on essentials",
        impact: { savings: 300, spending: 200 },
        result:
          "Nice balance! You’re building good habits by prioritizing savings.",
      },
      {
        text: "Spend the entire $500",
        impact: { savings: 0, spending: 500 },
        result:
          "Feels good in the moment — but you might regret having $0 saved later.",
      },
    ],
  },
  {
    id: 2,
    title: "Credit Card Temptation",
    description:
      "You get your first credit card with a $1000 limit. You’re tempted to buy a $900 gaming PC. What do you do?",
    choices: [
      {
        text: "Buy it! I’ll pay it off over time",
        impact: { debt: 900 },
        result:
          "You’re now carrying a large balance. If unpaid, interest can rack up fast.",
      },
      {
        text: "Wait and save up instead",
        impact: { savings: 100 },
        result:
          "Smart — avoiding debt and building savings puts you in control.",
      },
      {
        text: "Use $300 in savings and charge $600",
        impact: { savings: -300, debt: 600 },
        result:
          "A compromise, but you’ve drained savings and still owe a lot.",
      },
    ],
  },
  {
    id: 3,
    title: "Emergency Fund Moment",
    description:
      "Your car breaks down. Repairs cost $600. You only have $250 in savings.",
    choices: [
      {
        text: "Use savings and borrow the rest from a friend",
        impact: { savings: -250, debt: 350 },
        result:
          "Good fallback — you avoided high-interest debt, but you owe someone now.",
      },
      {
        text: "Put it all on a high-interest credit card",
        impact: { debt: 600 },
        result:
          "Problem solved — but interest will add up quickly if you don’t pay it off.",
      },
      {
        text: "Take the bus for a month and save",
        impact: { savings: 100 },
        result:
          "Tough choice, but you avoided debt and bought yourself time.",
      },
    ],
  },
];

export default scenarios;
