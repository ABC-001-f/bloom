## Inspiration

Online learners start strong and then quietly drift away. In a large study of MIT and Harvard courses on edX, only about **3%** of learners who enrolled in 2017–18 went on to complete their courses (Reich & Ruipérez-Valiente, *Science*, 2019).

It's rarely a lack of motivation on day one. Progress is invisible, a missed day feels like failure, and most learning dashboards look like spreadsheets. We wanted to build a dashboard people would actually *want* to open.

## What it does

BloomOS turns learning into a living garden. Every skill you learn becomes a plant, and each lesson waters it, so it grows from seed to sprout to full bloom.

- **Three-question onboarding:** your name, what you want to grow, and a daily "watering" goal. You can start with sample progress or a fresh garden.
- **Home:** today's goal, one clear "continue" lesson, an interactive garden scene (tap the water to make ripples), and a weekly activity chart.
- **One small step:** every lesson is a single card with a tip, a three-item checklist and an optional 10-minute focus timer.
- **My Garden:** each course is a plant that grows with your progress. Plant health is shown as Thriving, Thirsty or Wilting, never as red failure states.
- **Goals:** goals linked to a course track themselves. You count the others by hand.
- **Achievements:** 12 badges. Locked ones show exactly how close you are.
- **Community "Greenhouse":** posts, cheers, weekly prompts and a friendly leaderboard.
- **Delight:** a blooming-lotus preloader, falling petals when you hit your daily goal, and a dawn garden that turns into a night garden in dark mode.

## How we built it

- Hand-written **HTML, CSS and JavaScript**, with no frameworks and no build step.
- One **design-token system** drives both themes and all four accent colours.
- All state lives in **`localStorage`** and never leaves your device. You can export, import or reset your data.
- The animated water is a `<canvas>`, the plants are generated SVG, and the preloader is inline SVG with CSS animation.
- A small inline script applies your saved theme before the page first appears, so it never flashes the wrong theme.

## Challenges we ran into

- **Making both themes feel designed, not inverted.** The garden scene has its own dawn and night palettes instead of swapped colours.
- **Keeping lots of motion while respecting users.** Ripples, a floating lotus and falling petals can all be turned off, and the operating system's "reduce motion" setting is honoured automatically.
- **Showing the whole product without overwhelming new users.** We solved this by letting onboarding offer sample progress or a fresh start.

## Accomplishments that we're proud of

- A **gentle, guilt-free design**: plants get "thirsty" instead of showing errors, and a streak survives until the day actually ends.
- **Accessibility built in from the start:**
  - light, dark and system themes
  - a text-size setting
  - full keyboard support (skip link, `/` or `Ctrl+K` search, focus kept inside dialogs)
  - Windows high-contrast mode support
  - status never shown by colour alone
- A fully responsive layout, from small phones (with a bottom navigation dock) to wide desktops.
- A polished, working prototype with no dependencies. Just open `index.html`.

## What we learned

- **Metaphor is powerful UX.** A growing plant explains progress better than a percentage ever could.
- **Accessibility shapes design for the better.** Pairing every colour with an icon and a label made the whole interface clearer for everyone.
- **Small details build trust.** Applying the theme before first paint, asking for confirmation right where you clicked, and making motion optional all make the app feel calm and reliable.
- **Vanilla web tech goes a long way.** Design tokens, SVG and canvas were enough to build a rich, animated experience.

## What's next for BloomOS — your mind, made visible

- Real course content and integrations with existing learning platforms.
- Accounts and sync across devices.
- Shared "community gardens" for study groups and classrooms.
- Gentle reminders delivered as notifications.
